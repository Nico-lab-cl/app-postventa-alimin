import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking, ActivityIndicator } from 'react-native';
import { ArrowLeft, User, Phone, Mail, FileText, ChevronRight, CheckCircle2, AlertCircle, Layout, Wallet, Landmark, AlertTriangle, Clock, Receipt, Coins, History, ShieldCheck, BadgeInfo, CalendarDays, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LedgerEntry, ledgerService } from '../api/ledgerService';
import { API_BASE_URL } from '../api/client';
import apiClient from '../api/client';
import { Alert } from 'react-native';

const LedgerDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { entry: initialEntry } = (route.params as { entry: LedgerEntry }) || {};

    // For better experience, we can fetch the latest details or use the passed entry
    // In this case, initialEntry already has almost everything from the ledger list
    const entry = initialEntry;

    if (!entry) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-white">Cargando...</Text>
            </View>
        );
    }

    const formatCurrency = (val: number | undefined) => (val ?? 0).toLocaleString('es-CL');
    const formatArea = (val: number | undefined) => (val ?? 0).toFixed(2);
    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return 'No definida';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const InfoRow = ({ label, value, icon, valueColor = "text-on-surface" }: { label: string; value: string | number; icon?: React.ReactNode; valueColor?: string }) => (
        <View className="flex-row items-center justify-between py-4 border-b border-white/5">
            <View className="flex-row items-center gap-3">
                {icon}
                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">{label}</Text>
            </View>
            <Text className={`${valueColor} font-headline font-bold text-sm tracking-tight`}>{value}</Text>
        </View>
    );

    const Badge = ({ label, color }: { label: string; color: string }) => (
        <View className={`px-2 py-0.5 rounded-md border mr-2 mb-2`} style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
            <Text className="font-black text-[8px] uppercase tracking-tighter" style={{ color: color }}>{label}</Text>
        </View>
    );

    const StatusBadge = ({ status, isFrozen }: { status: string; isFrozen?: boolean }) => {
        if (isFrozen) {
            return (
                <View className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 flex-row items-center gap-1">
                    <ShieldCheck color="#a8cdd4" size={10} />
                    <Text className="text-primary text-[8px] font-black uppercase tracking-widest">Mora Congelada</Text>
                </View>
            );
        }
        switch (status) {
            case 'LATE':
                return (
                    <View className="bg-error/10 px-3 py-1 rounded-full border border-error/20 flex-row items-center gap-1">
                        <AlertCircle color="#ffb4ab" size={10} />
                        <Text className="text-error text-[8px] font-black uppercase tracking-widest">En Mora</Text>
                    </View>
                );
            case 'GRACE':
                return (
                    <View className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex-row items-center gap-1">
                        <AlertTriangle color="#edc062" size={10} />
                        <Text className="text-amber-400 text-[8px] font-black uppercase tracking-widest">Gracia</Text>
                    </View>
                );
            case 'UPCOMING':
                return (
                    <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20 flex-row items-center gap-1">
                        <Clock color="#a8cdd4" size={10} />
                        <Text className="text-primary text-[8px] font-black uppercase tracking-widest">Próximo</Text>
                    </View>
                );
            case 'OK':
                return (
                    <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex-row items-center gap-1">
                        <CheckCircle2 color="#2db395" size={10} />
                        <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">Al Día</Text>
                    </View>
                );
            default:
                return (
                    <View className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        <Text className="text-on-surface-variant text-[8px] font-black uppercase tracking-widest">Disponible</Text>
                    </View>
                );
        }
    };

    const DocButton = ({ title, type, icon }: { title: string; type: string; icon?: any }) => {
        const Icon = icon || FileText;
        return (
            <TouchableOpacity 
                onPress={async () => {
                    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
                    Linking.openURL(`${baseUrl}mobile/postventa/contracts/${entry.customerId}/file?type=${type}`);
                }}
                className="bg-[#1e2a2d]/60 p-5 rounded-3xl mb-4 border border-white/5 flex-row items-center justify-between"
            >
                <View className="flex-row items-center gap-4">
                    <View className="bg-primary/10 p-2.5 rounded-xl"><Icon color="#a8cdd4" size={20} /></View>
                    <Text className="text-on-surface font-bold text-sm tracking-tight">{title}</Text>
                </View>
                <ChevronRight color="rgba(193, 200, 201, 0.4)" size={18} />
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-background">
            <LinearGradient colors={['rgba(54, 89, 95, 0.15)', 'transparent']} className="absolute inset-0" />
            
            <View className="px-6 h-28 flex-row items-center justify-between z-50 bg-neutral-950/60 pb-2" style={{ paddingTop: Platform.OS === 'ios' ? 44 : 20 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2">
                    <ArrowLeft color="#a8cdd4" size={24} />
                    <View>
                        <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase leading-none">Lote {entry.lotId}</Text>
                        <Text className="text-on-surface-variant text-[8px] uppercase tracking-widest font-black">{entry.stageName}</Text>
                    </View>
                </TouchableOpacity>
                <StatusBadge status={entry.status} isFrozen={entry.isMoraFrozen} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <View className="px-6 pt-6">
                    {/* Identification & Badges */}
                    <View className="flex-row flex-wrap mb-6">
                        {entry.is_legacy && <Badge label="LGC - Antiguo" color="#edc062" />}
                        {entry.pie_status === 'PAID' && <Badge label="PIE - Pagado" color="#2db395" />}
                        {entry.lotStatus === 'reserved' && <Badge label="RES - Reservado" color="#a8cdd4" />}
                        {entry.lotStatus === 'sold' && <Badge label="COM - Comprado" color="#2db395" />}
                    </View>

                    {/* Financial Summary Cards */}
                    <Text className="font-display font-bold text-on-surface text-xl mb-4 ml-2">Resumen Financiero</Text>
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1 bg-emerald-500/10 p-5 rounded-[32px] border border-emerald-500/20">
                            <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-widest mb-1">Total Invertido</Text>
                            <Text className="text-on-surface font-display font-black text-xl tracking-tighter">${formatCurrency(entry.totalInvested)}</Text>
                        </View>
                        <View className="flex-1 bg-[#1e2a2d]/80 p-5 rounded-[32px] border border-white/5">
                            <Text className="text-on-surface-variant text-[8px] font-black uppercase tracking-widest mb-1">Saldo Pendiente</Text>
                            <Text className="text-on-surface font-display font-black text-xl tracking-tighter">${formatCurrency(entry.pendingBalance)}</Text>
                        </View>
                    </View>

                    {/* Mora Section (Only if late) */}
                    {entry.penaltyAmount > 0 && !entry.isMoraFrozen && (
                        <View className="bg-error/10 p-6 rounded-[32px] mb-8 border border-error/20 overflow-hidden relative">
                            <View className="absolute -right-8 -top-8 bg-error/10 w-24 h-24 rounded-full" />
                            <View className="flex-row items-center gap-3 mb-4">
                                <AlertCircle color="#ffb4ab" size={24} />
                                <Text className="text-error font-display font-black text-lg tracking-tight uppercase">Alerta de Mora</Text>
                            </View>
                            <View className="flex-row justify-between items-end">
                                <View>
                                    <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-1">Multa Acumulada</Text>
                                    <Text className="text-on-surface font-display font-black text-3xl tracking-tighter">${formatCurrency(entry.penaltyAmount)}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-1">Días de Retraso</Text>
                                    <Text className="text-error font-display font-black text-2xl tracking-tighter">{entry.lateDays} Días</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Ficha de Cobro */}
                    <Text className="font-display font-bold text-on-surface text-xl mb-4 ml-2">Ficha de Cobro</Text>
                    <View className="bg-[#1e2a2d]/60 rounded-[32px] p-6 mb-8 border border-white/5">
                        <InfoRow 
                            label="Próximo Vencimiento" 
                            value={formatDate(entry.nextDueDate)} 
                            icon={<CalendarDays color="#edc062" size={16} />} 
                            valueColor="text-amber-400"
                        />
                        <InfoRow 
                            label="Estado del Pie" 
                            value={entry.pie_status === 'PAID' ? 'Saneado' : 'Pendiente'} 
                            icon={<Receipt color={entry.pie_status === 'PAID' ? "#2db395" : "#edc062"} size={16} />} 
                            valueColor={entry.pie_status === 'PAID' ? "text-emerald-400" : "text-amber-400"}
                        />
                        <InfoRow 
                            label="Cuotas Pagadas" 
                            value={`${entry.installments_paid} Cuotas`} 
                            icon={<Coins color="#a8cdd4" size={16} />} 
                        />
                         <InfoRow 
                            label="Valor Cuota" 
                            value={`$${formatCurrency(entry.valor_cuota)}`} 
                            icon={<Wallet color="#a8cdd4" size={16} />} 
                        />
                    </View>

                    {/* Customer Data */}
                    {entry.customerId ? (
                        <>
                            <Text className="font-display font-bold text-on-surface text-xl mb-4 ml-2">Datos del Propietario</Text>
                            <View className="bg-[#1e2a2d]/60 rounded-[32px] p-6 mb-8 border border-white/5">
                                <View className="flex-row items-center gap-5 mb-6">
                                    <View className="bg-black/30 p-4 rounded-full border border-white/10">
                                        <User color="#a8cdd4" size={32} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-on-surface font-headline font-black text-lg mb-1 leading-tight">{entry.customerName}</Text>
                                        <View className="flex-row items-center gap-2">
                                            <BadgeInfo color="#8b9293" size={12} />
                                            <Text className="text-on-surface-variant font-mono text-xs uppercase tracking-widest">{entry.rut || 'RUT no registrado'}</Text>
                                        </View>
                                    </View>
                                </View>
                                
                                <View className="flex-row justify-between flex-wrap gap-y-2">
                                    <TouchableOpacity 
                                        onPress={() => Linking.openURL(`tel:${entry.phone}`)}
                                        className="flex-1 bg-white/5 p-3 rounded-2xl flex-row items-center justify-center gap-2 mr-2 border border-white/5 min-w-[30%]"
                                    >
                                        <Phone color="#a8cdd4" size={14} />
                                        <Text className="text-on-surface text-[10px] font-black uppercase tracking-widest">Llamar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => {
                                             let cleanPhone = entry.phone ? entry.phone.replace(/[^0-9]/g, '') : '';
                                             if (cleanPhone && !cleanPhone.startsWith('56')) {
                                                 cleanPhone = '56' + cleanPhone; // Asumiendo código Chile por defecto
                                             }
                                             Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
                                        }}
                                        className="flex-1 bg-emerald-500/10 p-3 rounded-2xl flex-row items-center justify-center gap-2 mr-2 border border-emerald-500/20 min-w-[30%]"
                                    >
                                        <MessageCircle color="#2db395" size={14} />
                                        <Text className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">WhatsApp</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => Linking.openURL(`mailto:${entry.email}`)}
                                        className="flex-1 bg-white/5 p-3 rounded-2xl flex-row items-center justify-center gap-2 border border-white/5 min-w-[30%]"
                                    >
                                        <Mail color="#a8cdd4" size={14} />
                                        <Text className="text-on-surface text-[10px] font-black uppercase tracking-widest">Email</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Expediente Legal */}
                            <Text className="font-display font-bold text-on-surface text-xl mb-4 ml-2">Expediente Legal</Text>
                            <DocButton title="Contrato de Reserva" type="RESERVA" icon={FileText} />
                            <DocButton title="Promesa de Compraventa" type="PROMESA" icon={FileText} />

                            {/* Actions */}
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('Receipts', { reservationId: entry.customerId, lotNumber: entry.lotId })}
                                className="bg-primary p-6 rounded-[32px] mt-4 flex-row items-center justify-center gap-4 shadow-xl"
                            >
                                <History color="#1c3438" size={24} strokeWidth={2.5} />
                                <Text className="text-[#1c3438] font-display font-black text-lg uppercase tracking-widest">Historial de Pagos</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                         <View className="bg-black/20 p-12 rounded-[40px] border border-dashed border-white/10 items-center justify-center mt-6">
                             <Layout color="#a8cdd4" size={48} className="mb-4 opacity-50" />
                             <Text className="text-on-surface font-display font-bold text-xl mb-2">Lote Disponible</Text>
                             <Text className="text-on-surface-variant text-center text-xs font-body opacity-60">Este lote aún no tiene un propietario asignado ni registros financieros activos.</Text>
                         </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default LedgerDetailScreen;

