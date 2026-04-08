import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking, ActivityIndicator, Alert, Modal, SafeAreaView, Image } from 'react-native';
import { ArrowLeft, User, Phone, Mail, FileText, ChevronRight, CheckCircle2, AlertCircle, Layout, Wallet, Landmark, ShieldCheck, Download, X, ExternalLink, Calendar, MapPin, Eye, AlertTriangle, Shield, Gavel, Files, Clock, Coins, Upload } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerService, LedgerEntry } from '../api/ledgerService';
import { API_BASE_URL } from '../api/client';
import apiClient from '../api/client';
import { LotDetailResponse, MobileReceipt } from '../types/payment.types';

const PaymentDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();
    const route = useRoute();
    const { clientId, lotId } = (route.params as { clientId: string, lotId: string }) || {};

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

    const mutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => 
            ledgerService.verifyReceipt(id, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lotDetails', clientId] });
            queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
            Alert.alert('Éxito', 'El recibo ha sido procesado correctamente');
        },
        onError: () => {
            Alert.alert('Error', 'No se pudo procesar el recibo');
        }
    });

    const { data: detailData, isLoading, isError } = useQuery<LotDetailResponse>({
        queryKey: ['lotDetails', clientId],
        queryFn: () => ledgerService.getLotDetails(clientId),
        enabled: !!clientId
    });

    if (!clientId || isError) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-white">Imposible cargar el detalle financiero de este lote.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 p-4 bg-primary/20 rounded-xl">
                    <Text className="text-primary font-bold">Volver atrás</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isLoading || !detailData?.success) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#a8cdd4" />
                <Text className="text-on-surface-variant font-bold mt-4 animate-pulse">Sincronizando Estado de Cuenta...</Text>
            </View>
        );
    }

    const { financials, account, recentReceipts } = detailData;
    const { entry } = (route.params as { entry: any }) || {};

    const formatCurrency = (val: number | undefined) => (val ?? 0).toLocaleString('es-CL');
    const formatArea = (val: number | undefined) => (val ?? 0).toFixed(2);
    
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'LATE': return { color: '#ffb4ab', label: 'En Mora', icon: <AlertCircle color="#ffb4ab" size={20} /> };
            case 'GRACE': return { color: '#edc062', label: 'Periodo Gracia', icon: <AlertTriangle color="#edc062" size={20} /> };
            case 'UPCOMING': return { color: '#a8cdd4', label: 'Próximo Cobro', icon: <Clock color="#a8cdd4" size={20} /> };
            case 'OK': return { color: '#2db395', label: 'Al Día', icon: <CheckCircle2 color="#2db395" size={20} /> };
            default: return { color: '#c1c8c9', label: 'Disponible', icon: <AlertCircle color="#c1c8c9" size={20} /> };
        }
    };
    
    const DateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' });
    const formattedDueDate = account?.nextDueDate ? DateFormatter.format(new Date(account.nextDueDate)) : 'Sin Vencimiento';
    
    const statusInfo = getStatusInfo(account!.moraStatus || 'OK');
    const investmentProgress = financials.totalCuotas > 0 
        ? Math.round((account!.installmentsPaid / financials.totalCuotas) * 100) 
        : 0;

    const InfoRow = ({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) => (
        <View className="flex-row items-center justify-between py-4 border-b border-white/5">
            <View className="flex-row items-center gap-3">
                {icon}
                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">{label}</Text>
            </View>
            <Text className="text-on-surface font-headline font-bold text-sm tracking-tight">{value}</Text>
        </View>
    );

    const DocButton = ({ title, type }: { title: string, type: string }) => (
        <TouchableOpacity 
            onPress={async () => {
                const customerId = clientId;
                if (Platform.OS === 'web') {
                    setViewerConfig({
                        visible: true,
                        url: `mobile/postventa/contracts/${customerId}/file?type=${type}`,
                        type: 'pdf',
                        title: title,
                        isLoading: true
                    });
                } else {
                    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
                    Linking.openURL(`${baseUrl}mobile/postventa/contracts/${customerId}/file?type=${type}`);
                }
            }}
            className="bg-[#1e2a2d]/60 p-5 rounded-[32px] mb-4 border border-white/5 flex-row items-center justify-between"
        >
            <View className="flex-row items-center gap-4">
                <View className="bg-primary/10 p-2.5 rounded-xl">
                    <FileText color="#a8cdd4" size={20} />
                </View>
                <Text className="text-on-surface font-bold text-sm">{title}</Text>
            </View>
            <ChevronRight color="rgba(193, 200, 201, 0.4)" size={18} />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background">
            <LinearGradient colors={['rgba(54, 89, 95, 0.15)', 'transparent']} className="absolute inset-0" />
            
            <View className="px-6 h-28 flex-row items-center justify-between z-50 bg-neutral-950/60 pb-2" style={{ paddingTop: Platform.OS === 'ios' ? 44 : 20 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2">
                    <ArrowLeft color="#a8cdd4" size={24} />
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Cuenta Lote {lotId}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="px-6 pt-6">
                    
                    <View className="bg-surface-container-high rounded-[32px] p-6 mb-8 border border-white/5 shadow-2xl overflow-hidden relative">
                        <View className="absolute top-0 right-0 p-4 opacity-10">
                            <Landmark color={statusInfo.color} size={120} />
                        </View>
                        
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-2">
                                <View className="p-2.5 rounded-xl" style={{ backgroundColor: `${statusInfo.color}15` }}>
                                    {statusInfo.icon}
                                </View>
                                <Text className="font-display font-bold text-xl text-on-surface">Estado de Cuenta</Text>
                            </View>
                            <View className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 flex-row gap-2">
                                {entry?.badges?.includes('RES') && <Text className="text-[9px] font-black text-primary">RES</Text>}
                                {entry?.badges?.includes('PRM') && <Text className="text-[9px] font-black text-secondary">PRM</Text>}
                                {entry?.badges?.includes('GST') && <Text className="text-[9px] font-black text-on-surface-variant">GST</Text>}
                            </View>
                        </View>

                        <View className="mb-6">
                            <View className="flex-row justify-between items-end mb-3">
                                <Text className="text-on-surface-variant font-bold text-sm">{account!.installmentsPaid} de {financials.totalCuotas} Cuotas Pagadas</Text>
                                <Text className="text-primary font-display font-black text-xl">{investmentProgress}%</Text>
                            </View>
                            <View className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-white/5">
                                <View style={{ width: `${investmentProgress}%` }} className="h-full bg-primary" />
                            </View>
                        </View>
                        
                        <View className="bg-black/20 p-5 rounded-2xl border border-white/5 mb-6 shadow-inner">
                            {account!.moraStatus === 'LATE' ? (
                                <View>
                                    <View className="flex-row items-center gap-2 mb-3">
                                        <AlertTriangle color="#ffb4ab" size={16} />
                                        <Text className="text-[#ffb4ab] font-bold text-sm">Atraso de {account!.lateDays} días</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center bg-error/10 p-3 rounded-xl border border-error/20">
                                        <View>
                                            <Text className="text-on-surface-variant text-[9px] uppercase font-black">Multa Acumulada</Text>
                                            <Text className="text-error font-black text-lg">${formatCurrency(account!.penaltyAmountClp)}</Text>
                                        </View>
                                        <View className="h-8 w-px bg-error/20 mx-2" />
                                        <View className="flex-1 items-end">
                                            <Text className="text-on-surface-variant text-[9px] uppercase font-black">Total con Cuota</Text>
                                            <Text className="text-on-surface font-black text-lg">${formatCurrency(account!.penaltyAmountClp + financials.valorCuotaNormal)}</Text>
                                        </View>
                                    </View>
                                </View>
                            ) : account!.moraStatus === 'GRACE' ? (
                                <View className="flex-row items-center gap-3">
                                    <Clock color="#edc062" size={24} />
                                    <View>
                                        <Text className="text-[#edc062] font-black text-sm uppercase">Días de Gracia</Text>
                                        <Text className="text-on-surface-variant text-xs">Venció el día 5. Sin multa hasta el día 10.</Text>
                                    </View>
                                </View>
                            ) : (
                                <View className="flex-row items-start gap-3">
                                    {account!.moraStatus === 'UPCOMING' ? (
                                        <Clock color="#a8cdd4" size={20} />
                                    ) : (
                                        <CheckCircle2 color="#2db395" size={20} />
                                    )}
                                    <View>
                                        <Text className={`font-black uppercase text-sm ${account!.moraStatus === 'UPCOMING' ? 'text-[#a8cdd4]' : 'text-[#2db395]'}`}>
                                            {account!.moraStatus === 'UPCOMING' ? 'Próximo Vencimiento' : 'Cuenta al Día'}
                                        </Text>
                                        <Text className="text-on-surface-variant text-xs">{formattedDueDate}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {account!.hasPendingInstallmentReceipt ? (
                            <View className="bg-surface-container-highest p-4 rounded-2xl items-center border border-white/5 opacity-80 flex-row gap-3">
                                <AlertCircle color="#c1c8c9" size={20} />
                                <Text className="text-on-surface-variant font-bold text-xs leading-tight flex-1">Comprobante en revisión por la administración. No puedes declarar otro pago temporalmente.</Text>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('PaymentTransfer', { financials, account })}
                                className="bg-primary p-4 rounded-2xl items-center flex-row justify-center gap-3 active:bg-primary/80"
                            >
                                <Upload color="#000" size={20} />
                                <Text className="text-black font-display font-black uppercase text-sm tracking-widest">Declarar Transferencia</Text>
                            </TouchableOpacity>
                        )}
                        
                    </View>

                    <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Datos del Lote</Text>
                     <View className="bg-[#1e2a2d]/60 rounded-[32px] p-6 mb-8 border border-white/5">
                        <InfoRow label="Etapa" value={`Etapa ${financials.stage}`} icon={<Layout color="#edc062" size={16} />} />
                        <InfoRow label="Superficie" value={`${formatArea(financials.areaM2)} m²`} icon={<Layout color="#a8cdd4" size={16} />} />
                        <InfoRow label="Valor Total" value={`$${formatCurrency(financials.priceTotalClp)}`} icon={<Landmark color="#edc062" size={16} />} />
                        <InfoRow label="Valor Cuota (Normal)" value={`$${formatCurrency(financials.valorCuotaNormal)}/mes`} icon={<Wallet color="#a8cdd4" size={16} />} />
                     </View>

                    <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Datos del Propietario</Text>
                    <View className="bg-[#1e2a2d]/60 rounded-[32px] p-6 mb-8 border border-white/5 flex-row items-center gap-5">
                        <View className="bg-black/30 p-4 rounded-full border border-white/10">
                            <User color="#a8cdd4" size={32} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-on-surface font-headline font-black text-lg mb-1">{account!.clientName}</Text>
                            <Text className="text-on-surface-variant text-xs mb-1 font-mono">{account!.clientEmail}</Text>
                            <Text className="text-on-surface-variant text-[10px] tracking-widest uppercase font-bold text-primary">{account!.clientPhone}</Text>
                        </View>
                    </View>

                    <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Expediente Legal</Text>
                    <DocButton title="Contrato de Reserva" type="RESERVA" />
                    <DocButton title="Promesa de Compraventa" type="PROMESA" />

                    {recentReceipts && recentReceipts.length > 0 && (
                        <View className="mt-4">
                            <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Historial de Pagos</Text>
                            {recentReceipts.map((receipt: MobileReceipt) => (
                                <View key={receipt.receiptId} className="bg-[#1e2a2d]/60 p-5 rounded-[32px] mb-4 border border-white/5">
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-row items-center gap-2">
                                            {receipt.status === 'APPROVED' ? <CheckCircle2 color="#2db395" size={16} /> : 
                                             receipt.status === 'REJECTED' ? <AlertCircle color="#ffb4ab" size={16} /> : 
                                             <Clock color="#edc062" size={16} />}
                                            <Text className="text-on-surface font-display font-bold text-sm">
                                                {receipt.scope === 'PIE' ? 'Pago de Pie' : `Cuota(s) x${receipt.installmentsCount}`}
                                            </Text>
                                        </View>
                                        <Text className="text-primary font-display font-black text-base">${receipt.amountClp.toLocaleString()}</Text>
                                    </View>
                                    
                                    <View className="flex-row justify-between mb-4 mt-1 px-1">
                                        <View>
                                            <Text className="text-on-surface-variant text-[9px] uppercase font-black tracking-widest mb-1">Fecha</Text>
                                            <Text className="text-on-surface text-xs font-mono">{new Date(receipt.createdAt).toLocaleDateString('es-CL')}</Text>
                                        </View>
                                        <View>
                                            <Text className="text-on-surface-variant text-[9px] uppercase font-black tracking-widest mb-1">Estado</Text>
                                            <Text className={`text-xs font-mono font-bold ${receipt.status === 'APPROVED' ? 'text-emerald-400' : receipt.status === 'REJECTED' ? 'text-error' : 'text-[#edc062]'}`}>
                                                {receipt.status === 'APPROVED' ? 'Aprobado' : receipt.status === 'REJECTED' ? 'Rechazado' : 'Pendiente'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between items-center border-t border-white/10 pt-4 mt-2">
                                        <TouchableOpacity 
                                            onPress={() => setViewerConfig({ 
                                                visible: true, 
                                                url: receipt.receiptUrl, 
                                                type: 'image', 
                                                title: `Comprobante ${receipt.receiptId}`, 
                                                isLoading: false 
                                            })}
                                            className="bg-black/40 px-3 py-2 rounded-xl border border-white/10 flex-row items-center gap-1.5"
                                        >
                                            <FileText color="#8b9293" size={14} />
                                            <Text className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">Ver Comprobante</Text>
                                        </TouchableOpacity>

                                        {receipt.status === 'PENDING' && (
                                            <View className="flex-row gap-2">
                                                <TouchableOpacity 
                                                    onPress={() => mutation.mutate({ id: receipt.receiptId, action: 'reject' })}
                                                    className="bg-error/20 px-3 py-2 rounded-xl"
                                                >
                                                    <Text className="text-error font-bold text-[10px] uppercase">Rechazar</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    onPress={() => mutation.mutate({ id: receipt.receiptId, action: 'approve' })}
                                                    className="bg-primary/90 px-3 py-2 rounded-xl"
                                                >
                                                    <Text className="text-[#0f353b] font-black text-[10px] uppercase">Aprobar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
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

export default PaymentDashboardScreen;
