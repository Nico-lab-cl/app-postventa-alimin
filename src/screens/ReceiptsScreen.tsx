import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image, RefreshControl, Platform, ScrollView, Modal, SafeAreaView, Linking, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, ArrowLeft, FileText, ShieldCheck, CheckCircle, Clock, Download } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ledgerService } from '../api/ledgerService';
import { API_BASE_URL } from '../api/client';
import apiClient from '../api/client';
import { useAuth } from '../store/AuthContext';
import { storage } from '../utils/storage';

const ReceiptsScreen = () => {
    const queryClient = useQueryClient();
    const { signOut } = useAuth();
    const navigation = useNavigation<any>();
    
    const [viewerConfig, setViewerConfig] = React.useState<{ visible: boolean, url: string, type: 'image' | 'pdf', title: string, isLoading: boolean }>({ visible: false, url: '', type: 'image', title: '', isLoading: false });
    const [localBlobUrl, setLocalBlobUrl] = React.useState<string | null>(null);
    const [rejectionModal, setRejectionModal] = React.useState<{ visible: boolean, id: string, reason: string }>({ visible: false, id: '', reason: '' });
    const { userToken } = useAuth();

    const getFileConfig = (url: string) => {
        if (!url) return { url: '', type: 'image' as const, isBase64: false };
        
        // Check if it's Base64
        const isBase64 = url.startsWith('data:');
        if (isBase64) {
            const type = url.includes('application/pdf') ? 'pdf' : 'image';
            return { url, type: type as 'pdf' | 'image', isBase64: true };
        }

        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
        const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url.substring(1) : url}`;
        const isPdf = absoluteUrl.toLowerCase().split('?')[0].endsWith('.pdf');
        return { url: absoluteUrl, type: (isPdf ? 'pdf' : 'image') as const, isBase64: false };
    };

    React.useEffect(() => {
        if (viewerConfig.visible && viewerConfig.type === 'pdf' && Platform.OS === 'web') {
            const fetchPdf = async () => {
                try {
                    setViewerConfig(prev => ({ ...prev, isLoading: true }));
                    const response = await apiClient.get(viewerConfig.url, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(response.data);
                    setLocalBlobUrl(url);
                } catch (e) {
                    console.error('Error fetching PDF:', e);
                } finally {
                    setViewerConfig(prev => ({ ...prev, isLoading: false }));
                }
            };
            fetchPdf();
        }
        return () => {
            if (localBlobUrl) {
                window.URL.revokeObjectURL(localBlobUrl);
                setLocalBlobUrl(null);
            }
        };
    }, [viewerConfig.visible, viewerConfig.url]);

    const handleDownload = async () => {
        if (Platform.OS === 'web') {
            try {
                setViewerConfig(prev => ({...prev, isLoading: true}));
                const link = document.createElement('a');
                link.href = viewerConfig.url;
                const extension = viewerConfig.url.includes('application/pdf') ? 'pdf' : 
                                 viewerConfig.url.includes('msword') || viewerConfig.url.includes('officedocument.wordprocessingml') ? 'docx' :
                                 viewerConfig.url.includes('ms-excel') || viewerConfig.url.includes('officedocument.spreadsheetml') ? 'xlsx' : 'jpg';
                link.download = `Alimin_${viewerConfig.title.replace(/\s+/g, '_')}.${extension}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) {
                Alert.alert('Error', 'No se pudo descargar el archivo.');
            } finally {
                setViewerConfig(prev => ({...prev, isLoading: false}));
            }
            return;
        }

        try {
            setViewerConfig(prev => ({...prev, isLoading: true}));
            
            const isBase64 = viewerConfig.url.startsWith('data:');
            const extension = viewerConfig.url.includes('application/pdf') ? 'pdf' : 
                             viewerConfig.url.includes('msword') || viewerConfig.url.includes('officedocument.wordprocessingml') ? 'docx' :
                             viewerConfig.url.includes('ms-excel') || viewerConfig.url.includes('officedocument.spreadsheetml') ? 'xlsx' : 'jpg';
            
            const fileUri = FileSystem.documentDirectory + `Alimin_${viewerConfig.title.replace(/\s+/g, '_')}.${extension}`;

            if (isBase64) {
                // Remove prefix if exists for writing to file
                const base64Data = viewerConfig.url.split(',')[1] || viewerConfig.url;
                await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
                
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                }
            } else {
                // Traditional URL download
                const urlWithToken = viewerConfig.url.includes('?') 
                    ? `${viewerConfig.url}&token=${userToken}` 
                    : `${viewerConfig.url}?token=${userToken}`;
                
                Alert.alert(
                    'Descargar Archivo',
                    '¿Cómo deseas procesar este archivo?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Abrir en Navegador', onPress: () => Linking.openURL(urlWithToken) },
                        { 
                            text: 'Compartir/Guardar', 
                            onPress: async () => {
                                try {
                                    const { uri } = await FileSystem.downloadAsync(
                                        viewerConfig.url, 
                                        fileUri,
                                        { headers: userToken ? { 'Authorization': `Bearer ${userToken}` } : {} }
                                    );
                                    if (await Sharing.isAvailableAsync()) {
                                        await Sharing.shareAsync(uri);
                                    }
                                } catch (e) {
                                    Alert.alert('Error', 'No se pudo procesar la descarga.');
                                }
                            }
                        }
                    ]
                );
            }
        } catch (e) {
            console.error('Download error:', e);
            Alert.alert('Error', 'No se pudo procesar el archivo.');
        } finally {
            setViewerConfig(prev => ({...prev, isLoading: false}));
        }
    };
    
    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['receipts'],
        queryFn: () => ledgerService.getReceipts(),
    });

    const mutation = useMutation({
        mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) => 
            ledgerService.verifyReceipt(id, action, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['receipts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
            queryClient.invalidateQueries({ queryKey: ['ledger', 'ALERTS'] });
            setRejectionModal({ visible: false, id: '', reason: '' });
            Alert.alert('Éxito', 'El recibo ha sido procesado correctamente');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.error || 'No se pudo procesar el recibo';
            Alert.alert('Error', msg);
        }
    });

    const formatDate = (isoText: string) => {
        const d = new Date(isoText);
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const ReceiptCard = ({ item }: { item: any }) => (
        <View className="bg-[#1e2a2d]/90 p-5 rounded-2xl mb-4 border border-white/5 flex-col">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-2">
                    {item.status === 'APPROVED' ? <CheckCircle color="#2db395" size={16} /> : 
                     item.status === 'REJECTED' ? <X color="#ffb4ab" size={16} /> : 
                     <Clock color="#edc062" size={16} />}
                     <Text className="text-on-surface font-display font-bold text-base">{item.customerName}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-primary font-display font-black text-base">${item.amount.toLocaleString()}</Text>
                    {item.rut && <Text className="text-on-surface-variant text-[9px] font-mono mt-0.5">{item.rut}</Text>}
                </View>
            </View>

            <View className="flex-row justify-between mb-4 mt-1 px-1">
                <View>
                    <Text className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider mb-1">Fecha</Text>
                    <Text className="text-on-surface text-xs font-mono">{formatDate(item.date)}</Text>
                </View>
                <View>
                    <Text className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider mb-1">Terreno</Text>
                    <Text className="text-on-surface text-xs font-mono">L. {item.lotNumber} (E{item.stage || '-'})</Text>
                </View>
                <View>
                    <Text className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider mb-1">Tipo</Text>
                    <Text className="text-on-surface text-xs font-mono">{item.scope === 'PIE' ? 'Pie' : `${item.installmentsCount || 1} Cuota(s)`}</Text>
                </View>
                <View>
                    <Text className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider mb-1">Estado</Text>
                    <Text className={`text-xs font-mono font-bold ${item.status === 'APPROVED' ? 'text-emerald-400' : item.status === 'REJECTED' ? 'text-error' : 'text-[#edc062]'}`}>
                        {item.status === 'APPROVED' ? 'Aprobado' : item.status === 'REJECTED' ? 'Rechazado' : 'Pendiente'}
                    </Text>
                </View>
            </View>

            <View className="flex-row flex-wrap justify-between items-center border-t border-white/10 pt-4 mt-2 gap-y-3">
                <View className="flex-row gap-2 flex-wrap">
                    <TouchableOpacity 
                        className="bg-black/40 px-3 py-2 rounded-xl border border-white/10 flex-row items-center gap-1.5"
                        onPress={() => {
                            const config = getFileConfig(item.imageUrl);
                            setViewerConfig({ 
                                visible: true, 
                                url: config.url, 
                                type: config.type, 
                                title: `Lote ${item.lotNumber}`, 
                                isLoading: false 
                            });
                        }}
                    >
                        <FileText color="#8b9293" size={14} />
                        <Text className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">Ver Cliente</Text>
                    </TouchableOpacity>

                    {item.status === 'APPROVED' && (
                        <TouchableOpacity 
                            className="bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 flex-row items-center gap-1.5"
                            onPress={() => {
                                const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
                                const receiptUrl = `${baseUrl}receipt/${item.id}/pdf?token=${userToken}`;
                                Linking.openURL(receiptUrl);
                            }}
                        >
                            <ShieldCheck color="#2db395" size={14} />
                            <Text className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest">Recibo Oficial</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                {item.status === 'PENDING' && (
                    <View className="flex-row gap-2">
                        <TouchableOpacity 
                            onPress={() => setRejectionModal({ visible: true, id: item.id, reason: '' })}
                            disabled={mutation.isLoading}
                            className="bg-error/10 px-3 py-2 rounded-xl flex-row items-center border border-error/20"
                        >
                            <Text className="text-error font-bold text-[10px] uppercase tracking-wider">Rechazar</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => mutation.mutate({ id: item.id, action: 'approve' })}
                            disabled={mutation.isLoading}
                            className="bg-primary/90 px-4 py-2 rounded-xl flex-row items-center shadow-lg shadow-primary/20"
                        >
                            {mutation.isLoading ? (
                                <ActivityIndicator size="small" color="#0f353b" />
                            ) : (
                                <Text className="text-[#0f353b] font-black text-[10px] uppercase tracking-wider">Aprobar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <View 
                className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 h-24 bg-neutral-950/80"
                style={{ paddingTop: Platform.OS === 'ios' ? 44 : 34 }}
            >
                <LinearGradient 
                    colors={['rgba(54, 89, 95, 0.15)', 'transparent']} 
                    className="absolute inset-0"
                />
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => signOut()}>
                        <ArrowLeft color="#a8cdd4" size={24} />
                    </TouchableOpacity>
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Recibos</Text>
                </View>
                <View className="flex-row items-center gap-4">
                    <ShieldCheck color="#edc062" size={24} />
                </View>
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a8cdd4" />
                }
            >
                <View className="px-6 max-w-5xl mx-auto w-full">
                    <View className="mb-10">
                        <Text className="font-display text-on-surface-variant tracking-wide uppercase text-[10px] mb-2">Auditoría Financiera</Text>
                        <Text className="font-display font-bold text-4xl tracking-tight text-on-surface mb-2">Gestión de Recibos</Text>
                        <View className="h-1 w-12 bg-primary rounded-full" />
                    </View>

                    <View className="flex-row gap-6 mb-12 h-32">
                        <View className="flex-1 bg-[#1e2a2d]/60 p-6 rounded-3xl border border-primary-container/20 justify-between overflow-hidden">
                            <View className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full" />
                            <View className="flex-row items-center gap-3">
                                <CheckCircle color="#a8cdd4" size={20} />
                                <Text className="font-display font-medium text-on-surface-variant text-[10px] uppercase tracking-widest">Habilitados</Text>
                            </View>
                            <Text className="text-3xl font-display font-black text-primary tracking-tighter">{data?.filter((r: any) => r.status === 'APPROVED').length || 0}</Text>
                        </View>
                        <View className="flex-1 bg-[#1e2a2d]/60 p-6 rounded-3xl border border-white/5 justify-between overflow-hidden">
                            <View className="flex-row items-center gap-3">
                                <Clock color="#edc062" size={20} />
                                <Text className="font-display font-medium text-on-surface-variant text-[10px] uppercase tracking-widest">Por Validar</Text>
                            </View>
                            <Text className="text-3xl font-display font-black text-[#edc062] tracking-tighter">{data?.filter((r: any) => r.status === 'PENDING').length || 0}</Text>
                        </View>
                    </View>

                    <View>
                        <View className="flex-row justify-between items-end mb-8 px-2">
                            <Text className="font-display font-bold text-2xl text-on-surface">Historial de Transacciones</Text>
                            <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">{data?.length || 0} Registros</Text>
                        </View>

                        {isLoading ? (
                            <ActivityIndicator color="#a8cdd4" size="large" className="mt-10" />
                        ) : (
                            <View>
                                {data?.map((item: any) => (
                                    <ReceiptCard key={item.id} item={item} />
                                ))}

                                {data?.length === 0 && (
                                    <View className="mt-4 items-center justify-center p-12 bg-[#1e2a2d]/60 border-dashed border-white/10 opacity-40">
                                        <ShieldCheck color="#8b9293" size={64} strokeWidth={1} />
                                        <Text className="text-on-surface-variant text-xl text-center font-display font-bold mt-6">¡Bandeja Limpia!</Text>
                                        <Text className="text-on-surface-variant text-center font-body text-xs mt-2">No hay transacciones ni validaciones registradas.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <Modal visible={viewerConfig.visible} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/95">
                    <SafeAreaView className="flex-1" style={{ paddingTop: Platform.OS === 'ios' ? 50 : 20 }}>
                        <View className="flex-row justify-between items-center px-6 py-4 border-b border-white/10">
                            <TouchableOpacity onPress={() => setViewerConfig({...viewerConfig, visible: false})} className="p-3 bg-white/10 rounded-full">
                                <X color="#fff" size={24} />
                            </TouchableOpacity>
                            <View className="flex-1 px-4">
                                <Text className="text-white font-display font-medium text-xs tracking-widest uppercase text-center" numberOfLines={1}>{viewerConfig.title}</Text>
                            </View>
                            <TouchableOpacity onPress={handleDownload} disabled={viewerConfig.isLoading} className="p-3 bg-primary/20 rounded-full border border-primary/30">
                                {viewerConfig.isLoading ? (
                                    <ActivityIndicator size="small" color="#a8cdd4" />
                                ) : (
                                    <Download color="#a8cdd4" size={24} />
                                )}
                            </TouchableOpacity>
                        </View>
                        
                        <View className="flex-1 w-full bg-neutral-900 justify-center">
                            {viewerConfig.isLoading ? (
                                <ActivityIndicator color="#a8cdd4" size="large" />
                            ) : viewerConfig.type === 'pdf' ? (
                                Platform.OS === 'web' ? (
                                    localBlobUrl ? (
                                        <iframe 
                                            src={localBlobUrl} 
                                            style={{ width: '100%', height: '100%', border: 'none' }} 
                                            title={viewerConfig.title}
                                        />
                                    ) : (
                                        <View className="p-10 items-center">
                                            <ActivityIndicator color="#edc062" size="small" />
                                            <Text className="text-on-surface-variant mt-4">Previsualizando documento...</Text>
                                        </View>
                                    )
                                ) : (
                                    <View className="p-10 items-center justify-center flex-1">
                                        <View className="bg-primary/10 p-8 rounded-[40px] mb-8">
                                            <FileText color="#a8cdd4" size={80} strokeWidth={1} />
                                        </View>
                                        <Text className="text-on-surface font-display font-black text-2xl mb-4 text-center">Documento PDF</Text>
                                        <Text className="text-on-surface-variant text-center mb-10 text-sm leading-relaxed px-6">
                                            Para una mejor experiencia, los documentos PDF deben visualizarse con el lector nativo de tu dispositivo.
                                        </Text>
                                        <TouchableOpacity 
                                            onPress={handleDownload}
                                            className="bg-primary px-8 py-4 rounded-2xl flex-row items-center gap-3"
                                        >
                                            <Download color="#0f353b" size={20} />
                                            <Text className="text-[#0f353b] font-black text-sm uppercase tracking-widest">Abrir Documento</Text>
                                        </TouchableOpacity>
                                    </View>
                                )
                            ) : (
                                <View className="flex-1 w-full h-full items-center justify-center p-4">
                                    {viewerConfig.url.includes('officedocument') || viewerConfig.url.includes('ms-excel') || viewerConfig.url.includes('msword') ? (
                                        <View className="items-center justify-center">
                                            <FileText color="#a8cdd4" size={80} strokeWidth={1} />
                                            <Text className="text-on-surface font-display font-black text-2xl mt-6 text-center">Documento de Office</Text>
                                            <Text className="text-on-surface-variant text-center mt-2 mb-10 text-sm">Este tipo de archivo debe descargarse para ser visualizado.</Text>
                                            <TouchableOpacity 
                                                onPress={handleDownload}
                                                className="bg-primary px-8 py-4 rounded-2xl flex-row items-center gap-3"
                                            >
                                                <Download color="#0f353b" size={20} />
                                                <Text className="text-[#0f353b] font-black text-sm uppercase tracking-widest">Descargar y Abrir</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <Image 
                                            key={viewerConfig.url}
                                            source={{ 
                                                uri: viewerConfig.url,
                                                headers: !viewerConfig.url.startsWith('data:') && userToken ? { 'Authorization': `Bearer ${userToken}` } : {}
                                            }} 
                                            className="w-full h-full"
                                            resizeMode="contain" 
                                            style={{ flex: 1, width: '100%', height: '100%' }}
                                            onError={(e) => {
                                                console.error('Image load error:', e.nativeEvent.error);
                                                if (!viewerConfig.url.startsWith('data:')) {
                                                    Alert.alert(
                                                        'Error de Carga',
                                                        'No se pudo previsualizar la imagen. Puedes intentar abrirla directamente en el navegador.',
                                                        [
                                                            { text: 'Cancelar', style: 'cancel' },
                                                            { text: 'Abrir en Navegador', onPress: () => Linking.openURL(viewerConfig.url) }
                                                        ]
                                                    );
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Rejection Modal */}
            <Modal visible={rejectionModal.visible} animationType="fade" transparent={true}>
                <View className="flex-1 bg-black/80 justify-center items-center p-6">
                    <View className="bg-[#1e2a2d] w-full max-w-sm p-8 rounded-[40px] border border-error/30 shadow-2xl">
                        <View className="bg-error/10 self-center p-4 rounded-3xl mb-6">
                            <X color="#ffb4ab" size={32} />
                        </View>
                        <Text className="text-on-surface font-display font-bold text-2xl text-center mb-2">Rechazar Pago</Text>
                        <Text className="text-on-surface-variant text-center mb-8 text-xs leading-relaxed">
                            Por favor, describe el motivo del rechazo. Este mensaje será visible para el cliente y quedará registrado en el historial.
                        </Text>
                        
                        <View className="bg-black/20 rounded-2xl p-4 mb-8 border border-white/5">
                            <TextInput 
                                placeholder="Ej: Comprobante ilegible / Monto insuficiente"
                                placeholderTextColor="#8b9293"
                                className="text-on-surface font-body text-sm"
                                multiline
                                numberOfLines={3}
                                value={rejectionModal.reason}
                                onChangeText={(text) => setRejectionModal(prev => ({ ...prev, reason: text }))}
                                style={{ textAlignVertical: 'top' }}
                            />
                        </View>

                        <View className="flex-row gap-4">
                            <TouchableOpacity 
                                onPress={() => setRejectionModal({ visible: false, id: '', reason: '' })}
                                className="flex-1 py-4 rounded-2xl bg-white/5 items-center"
                            >
                                <Text className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => {
                                    if (!rejectionModal.reason.trim()) {
                                        Alert.alert('Error', 'Debes ingresar un motivo');
                                        return;
                                    }
                                    mutation.mutate({ id: rejectionModal.id, action: 'reject', reason: rejectionModal.reason });
                                }}
                                disabled={mutation.isLoading}
                                className="flex-2 py-4 rounded-2xl bg-error items-center flex-row justify-center gap-2 px-8"
                            >
                                {mutation.isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white font-black text-xs uppercase tracking-widest">Rechazar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ReceiptsScreen;
