import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Image, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ArrowLeft, Landmark, Map, ChevronRight, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService, LedgerEntry } from '../api/ledgerService';
import { useAuth } from '../store/AuthContext';

const LedgerScreen = () => {
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState('ALL');
    const { signOut } = useAuth();

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['ledger', stage],
        queryFn: () => ledgerService.getLedger(stage),
    });

    const filteredData = data?.filter(item => 
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.lotId.toLowerCase().includes(search.toLowerCase())
    );

    const LedgerCard = ({ item }: { item: LedgerEntry }) => {
        const isOverdue = item.status === 'OVERDUE' || item.lateDays > 0;
        
        return (
            <TouchableOpacity className="glass-card p-4 rounded-3xl mb-4 border border-white/5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                    <View className={`w-14 h-14 rounded-2xl items-center justify-center ${isOverdue ? 'bg-error/10' : 'bg-[#36595f]/20'}`}>
                        <Text className={`font-display font-black text-lg ${isOverdue ? 'text-error' : 'text-primary'}`}>{item.lotId}</Text>
                    </View>
                    <View>
                        <Text className="text-on-surface font-headline font-bold text-sm">{item.customerName}</Text>
                        <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest">{item.stageName} • Manzana {item.lotId.split('-')[0] || 'A'}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                            <View className={`px-2 py-0.5 rounded-full ${isOverdue ? 'bg-error/20' : 'bg-primary/20'}`}>
                                <Text className={`text-[8px] font-black uppercase ${isOverdue ? 'text-error' : 'text-primary'}`}>
                                    {isOverdue ? 'En Mora' : 'Al Día'}
                                </Text>
                            </View>
                            <Text className="text-[10px] text-on-surface-variant/60">${item.pendingBalance.toLocaleString()} USD</Text>
                        </View>
                    </View>
                </View>
                <ChevronRight color="rgba(193, 200, 201, 0.4)" size={20} />
            </TouchableOpacity>
        );
    };

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
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Terrenos</Text>
                </View>
                <View className="flex-row items-center gap-4">
                    <Filter color="#a8cdd4" size={24} />
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
                    {/* Hero Search */}
                    <View className="mb-10">
                        <View className="bg-surface-container-high rounded-full px-6 py-4 flex-row items-center gap-4 border border-outline-variant/10 shadow-xl mb-6">
                            <Search color="#a8cdd4" size={20} />
                            <TextInput 
                                className="flex-1 text-on-surface font-body text-sm"
                                placeholder="Buscar lote o cliente..."
                                placeholderTextColor="rgba(193, 200, 201, 0.5)"
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
                            {['ALL', 'Etapa 1', 'Etapa 2', 'Etapa 3', 'Etapa 4'].map((s, i) => (
                                <TouchableOpacity 
                                    key={i} 
                                    onPress={() => setStage(s === 'ALL' ? 'ALL' : s.replace('Etapa ', ''))}
                                    className={`px-6 py-2 rounded-full mx-2 border ${stage === (s === 'ALL' ? 'ALL' : s.replace('Etapa ', '')) ? 'bg-[#edc062] border-[#edc062]' : 'bg-surface-container-highest border-outline-variant/10'}`}
                                >
                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${stage === (s === 'ALL' ? 'ALL' : s.replace('Etapa ', '')) ? 'text-black' : 'text-on-surface-variant'}`}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* asymmetric stats */}
                    <View className="flex-row gap-6 mb-12 h-44">
                        <View className="flex-1 glass-card p-6 rounded-3xl border border-primary-container/20 justify-between overflow-hidden">
                            <View className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                            <View>
                                <Text className="font-display font-medium text-on-surface-variant text-xs uppercase tracking-widest">Disponibilidad</Text>
                                <Text className="text-4xl font-display font-black text-primary tracking-tighter mt-2">{data?.length || 24} / 86</Text>
                            </View>
                            <View className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden mt-4">
                                <View className="h-full bg-primary w-[28%]" />
                            </View>
                        </View>
                        <View className="w-1/3 gap-6">
                            <View className="flex-1 glass-card p-4 rounded-2xl border border-white/5 items-center justify-center">
                                <TrendingUp color="#edc062" size={24} />
                                <Text className="text-[10px] text-on-surface-variant font-black uppercase mt-1">Precios</Text>
                                <Text className="text-primary font-display font-bold text-xs">+4.2%</Text>
                            </View>
                            <View className="flex-1 glass-card p-4 rounded-2xl border border-white/5 items-center justify-center">
                                <Landmark color="#a8cdd4" size={24} />
                                <Text className="text-[10px] text-on-surface-variant font-black uppercase mt-1">Vistas</Text>
                                <Text className="text-primary font-display font-bold text-xs">Premium</Text>
                            </View>
                        </View>
                    </View>

                    {/* Inventory List */}
                    <View>
                        <View className="flex-row justify-between items-end mb-6 px-2">
                            <Text className="font-display font-bold text-2xl text-on-surface">Inventario</Text>
                            <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">{filteredData?.length || 0} Resultados</Text>
                        </View>
                        
                        {isLoading ? (
                            <ActivityIndicator color="#a8cdd4" size="large" className="mt-10" />
                        ) : (
                            <View>
                                {filteredData?.map((item, index) => (
                                    <LedgerCard key={index} item={item} />
                                ))}
                                
                                {filteredData?.length === 0 && (
                                    <View className="mt-4 items-center justify-center p-8 glass-card border-dashed border-white/10 opacity-40">
                                        <Map color="#8b9293" size={48} strokeWidth={1} />
                                        <Text className="text-on-surface-variant text-center font-headline font-bold mt-4">No se encontraron lotes.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Promo Card */}
                    <TouchableOpacity className="mt-12 rounded-[40px] overflow-hidden relative h-56 border border-white/5 shadow-2xl">
                        <Image 
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC9nBC2die2laW9_UJzK1jsXfWVQEDj8uiEA_AOfo1GdZTNk-G0rO5aWc4tDE7ihW75DGOdRtBCAX324Ryp9SLl-CxDHFcyuR7gSK788egfpz7aFZ9oPjJ3tu7IMEQN8MZyKqaRknEc1Vnp4lFemKL4nyF3UPSWG4KeXwdY1zv0CANJKy8fuucUsOF22XQa1OtbbypyC5bj6-pCfzFBbGgfh6LpkYQxeLy8rhnEA49hMIOrbD-TXYMHkoABtZbLHhbMnUrbcSI4O_f' }}
                            className="w-full h-full"
                        />
                        <LinearGradient 
                            colors={['transparent', 'rgba(0,0,0,0.8)']} 
                            className="absolute inset-0"
                        />
                        <View className="absolute bottom-6 left-8">
                            <Text className="text-secondary font-display font-bold text-[10px] uppercase tracking-[4px] mb-1">Próximo</Text>
                            <Text className="text-white text-3xl font-display font-black tracking-tighter">The Cliffs</Text>
                            <Text className="text-on-surface-variant/80 text-xs">Vistas panorámicas al acantilado.</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default LedgerScreen;
