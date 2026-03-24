import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, ArrowLeft, BellRing, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService, LedgerEntry } from '../api/ledgerService';
import { useAuth } from '../store/AuthContext';

const AlertsScreen = () => {
    const { signOut } = useAuth();
    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['ledger', 'MORA'],
        queryFn: () => ledgerService.getLedger('ALL'),
    });

    const delinquentLedgers = data?.filter(item => item.lateDays > 0 || item.penaltyAmount > 0) || [];

    const MoraCard = ({ item }: { item: LedgerEntry }) => (
        <TouchableOpacity className="glass-card p-6 rounded-[32px] mb-6 border border-error/5 overflow-hidden shadow-2xl">
            <View className="absolute -right-12 -top-12 w-40 h-40 bg-error/10 rounded-full blur-3xl" />
            
            <View className="flex-row justify-between items-start mb-6">
                <View className="flex-row items-center gap-4">
                    <View className="bg-error/10 p-3 rounded-2xl">
                        <AlertTriangle color="#ffb4ab" size={24} strokeWidth={2} />
                    </View>
                    <View>
                        <Text className="text-on-surface font-display font-bold text-xl tracking-tight leading-tight">{item.customerName}</Text>
                        <Text className="text-secondary font-display font-black text-[10px] uppercase tracking-[2px] mt-1">{item.lotId}</Text>
                    </View>
                </View>
                <View className="bg-error/20 px-3 py-1.5 rounded-full">
                    <Text className="text-error font-display font-black text-[10px] uppercase tracking-widest">{item.lateDays} Días</Text>
                </View>
            </View>

            <View className="flex-row justify-between items-end">
                <View>
                    <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-[1px] mb-1">Mora Acumulada</Text>
                    <Text className="text-error font-display font-black text-3xl tracking-tighter">${item.penaltyAmount.toLocaleString()} <Text className="text-xs font-normal opacity-40">USD</Text></Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <Text className="text-secondary font-display font-black text-[10px] uppercase tracking-widest">Gestionar</Text>
                    <ChevronRight color="#edc062" size={16} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background">
            {/* TopAppBar */}
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
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Alertas</Text>
                </View>
                <View className="flex-row items-center gap-4">
                    <BellRing color="#ffb4ab" size={24} />
                </View>
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#ffb4ab" />
                }
            >
                <View className="px-6 max-w-5xl mx-auto w-full">
                    {/* Hero Title */}
                    <View className="mb-10">
                        <Text className="font-display text-on-surface-variant tracking-wide uppercase text-[10px] mb-2">Riesgos de Cartera</Text>
                        <Text className="font-display font-bold text-4xl tracking-tight text-on-surface mb-2">Mora & Alertas</Text>
                        <View className="h-1 w-12 bg-error rounded-full" />
                    </View>

                    {/* Alerts List */}
                    <View>
                        <View className="flex-row justify-between items-end mb-8 px-2">
                            <Text className="font-display font-bold text-2xl text-on-surface">Casos Críticos</Text>
                            <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">{delinquentLedgers.length} Incidencias</Text>
                        </View>

                        {isLoading ? (
                            <ActivityIndicator color="#ffb4ab" size="large" className="mt-10" />
                        ) : (
                            <View>
                                {delinquentLedgers.map((item, index) => (
                                    <MoraCard key={item.lotId} item={item} />
                                ))}

                                {delinquentLedgers.length === 0 && (
                                    <View className="mt-4 items-center justify-center p-12 glass-card border-dashed border-white/10 opacity-40">
                                        <Clock color="#8b9293" size={64} strokeWidth={1} />
                                        <Text className="text-on-surface-variant text-xl text-center font-display font-bold mt-6">¡Sin retrasos!</Text>
                                        <Text className="text-on-surface-variant text-center font-body text-xs mt-2">No se detectaron clientes con mora pendiente.</Text>
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
