import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { ArrowLeft, User, Phone, Mail, FileText, ChevronRight, CheckCircle2, AlertCircle, Layout, Wallet, Landmark, AlertTriangle, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LedgerEntry } from '../api/ledgerService';
import { API_BASE_URL } from '../api/client';
import apiClient from '../api/client';
import { Alert } from 'react-native';

const LedgerDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { entry } = (route.params as { entry: LedgerEntry }) || {};

    if (!entry) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-white">Cargando...</Text>
            </View>
        );
    }

    const formatCurrency = (val: number | undefined) => (val ?? 0).toLocaleString('es-CL');
    const formatArea = (val: number | undefined) => (val ?? 0).toFixed(2);

    const InfoRow = ({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) => (
        <View className="flex-row items-center justify-between py-4 border-b border-white/5">
            <View className="flex-row items-center gap-3">
                {icon}
                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">{label}</Text>
            </View>
            <Text className="text-on-surface font-headline font-bold text-sm tracking-tight">{value}</Text>
        </View>
    );

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'LATE':
                return (
                    <View className="bg-error/10 px-3 py-1 rounded-full border border-error/20 flex-row items-center gap-1">
                        <AlertCircle color="#ffb4ab" size={8} />
                        <Text className="text-error text-[8px] font-black uppercase tracking-widest">En Mora</Text>
                    </View>
                );
            case 'GRACE':
                return (
                    <View className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex-row items-center gap-1">
                        <AlertTriangle color="#edc062" size={8} />
                        <Text className="text-amber-400 text-[8px] font-black uppercase tracking-widest">Gracia</Text>
                    </View>
                );
            case 'UPCOMING':
                return (
                    <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20 flex-row items-center gap-1">
                        <Clock color="#a8cdd4" size={8} />
                        <Text className="text-primary text-[8px] font-black uppercase tracking-widest">Próximo</Text>
                    </View>
                );
            case 'OK':
                return (
                    <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex-row items-center gap-1">
                        <CheckCircle2 color="#2db395" size={8} />
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
    const DocButton = ({ title, type }: { title: string; type: string }) => (
        <TouchableOpacity 
            onPress={async () => {
                if (Platform.OS === 'web') {
                    try {
                        const path = `mobile/postventa/contracts/${entry.customerId}/file?type=${type}`;
                        const response = await apiClient.get(path, { responseType: 'blob' });
                        const blobUrl = window.URL.createObjectURL(response.data);
                        window.open(blobUrl, '_blank');
                    } catch (e) {
                        Alert.alert('Error', 'No se pudo abrir el documento.');
                    }
                } else {
                    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
                    Linking.openURL(`${baseUrl}mobile/postventa/contracts/${entry.customerId}/file?type=${type}`);
                }
            }}
            className="bg-[#1e2a2d]/60 p-5 rounded-3xl mb-4 border border-white/5 flex-row items-center justify-between"
        >
            <View className="flex-row items-center gap-4">
                <View className="bg-primary/10 p-2.5 rounded-xl"><FileText color="#a8cdd4" size={20} /></View>
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
                    <View>
                        <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase leading-none">Lote {entry.lotId}</Text>
                        <Text className="text-on-surface-variant text-[8px] uppercase tracking-widest font-black">{entry.stageName}</Text>
                    </View>
                </TouchableOpacity>
                <StatusBadge status={entry.status} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="px-6 pt-6">
                    {/* Resumen Inmobiliario Base */}
                    <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Datos del Lote</Text>
                     <View className="bg-[#1e2a2d]/60 rounded-[32px] p-6 mb-8 border border-white/5">
                        <InfoRow label="Etapa" value={entry.stageName} icon={<Layout color="#edc062" size={16} />} />
                        <InfoRow label="Superficie" value={`${formatArea(entry.area_m2)} m²`} icon={<Layout color="#a8cdd4" size={16} />} />
                        <InfoRow label="Valor Total" value={`$${formatCurrency(entry.price_total_clp)}`} icon={<Landmark color="#edc062" size={16} />} />
                        <InfoRow label="Valor Cuota (Normal)" value={`$${formatCurrency(entry.valor_cuota)}/mes`} icon={<Wallet color="#a8cdd4" size={16} />} />
                     </View>

                    {/* Customer Data */}
                    {entry.customerId ? (
                        <>
                            <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Datos del Propietario</Text>
                            <View className="bg-[#1e2a2d]/60 rounded-[32px] p-6 mb-8 border border-white/5 flex-row items-center gap-5">
                                <View className="bg-black/30 p-4 rounded-full border border-white/10">
                                    <User color="#a8cdd4" size={32} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-on-surface font-headline font-black text-lg mb-1">{entry.customerName}</Text>
                                    <Text className="text-on-surface-variant text-xs mb-1 font-mono">{entry.email}</Text>
                                    <Text className="text-on-surface-variant text-[10px] tracking-widest uppercase font-bold text-primary">{entry.phone}</Text>
                                </View>
                            </View>

                            <Text className="font-display font-bold text-on-surface text-xl mb-6 ml-2">Expediente Legal</Text>
                            <DocButton title="Contrato de Reserva" type="RESERVA" />
                            <DocButton title="Promesa de Compraventa" type="PROMESA" />
                        </>
                    ) : (
                         <View className="bg-black/20 p-6 rounded-3xl border border-white/5 items-center justify-center mt-6">
                             <Layout color="#a8cdd4" size={48} className="mb-4 opacity-50" />
                             <Text className="text-on-surface font-headline font-bold text-lg mb-2">Lote Disponible</Text>
                             <Text className="text-on-surface-variant text-center text-xs">Este lote aún no tiene un propietario asignado.</Text>
                         </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default LedgerDetailScreen;
