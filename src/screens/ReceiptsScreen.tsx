import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image, RefreshControl, Platform, ScrollView, Modal, SafeAreaView, Linking } from 'react-native';
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

const ReceiptsScreen = () => {
    const queryClient = useQueryClient();
    const { signOut } = useAuth();
    const navigation = useNavigation<any>();
    
    const [viewerConfig, setViewerConfig] = React.useState<{ visible: boolean, url: string, type: 'image' | 'pdf', title: string, isLoading: boolean }>({ visible: false, url: '', type: 'image', title: '', isLoading: false });
    const [localBlobUrl, setLocalBlobUrl] = React.useState<string | null>(null);

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
                const response = await apiClient.get(viewerConfig.url, { responseType: 'blob' });
                const blob = response.data;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Alimin_${viewerConfig.title.replace(/\s+/g, '_')}.${viewerConfig.type === 'pdf' ? 'pdf' : 'jpg'}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (e) {
                Alert.alert('Error', 'No se pudo descargar el archivo.');
            } finally {
                setViewerConfig(prev => ({...prev, isLoading: false}));
            }
            return;
        }

        try {
            setViewerConfig(prev => ({...prev, isLoading: true}));
            const fileUri = FileSystem.documentDirectory + `Alimin_${viewerConfig.title.replace(/\s+/g, '_')}.${viewerConfig.type === 'pdf' ? 'pdf' : 'jpg'}`;
            const { uri } = await FileSystem.downloadAsync(viewerConfig.url, fileUri);
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Descargado', 'El archivo ha sido guardado exitosamente.');
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo procesar la descarga.');
        } finally {
            setViewerConfig(prev => ({...prev, isLoading: false}));
        }
    };
    
    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['receipts'],
        queryFn: () => ledgerService.getReceipts(),
    });

    const mutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => 
            ledgerService.verifyReceipt(id, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['receipts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
            Alert.alert('Éxito', 'El recibo ha sido procesado correctamente');
        },
        onError: () => {
            Alert.alert('Error', 'No se pudo procesar el recibo');
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

            <View className="flex-row justify-between items-center border-t border-white/10 pt-4 mt-2">
                <View className="flex-row gap-2">
                    <TouchableOpacity 
                        className="bg-black/40 px-3 py-2 rounded-xl border border-white/10 flex-row items-center gap-1.5"
                        onPress={() => setViewerConfig({ visible: true, url: item.imageUrl, type: 'image', title: `Origen Lote ${item.lotNumber}`, isLoading: false })}
                    >
                        <FileText color="#8b9293" size={14} />
                        <Text className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">Visualizar Comprobante</Text>
                    </TouchableOpacity>
                    
                    {item.status === 'APPROVED' && (
                        <TouchableOpacity 
                            className="bg-primary/10 px-3 py-2 rounded-xl border border-primary/20 flex-row items-center gap-1.5"
                            onPress={() => {
                                setViewerConfig({ 
                                    visible: true, 
                                    url: `mobile/postventa/receipts/${item.id}/pdf`, 
                                    type: 'pdf', 
                                    title: `Oficial Lote ${item.lotNumber}`, 
                                    isLoading: false 
                                });
                            }}
                        >
                            <ShieldCheck color="#a8cdd4" size={14} />
                            <Text className="text-primary font-bold text-[10px] uppercase tracking-wider">Oficial</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                {item.status === 'PENDING' && (
                    <View className="flex-row gap-2">
                        <TouchableOpacity 
                            onPress={() => mutation.mutate({ id: item.id, action: 'reject' })}
                            className="bg-error/20 px-4 py-2 rounded-xl flex-row items-center"
                        >
                            <Text className="text-error font-bold text-[10px] uppercase tracking-wider">Rechazar</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => mutation.mutate({ id: item.id, action: 'approve' })}
                            className="bg-primary/90 px-4 py-2 rounded-xl flex-row items-center shadow-lg shadow-primary/20"
                        >
                            <Text className="text-[#0f353b] font-black justify-center items-center text-[10px] uppercase tracking-wider">Aprobar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <View 
                className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 h-24 bg-neutral-950/60"
                style={{ paddingTop: Platform.OS === 'ios' ? 40 : 0 }}
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
                    <SafeAreaView className="flex-1 mt-10">
                        <View className="flex-row justify-between items-center px-4 py-4 border-b border-white/10">
                            <TouchableOpacity onPress={() => setViewerConfig({...viewerConfig, visible: false})} className="p-2.5 bg-white/10 rounded-full">
                                <X color="#fff" size={20} />
                            </TouchableOpacity>
                            <Text className="text-white font-display font-medium text-sm tracking-widest uppercase">{viewerConfig.title}</Text>
                            <TouchableOpacity onPress={handleDownload} disabled={viewerConfig.isLoading} className="p-2.5 bg-primary/20 rounded-full border border-primary/30 ml-2">
                                {viewerConfig.isLoading ? (
                                    <ActivityIndicator size="small" color="#a8cdd4" />
                                ) : (
                                    <Download color="#a8cdd4" size={20} />
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
                                    <View className="p-10 items-center">
                                        <FileText color="#edc062" size={64} style={{ marginBottom: 20, opacity: 0.5 }} />
                                        <Text className="text-on-surface font-display font-black text-xl mb-4 text-center">Documento PDF</Text>
                                        <Text className="text-on-surface-variant text-center mb-10 text-sm">Este documento PDF debe ser visualizado externamente en dispositivos móviles.</Text>
                                    </View>
                                )
                            ) : (
                                <Image 
                                    key={viewerConfig.url}
                                    source={{ uri: viewerConfig.url }} 
                                    className="w-full h-full" 
                                    resizeMode="contain" 
                                    style={Platform.OS === 'web' ? { width: '100%', height: '100%', minHeight: 400 } : {}}
                                />
                            )}
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
};

export default ReceiptsScreen;
