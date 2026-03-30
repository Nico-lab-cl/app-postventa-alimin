import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { ArrowLeft, User, Phone, Mail, FileText, ChevronRight, CheckCircle2, AlertCircle, Layout, Wallet, CreditCard } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LedgerEntry } from '../api/ledgerService';

const LedgerDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { entry } = route.params as { entry: LedgerEntry };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'LATE': return { color: '#ffb4ab', label: 'En Mora', icon: <AlertCircle color="#ffb4ab" size={20} /> };
            case 'GRACE': return { color: '#edc062', label: 'En Gracia', icon: <AlertCircle color="#edc062" size={20} /> };
            case 'UPCOMING': return { color: '#a8cdd4', label: 'Vencimiento Próximo', icon: <CheckCircle2 color="#a8cdd4" size={20} /> };
            case 'OK': return { color: '#a8cdd4', label: 'Al Día', icon: <CheckCircle2 color="#a8cdd4" size={20} /> };
            default: return { color: '#c1c8c9', label: 'Desconocido', icon: <AlertCircle color="#c1c8c9" size={20} /> };
        }
    };

    const statusInfo = getStatusInfo(entry.status);

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
            onPress={() => Linking.openURL(`https://aliminlomasdelmar.com/api/contracts/${entry.customerId}/file?type=${type}`)}
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
            
            {/* Custom Header */}
            <View className="px-6 h-24 flex-row items-center justify-between z-50 bg-neutral-950/60" style={{ paddingTop: Platform.OS === 'ios' ? 40 : 0 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2">
                    <ArrowLeft color="#a8cdd4" size={24} />
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Detalle Lote</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 50 }}>
                <View className="px-6 pt-6">
                    {/* Lot Hero Card */}
                    <View className="bg-[#1e2a2d]/60 p-8 rounded-[40px] border border-white/10 mb-8 relative overflow-hidden">
                        <View className="absolute -right-12 -top-12 w-48 h-48 bg-[#edc062]/10 rounded-full" />
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-secondary font-display font-black text-4xl tracking-tighter">{entry.lotId}</Text>
                                <Text className="text-on-surface-variant text-xs uppercase tracking-[4px] font-black mt-1">{entry.stageName}</Text>
                            </View>
                            <View style={{ backgroundColor: `${statusInfo.color}20` }} className="px-4 py-2 rounded-full flex-row items-center gap-2 border border-white/5">
                                {statusInfo.icon}
                                <Text style={{ color: statusInfo.color }} className="text-[10px] font-black uppercase tracking-widest">{statusInfo.label}</Text>
                            </View>
                        </View>
                        <View className="flex-row gap-8">
                            <View>
                                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-1">Superficie</Text>
                                <Text className="text-on-surface font-headline font-bold text-lg leading-tight">{entry.area_m2} m²</Text>
                            </View>
                            <View>
                                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-1">Valor Total</Text>
                                <Text className="text-on-surface font-headline font-bold text-lg leading-tight">${entry.price_total_clp.toLocaleString()} CLP</Text>
                            </View>
                        </View>
                    </View>

                    {/* Financial Summary */}
                    <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Estado Financiero</Text>
                    <View className="bg-surface-container-high rounded-[32px] p-6 mb-8 border border-white/5">
                        <View className="mb-6">
                            <View className="flex-row justify-between items-end mb-3">
                                <Text className="text-on-surface-variant text-xs font-bold">Progreso de Pago</Text>
                                <Text className="text-primary font-display font-black text-lg">{Math.round((entry.totalInvested / entry.price_total_clp) * 100)}%</Text>
                            </View>
                            <View className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                <View style={{ width: `${(entry.totalInvested / entry.price_total_clp) * 100}%` }} className="h-full bg-primary" />
                            </View>
                        </View>
                        <View className="flex-row justify-between mb-2">
                             <View className="flex-1">
                                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-1">Invertido</Text>
                                <Text className="text-on-surface font-headline font-bold text-base">${entry.totalInvested.toLocaleString()}</Text>
                             </View>
                             <View className="flex-1 items-end">
                                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-1">Saldo</Text>
                                <Text className="text-secondary font-display font-black text-base">${entry.pendingBalance.toLocaleString()}</Text>
                             </View>
                        </View>
                        <View className="h-[1px] bg-white/5 my-4" />
                        <InfoRow label="Cuota Mensual" value={`$${entry.valor_cuota.toLocaleString()} CLP`} icon={<Wallet color="#edc062" size={16} />} />
                        <InfoRow label="Monto Pie" value={`$${entry.pie.toLocaleString()} CLP`} icon={<CreditCard color="#a8cdd4" size={16} />} />
                        <InfoRow label="Cuotas Pagadas" value={entry.installments_paid} icon={<CheckCircle2 color="#a8cdd4" size={16} />} />
                    </View>

                    {/* Customer Data */}
                    <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Datos del Cliente</Text>
                    <View className="bg-[#1e2a2d]/60 rounded-[32px] p-6 mb-8 border border-white/5">
                        <InfoRow label="Nombre" value={entry.customerName} icon={<User color="#a8cdd4" size={16} />} />
                        <InfoRow label="RUT" value={entry.rut} icon={<FileText color="#edc062" size={16} />} />
                        <InfoRow label="Teléfono" value={entry.phone} icon={<Phone color="#edc062" size={16} />} />
                        <InfoRow label="Email" value={entry.email} icon={<Mail color="#a8cdd4" size={16} />} />
                    </View>

                    {/* Documentation */}
                    <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Documentación</Text>
                    <DocButton title="Contrato de Reserva" type="RESERVA" />
                    <DocButton title="Promesa de Compraventa" type="PROMESA" />
                    <DocButton title="Cédula de Identidad" type="CEDULA" />

                    {/* Quick Action */}
                    <TouchableOpacity 
                        className="bg-secondary p-5 rounded-[32px] mt-8 items-center shadow-2xl shadow-secondary/20"
                        onPress={() => {}}
                    >
                        <Text className="text-on-secondary font-display font-black uppercase tracking-[2px] text-xs">Subir Comprobante Manual</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default LedgerDetailScreen;
