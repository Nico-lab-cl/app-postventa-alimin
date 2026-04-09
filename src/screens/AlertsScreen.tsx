import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, ArrowLeft, BellRing, ChevronRight, CheckCircle2, AlertCircle, Bookmark } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService, LedgerEntry } from '../api/ledgerService';
import { useAuth } from '../store/AuthContext';
import { useNavigation } from '@react-navigation/native';

type AlertStatus = 'LATE' | 'GRACE' | 'UPCOMING' | 'OK';

const AlertsScreen = () => {
    const navigation = useNavigation<any>();
    const { signOut } = useAuth();
    const [filterType, setFilterType] = useState<AlertStatus>('LATE');

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['ledger', 'ALERTS'],
        queryFn: () => ledgerService.getLedger('ALL'),
    });

    const statusConfig = {
        LATE: { color: '#ffb4ab', label: 'En Mora', icon: AlertCircle, bg: 'bg-error/10', border: 'border-error/20', text: 'text-error' },
        GRACE: { color: '#edc062', label: 'Gracia', icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
        UPCOMING: { color: '#a8cdd4', label: 'Próximos', icon: Clock, bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary' },
        OK: { color: '#2db395', label: 'Al Día', icon: CheckCircle2, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    };

    // Excluimos explícitamente a los clientes que tienen el pie 'PENDING'.
    // Mantenemos los 'PAID' y cualquier valor por defecto/vacío (como los lotes Legacy).
    const validData = data?.filter(item => item.pie_status !== 'PENDING') || [];

    const counts = {
        LATE: validData.filter(i => i.status === 'LATE').length || 0,
        GRACE: validData.filter(i => i.status === 'GRACE').length || 0,
        UPCOMING: validData.filter(i => i.status === 'UPCOMING').length || 0,
        OK: validData.filter(i => i.status === 'OK').length || 0,
    };

    const filteredAlerts = validData.filter(item => item.status === filterType);

    const AlertCard = ({ item }: { item: LedgerEntry }) => {
        const config = statusConfig[item.status === 'OK' && item.isMoraFrozen ? 'OK' : filterType];
        const Icon = config.icon;

        return (
            <TouchableOpacity 
                onPress={() => navigation.navigate('LedgerDetail', { entry: item })}
                className={`bg-[#1e2a2d]/60 p-6 rounded-[32px] mb-6 border ${config.border} overflow-hidden shadow-2xl`}
            >
                <View className={`absolute -right-12 -top-12 w-40 h-40 ${config.bg} rounded-full opacity-40`} />
                
                <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-row items-center gap-4">
                        <View className={`${config.bg} p-3 rounded-2xl`}>
                            <Icon color={config.color} size={24} strokeWidth={2} />
                        </View>
                        <View>
                            <Text className="text-on-surface font-display font-bold text-xl tracking-tight leading-tight">{item.customerName}</Text>
                            <View className="flex-row items-center gap-2 mt-1">
                                <Text className="text-secondary font-display font-black text-[10px] uppercase tracking-[2px]">{item.lotId}</Text>
                                {item.isMoraFrozen && (
                                    <View className="bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                        <Text className="text-primary text-[7px] font-black uppercase tracking-tighter">Frozen</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    <View className="items-end gap-1">
                        <View className={`${config.bg} px-3 py-1.5 rounded-full`}>
                            <Text className={`${config.text} font-display font-black text-[10px] uppercase tracking-widest`}>
                                {item.status === 'LATE' ? `${item.lateDays} Días` : item.status === 'OK' ? 'Saneado' : 'Pendiente'}
                            </Text>
                        </View>
                        <View className="flex-row mt-1">
                            {item.is_legacy && <View className="w-2 h-2 rounded-full bg-amber-400 mr-1" />}
                            {item.pie_status === 'PAID' && <View className="w-2 h-2 rounded-full bg-emerald-400 mr-1" />}
                        </View>
                    </View>
                </View>

                <View className="flex-row justify-between items-end">
                    <View>
                        <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-[1px] mb-1">
                            {item.status === 'LATE' ? 'Mora Acumulada' : 'Total Invertido'}
                        </Text>
                        <Text className={`${config.text} font-display font-black text-3xl tracking-tighter`}>
                            ${(item.status === 'LATE' && !item.isMoraFrozen ? item.penaltyAmount : item.totalInvested).toLocaleString()} 
                            <Text className="text-xs font-normal opacity-40 italic ml-1">CLP</Text>
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Text className="text-secondary font-display font-black text-[10px] uppercase tracking-widest">Gestionar</Text>
                        <ChevronRight color="#edc062" size={16} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const FilterChip = ({ type }: { type: AlertStatus }) => {
        const isActive = filterType === type;
        const config = statusConfig[type];
        const count = counts[type];
        const Icon = config.icon;

        return (
            <TouchableOpacity 
                onPress={() => setFilterType(type)}
                className={`px-6 py-4 rounded-[24px] mr-4 flex-row items-center gap-3 border ${isActive ? `${config.border} ${config.bg}` : 'border-white/5 bg-white/5 opacity-60'}`}
            >
                <Icon color={isActive ? config.color : '#8b9293'} size={18} />
                <View>
                    <Text className={`font-black text-[10px] uppercase tracking-widest ${isActive ? config.text : 'text-on-surface-variant'}`}>{config.label}</Text>
                    <Text className={`font-bold text-xs ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>{count} casos</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-background">
            <View 
                className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 h-24 bg-neutral-950/60"
                style={{ paddingTop: Platform.OS === 'ios' ? 40 : 20 }}
            >
                <LinearGradient 
                    colors={['rgba(54, 89, 95, 0.15)', 'transparent']} 
                    className="absolute inset-0"
                />
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#a8cdd4" size={24} />
                    </TouchableOpacity>
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Alertas</Text>
                </View>
                <View className="flex-row items-center gap-4">
                    <BellRing color={statusConfig[filterType].color} size={24} />
                </View>
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={statusConfig[filterType].color} />
                }
            >
                <View className="px-6 max-w-5xl mx-auto w-full">
                    <View className="mb-10">
                        <Text className="font-display text-on-surface-variant tracking-wide uppercase text-[10px] mb-2">Monitoreo de Cartera</Text>
                        <Text className="font-display font-bold text-4xl tracking-tight text-on-surface mb-2">Mora & Alertas</Text>
                        <View className={`h-1.5 w-16 rounded-full`} style={{ backgroundColor: statusConfig[filterType].color }} />
                    </View>

                    {/* Filter Bar */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-6 px-6">
                        {(['LATE', 'GRACE', 'UPCOMING', 'OK'] as AlertStatus[]).map(type => (
                            <FilterChip key={type} type={type} />
                        ))}
                    </ScrollView>

                    {/* Alerts List */}
                    <View>
                        <View className="flex-row justify-between items-end mb-8 px-2">
                            <Text className="font-display font-bold text-2xl text-on-surface">{statusConfig[filterType].label}</Text>
                            <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">{filteredAlerts.length} Registros</Text>
                        </View>

                        {isLoading ? (
                            <ActivityIndicator color={statusConfig[filterType].color} size="large" className="mt-10" />
                        ) : (
                            <View>
                                {filteredAlerts.map((item) => (
                                    <AlertCard key={item.lotId} item={item} />
                                ))}

                                {filteredAlerts.length === 0 && (
                                    <View className="mt-4 items-center justify-center p-12 bg-[#1e2a2d]/60 border-dashed border-white/10 opacity-40 rounded-[40px]">
                                        <Bookmark color="#8b9293" size={64} strokeWidth={1} />
                                        <Text className="text-on-surface-variant text-xl text-center font-display font-bold mt-6">Canal despejado</Text>
                                        <Text className="text-on-surface-variant text-center font-body text-xs mt-2">No se encontraron clientes en estado {statusConfig[filterType].label}.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default AlertsScreen;
