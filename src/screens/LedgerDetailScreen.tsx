import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking, ActivityIndicator } from 'react-native';
import { ArrowLeft, User, Phone, Mail, FileText, ChevronRight, CheckCircle2, AlertCircle, Layout, Wallet, CreditCard, Calendar, Landmark, Coins, AlertTriangle, UploadCloud } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ledgerService, LedgerEntry } from '../api/ledgerService';
import { LotDetailResponse } from '../types/payment.types';

const LedgerDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { entry } = (route.params as { entry: LedgerEntry }) || {};

    const { data: detailData, isLoading, isError } = useQuery<LotDetailResponse>({
        queryKey: ['lotDetails', entry?.customerId],
        queryFn: () => ledgerService.getLotDetails(entry?.customerId || ''),
        enabled: !!entry?.customerId
    });

    if (!entry || !entry.customerId || isError) {
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

    const { financials, account } = detailData;

    // Financial Calculation formatters
    const formatCurrency = (val: number | undefined) => (val ?? 0).toLocaleString('es-CL');
    const formatArea = (val: number | undefined) => (val ?? 0).toFixed(2);
    
    // UI Helpers
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'LATE': return { color: '#ffb4ab', label: 'En Mora', icon: <AlertCircle color="#ffb4ab" size={20} /> };
            case 'GRACE': return { color: '#edc062', label: 'En Período de Gracia', icon: <AlertTriangle color="#edc062" size={20} /> };
            case 'UPCOMING': return { color: '#a8cdd4', label: 'Próximo Cobro', icon: <CheckCircle2 color="#a8cdd4" size={20} /> };
            case 'OK': return { color: '#a8cdd4', label: 'Al Día', icon: <CheckCircle2 color="#a8cdd4" size={20} /> };
            default: return { color: '#c1c8c9', label: 'Disponible', icon: <AlertCircle color="#c1c8c9" size={20} /> };
        }
    };
    
    const DateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' });
    const formattedDueDate = account?.nextDueDate ? DateFormatter.format(new Date(account.nextDueDate)) : 'Sin Vencimiento';
    const graceDate = account?.nextDueDate ? new Date(new Date(account.nextDueDate).setDate(new Date(account.nextDueDate).getDate() + 5)) : null;

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

    const DocButton = ({ title, type }: { title: string; type: string }) => (
        <TouchableOpacity 
            onPress={() => Linking.openURL(`https://aliminlomasdelmar.com/api/contracts/${account!.reservationId}/file?type=${type}`)}
            className="bg-[#1e2a2d]/60 p-5 rounded-3xl mb-4 border border-white/5 flex-row items-center justify-between"
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
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Cuenta {financials.lotNumber}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="px-6 pt-6">
                    
                    {/* Tarjeta V2: Estado de la Deuda */}
                    <View className="bg-surface-container-high rounded-[32px] p-6 mb-8 border border-white/5 shadow-2xl">
                        
                        <View className="flex-row items-center gap-2 mb-6">
                            <Wallet color="#edc062" size={20} />
                            <Text className="font-display font-bold text-xl text-on-surface">Progreso de Pago</Text>
                        </View>

                        {/* Progreso */}
                        <View className="mb-6">
                            <View className="flex-row justify-between items-end mb-3">
                                <Text className="text-on-surface-variant font-bold text-sm">{account!.installmentsPaid} de {financials.totalCuotas} Cuotas Pagadas</Text>
                                <Text className="text-primary font-display font-black text-xl">{investmentProgress}%</Text>
                            </View>
                            <View className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-white/5">
                                <View style={{ width: `${investmentProgress}%` }} className="h-full bg-primary" />
                            </View>
                        </View>
                        
                        {/* Estado Dinámico del Siguiente Vencimiento */}
                        <View className="bg-black/20 p-4 rounded-2xl border border-white/5 mb-6 shadow-inner">
                            {account!.moraStatus === 'OK' || account!.moraStatus === 'UPCOMING' ? (
                                <View className="flex-row items-start gap-3">
                                    <View className="bg-emerald-500/20 p-2 rounded-full"><CheckCircle2 color="#2db395" size={18} /></View>
                                    <View>
                                        <Text className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest mb-1">Cuenta al día</Text>
                                        <Text className="text-on-surface font-headline font-black">Próximo cobro: {formattedDueDate}</Text>
                                    </View>
                                </View>
                            ) : account!.moraStatus === 'GRACE' ? (
                                <View className="flex-row items-start gap-3">
                                    <View className="bg-amber-500/20 p-2 rounded-full"><AlertTriangle color="#f59e0b" size={18} /></View>
                                    <View>
                                        <Text className="text-amber-400 font-bold uppercase text-[10px] tracking-widest mb-1">Período de Gracia</Text>
                                        {graceDate && <Text className="text-on-surface font-bold text-xs">Tienes hasta el <Text className="font-black text-amber-500">{DateFormatter.format(graceDate)}</Text> sin multas por atraso.</Text>}
                                    </View>
                                </View>
                            ) : (
                                <View className="flex-row items-start gap-3 border-l-2 border-error pl-3">
                                    <View className="bg-error/20 p-2 rounded-full"><AlertCircle color="#ffb4ab" size={18} /></View>
                                    <View className="flex-1">
                                        <Text className="text-error font-bold uppercase text-[10px] tracking-widest mb-1">Deuda Vencida</Text>
                                        <Text className="text-on-surface font-bold text-xs mb-1">Tienes {account!.lateDays} días de retraso. Se ha acumulado interés mora.</Text>
                                        <Text className="text-error font-black text-lg">+ ${formatCurrency(account!.penaltyAmountClp)} CLP</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Botón Pagar Ahora */}
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
                                <UploadCloud color="#000" size={20} />
                                <Text className="text-black font-display font-black uppercase text-sm tracking-widest">Declarar Transferencia</Text>
                            </TouchableOpacity>
                        )}
                        
                    </View>

                    {/* Resumen Inmobiliario Base */}
                    <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Datos del Lote</Text>
                     <View className="bg-[#1e2a2d]/60 rounded-[32px] p-6 mb-8 border border-white/5">
                        <InfoRow label="Etapa" value={`Etapa ${financials.stage}`} icon={<Layout color="#edc062" size={16} />} />
                        <InfoRow label="Superficie" value={`${formatArea(financials.areaM2)} m²`} icon={<Layout color="#a8cdd4" size={16} />} />
                        <InfoRow label="Valor Total" value={`$${formatCurrency(financials.priceTotalClp)}`} icon={<Landmark color="#edc062" size={16} />} />
                        <InfoRow label="Valor Cuota (Normal)" value={`$${formatCurrency(financials.valorCuotaNormal)}/mes`} icon={<Wallet color="#a8cdd4" size={16} />} />
                     </View>

                    {/* Customer Data */}
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

                    {/* Documentation */}
                    <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Expediente Legal</Text>
                    <DocButton title="Contrato de Reserva" type="RESERVA" />
                    <DocButton title="Promesa de Compraventa" type="PROMESA" />
                </View>
            </ScrollView>
        </View>
    );
};

export default LedgerDetailScreen;
