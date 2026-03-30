import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Image, Platform, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, ArrowLeft, Landmark, Map, ChevronRight, TrendingUp, Edit3, Trash2, FileText, User, CheckCircle, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService, LedgerEntry } from '../api/ledgerService';
import { useAuth } from '../store/AuthContext';
import { useNavigation } from '@react-navigation/native';

const LedgerScreen = () => {
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState('ALL');
    const [activeTab, setActiveTab] = useState<'MANAGEMENT' | 'DOCUMENTS'>('MANAGEMENT');
    const { signOut } = useAuth();

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['ledger', stage],
        queryFn: () => ledgerService.getLedger(stage),
    });

    const resetLotMutation = useMutation({
        mutationFn: (lotId: string) => ledgerService.resetLot(lotId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger'] });
            Alert.alert('Éxito', 'El lote ha sido reseteado correctamente.');
        },
    });

    const deduplicatedData = React.useMemo(() => {
        if (!data) return [];
        const seen: { [key: string]: LedgerEntry } = {};
        data.forEach(item => {
            const existing = seen[item.lotId];
            if (!existing || (item.pie_status === 'PAID' && existing.pie_status !== 'PAID')) {
                seen[item.lotId] = item;
            }
        });
        return Object.values(seen);
    }, [data]);

    const filteredData = deduplicatedData.filter(item => 
        item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        item.lotId?.toLowerCase().includes(search.toLowerCase()) ||
        item.rut?.toLowerCase().includes(search.toLowerCase())
    );

    const handleResetLot = (lotId: string) => {
        Alert.alert(
            'Confirmar Reset',
            `¿Estás seguro de que deseas eliminar al propietario del lote ${lotId}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => resetLotMutation.mutate(lotId) }
            ]
        );
    };

    const LedgerCard = ({ item }: { item: LedgerEntry }) => {
        const isPaid = item.pendingBalance <= 0;
        const isOffline = item.badges?.includes('GST');

        return (
            <View className="bg-[#1e2a2d]/60 rounded-[32px] mb-6 border border-white/5 overflow-hidden">
                <View className="p-5">
                    {/* Header */}
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-secondary font-display font-black text-2xl tracking-tighter">{item.lotId}</Text>
                            <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest font-black">{item.stageName}</Text>
                        </View>
                        <View className="flex-row gap-2">
                            {isOffline && (
                                <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                    <Text className="text-primary text-[8px] font-black uppercase">Venta Offline</Text>
                                </View>
                            )}
                            <View className={`${isPaid ? 'bg-[#a8cdd4]/10' : 'bg-secondary/10'} px-3 py-1 rounded-full border ${isPaid ? 'border-primary/20' : 'border-secondary/20'}`}>
                                <Text className={`${isPaid ? 'text-primary' : 'text-secondary'} text-[8px] font-black uppercase tracking-widest`}>
                                    {isPaid ? 'PAGADO' : 'PENDIENTE'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Owner */}
                    <TouchableOpacity 
                        onPress={() => item.customerId && navigation.navigate('LedgerDetail', { entry: item })}
                        className="flex-row items-center gap-3 mb-6 bg-white/5 p-3 rounded-2xl"
                    >
                        <View className="bg-primary/20 p-2 rounded-xl">
                            <User color="#a8cdd4" size={16} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-on-surface font-headline font-bold text-sm leading-tight">{item.customerName || 'Disponible'}</Text>
                            <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">{item.rut || 'Sin asignar'}</Text>
                        </View>
                        <ChevronRight color="rgba(193, 200, 201, 0.2)" size={16} />
                    </TouchableOpacity>

                    {/* Info Grid */}
                    <View className="flex-row gap-8 mb-6 px-2">
                        <View>
                            <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-1">Superficie</Text>
                            <Text className="text-on-surface font-bold text-base">{item.area_m2} m²</Text>
                        </View>
                        <View>
                            <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-1">Valor Total</Text>
                            <Text className="text-on-surface font-bold text-base">${item.price_total_clp?.toLocaleString()} CLP</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View className="flex-row gap-3 pt-4 border-t border-white/5">
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('AssignOwner', { lot: item })}
                            className="flex-1 bg-white/5 py-3 rounded-2xl items-center flex-row justify-center gap-2"
                        >
                            <Edit3 color="#a8cdd4" size={14} />
                            <Text className="text-primary text-[10px] font-black uppercase">Asignar</Text>
                        </TouchableOpacity>
                        {item.customerId && (
                            <>
                                <TouchableOpacity 
                                    onPress={() => handleResetLot(item.lotId)}
                                    className="bg-error/10 px-4 py-3 rounded-2xl items-center flex-row justify-center"
                                >
                                    <Trash2 color="#ffb4ab" size={14} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => Linking.openURL(`https://aliminlomasdelmar.com/api/contracts/${item.customerId}/file?type=RESERVA`)}
                                    className="bg-secondary/10 px-4 py-3 rounded-2xl items-center flex-row justify-center"
                                >
                                    <FileText color="#edc062" size={14} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background">
            {/* TopAppBar */}
            <View 
                className="absolute top-0 w-full z-50 px-6 h-24 bg-neutral-950/60"
                style={{ paddingTop: Platform.OS === 'ios' ? 40 : 0 }}
            >
                <View className="flex-row justify-between items-center h-full">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity onPress={() => signOut()}>
                            <ArrowLeft color="#a8cdd4" size={24} />
                        </TouchableOpacity>
                        <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Gestión</Text>
                    </View>
                    <View className="flex-row items-center gap-4">
                        <Filter color="#a8cdd4" size={24} />
                    </View>
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
                    {/* Tab Switcher */}
                    <View className="flex-row bg-[#1e2a2d] p-1.5 rounded-[24px] mb-8 border border-white/5">
                        <TouchableOpacity 
                            onPress={() => setActiveTab('MANAGEMENT')}
                            className={`flex-1 py-3 rounded-[18px] items-center ${activeTab === 'MANAGEMENT' ? 'bg-[#36595f] shadow-lg' : ''}`}
                        >
                            <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'MANAGEMENT' ? 'text-primary' : 'text-on-surface-variant'}`}>Terrenos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setActiveTab('DOCUMENTS')}
                            className={`flex-1 py-3 rounded-[18px] items-center ${activeTab === 'DOCUMENTS' ? 'bg-[#36595f] shadow-lg' : ''}`}
                        >
                            <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'DOCUMENTS' ? 'text-primary' : 'text-on-surface-variant'}`}>Documentos</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'MANAGEMENT' ? (
                        <>
                            {/* Hero Search */}
                            <View className="mb-10">
                                <View className="bg-surface-container-high rounded-[24px] px-6 py-4 flex-row items-center gap-4 border border-outline-variant/10 shadow-xl mb-6">
                                    <Search color="#a8cdd4" size={20} />
                                    <TextInput 
                                        className="flex-1 text-on-surface font-body text-sm"
                                        placeholder="Buscar por Nombre, RUT o Email..."
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

                            {isLoading ? (
                                <ActivityIndicator color="#a8cdd4" size="large" className="mt-10" />
                            ) : (
                                <View>
                                    {filteredData?.map((item, index) => (
                                        <LedgerCard key={index} item={item} />
                                    ))}
                                    
                                    {filteredData?.length === 0 && (
                                        <View className="mt-4 items-center justify-center p-12 bg-[#1e2a2d]/60 rounded-[40px] border border-dashed border-white/10">
                                            <Map color="#8b9293" size={48} strokeWidth={1} />
                                            <Text className="text-on-surface-variant text-center font-headline font-bold mt-4">No se encontraron lotes.</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </>
                    ) : (
                        <View className="items-center justify-center p-12 bg-[#1e2a2d]/60 rounded-[40px] border border-white/5 h-96">
                            <FileText color="#a8cdd4" size={48} strokeWidth={1} />
                            <Text className="text-on-surface font-headline font-bold mt-6 text-center text-lg">Repositorio de Documentos</Text>
                            <Text className="text-on-surface-variant text-center mt-2 text-xs">Filtra por un cliente arriba para ver sus documentos firmados.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default LedgerScreen;
