import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Image, Platform, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, ArrowLeft, Landmark, Map, ChevronRight, TrendingUp, Edit3, Trash2, FileText, User, CheckCircle, Clock, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService, LedgerEntry } from '../api/ledgerService';
import { useAuth } from '../store/AuthContext';
import { useNavigation } from '@react-navigation/native';

const LedgerScreen = () => {
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState('ALL');
    const [lotStatusFilter, setLotStatusFilter] = useState('ALL');
    const [showStageDropdown, setShowStageDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
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

    const processedData = data?.map(item => {
        let computedStatus = 'available';
        if (item.lotStatus === 'sold' || (item.lotStatus === 'reserved' && item.pie_status === 'PAID')) {
            computedStatus = 'sold';
        } else if (item.lotStatus === 'reserved' && item.pie_status !== 'PAID') {
            computedStatus = 'reserved';
        }
        return { ...item, computedStatus };
    }) || [];

    const summaryCounts = {
        sold: processedData.filter(i => i.computedStatus === 'sold').length,
        reserved: processedData.filter(i => i.computedStatus === 'reserved').length,
        available: processedData.filter(i => i.computedStatus === 'available').length,
    };

    const filteredData = processedData.filter(item => {
        const matchesSearch = item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
                              item.lotId?.toLowerCase().includes(search.toLowerCase()) ||
                              item.rut?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = lotStatusFilter === 'ALL' || item.computedStatus === lotStatusFilter;
        return matchesSearch && matchesStatus;
    });

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

    const StatusBadge = ({ computedStatus, isPaid }: { computedStatus: string, isPaid: boolean }) => {
        if (computedStatus === 'available') {
            return (
                <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">Disponible</Text>
                </View>
            );
        }
        
        const label = computedStatus === 'sold' ? 'Vendido' : 'Bloqueado';
        const color = computedStatus === 'sold' ? '#ffb4ab' : '#8b9293';

        return (
            <View className="flex-row gap-2">
                {isPaid && (
                    <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20 flex-row items-center gap-1">
                        <CheckCircle color="#a8cdd4" size={8} />
                        <Text className="text-primary text-[8px] font-black uppercase tracking-widest">Pagado</Text>
                    </View>
                )}
                <View style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }} className="px-3 py-1 rounded-full border">
                    <Text style={{ color }} className="text-[8px] font-black uppercase tracking-widest">{label}</Text>
                </View>
            </View>
        );
    };

    const LedgerCard = ({ item }: { item: LedgerEntry & { computedStatus: string } }) => {
        const isPaid = item.pendingBalance <= 0;
        const isAvailable = item.computedStatus === 'available';

        return (
            <View className={`bg-[#1e2a2d]/60 rounded-[32px] mb-6 border ${isAvailable ? 'border-dashed border-white/10' : 'border-white/5'} overflow-hidden`}>
                <View className="p-5">
                    {/* Header */}
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-secondary font-display font-black text-2xl tracking-tighter">{item.lotId}</Text>
                            <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest font-black">{item.stageName}</Text>
                        </View>
                        <StatusBadge computedStatus={item.computedStatus} isPaid={isPaid} />
                    </View>

                    {/* Owner / Status Segment */}
                    <TouchableOpacity 
                        onPress={() => item.customerId ? navigation.navigate('LedgerDetail', { entry: item }) : navigation.navigate('AssignOwner', { lot: item })}
                        className={`flex-row items-center gap-3 mb-6 p-4 rounded-2xl ${isAvailable ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-white/5'}`}
                    >
                        <View className={`${isAvailable ? 'bg-emerald-500/20' : 'bg-primary/20'} p-2.5 rounded-xl`}>
                            {isAvailable ? <Zap color="#2db395" size={18} /> : <User color="#a8cdd4" size={18} />}
                        </View>
                        <View className="flex-1">
                            <Text className={`${isAvailable ? 'text-emerald-400' : 'text-on-surface'} font-headline font-bold text-sm leading-tight`}>
                                {item.customerName}
                            </Text>
                            <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">
                                {isAvailable ? 'Presiona para asignar propietario' : item.rut}
                            </Text>
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
                            className={`flex-1 ${isAvailable ? 'bg-primary' : 'bg-white/5'} py-3.5 rounded-2xl items-center flex-row justify-center gap-2`}
                        >
                            <Edit3 color={isAvailable ? '#000' : '#a8cdd4'} size={14} />
                            <Text className={`${isAvailable ? 'text-black' : 'text-primary'} text-[10px] font-black uppercase`}>
                                {isAvailable ? 'Asignar Lote' : 'Editar'}
                            </Text>
                        </TouchableOpacity>
                        
                        {!isAvailable && (
                            <>
                                <TouchableOpacity 
                                    onPress={() => handleResetLot(item.lotId)}
                                    className="bg-error/10 px-5 py-3 rounded-2xl items-center flex-row justify-center"
                                >
                                    <Trash2 color="#ffb4ab" size={14} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => Linking.openURL(`https://aliminlomasdelmar.com/api/contracts/${item.customerId}/file?type=RESERVA`)}
                                    className="bg-secondary/10 px-5 py-3 rounded-2xl items-center flex-row justify-center"
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
            <View 
                className="absolute top-0 w-full z-50 px-6 h-24 bg-neutral-950/60"
                style={{ paddingTop: Platform.OS === 'ios' ? 40 : 0 }}
            >
                <View className="flex-row justify-between items-center h-full">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity onPress={() => navigation.goBack()}>
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
                    <View className="mb-10 z-[100]" style={{ zIndex: 100, elevation: 100 }}>
                        {/* Counters */}
                        <View className="flex-row justify-between gap-3 mb-6">
                            <View className="flex-1 bg-surface-container-high border border-[#ffb4ab]/20 rounded-2xl p-4 items-center">
                                <Text className="text-[#ffb4ab] font-display font-black text-3xl mb-1">{summaryCounts.sold}</Text>
                                <Text className="text-on-surface-variant text-[8px] uppercase tracking-widest font-black">Vendidos</Text>
                            </View>
                            <View className="flex-1 bg-surface-container-high border border-emerald-500/20 rounded-2xl p-4 items-center">
                                <Text className="text-emerald-400 font-display font-black text-3xl mb-1">{summaryCounts.available}</Text>
                                <Text className="text-on-surface-variant text-[8px] uppercase tracking-widest font-black">Disponibles</Text>
                            </View>
                            <View className="flex-1 bg-surface-container-high border border-[#c1c8c9]/20 rounded-2xl p-4 items-center">
                                <Text className="text-[#c1c8c9] font-display font-black text-3xl mb-1">{summaryCounts.reserved}</Text>
                                <Text className="text-on-surface-variant text-[8px] uppercase tracking-widest font-black">Bloqueados</Text>
                            </View>
                        </View>

                        <View className="bg-surface-container-high rounded-[24px] px-6 py-4 flex-row items-center gap-4 border border-outline-variant/10 shadow-xl mb-6">
                            <Search color="#a8cdd4" size={20} />
                            <TextInput 
                                className="flex-1 text-on-surface font-body text-sm"
                                placeholder="Buscar por Lote, RUT o Nombre..."
                                placeholderTextColor="rgba(193, 200, 201, 0.5)"
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                        
                        {/* Dropdown Filters */}
                        <View className="flex-row gap-4 relative z-50" style={{ zIndex: 50, elevation: 50 }}>
                            {/* Stage Dropdown */}
                            <View className="flex-1 z-50" style={{ zIndex: 50, elevation: 50 }}>
                                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-2 ml-2">Filtrar por Etapa</Text>
                                <TouchableOpacity 
                                    onPress={() => { setShowStageDropdown(!showStageDropdown); setShowStatusDropdown(false); }}
                                    className="bg-surface-container-high border border-white/10 rounded-2xl px-4 py-3 flex-row justify-between items-center"
                                >
                                    <Text className="text-on-surface font-bold text-xs">{stage === 'ALL' ? 'Todas las Etapas' : `Etapa ${stage}`}</Text>
                                    <ChevronRight 
                                        color="#a8cdd4" 
                                        size={16} 
                                        style={{ transform: [{ rotate: showStageDropdown ? '90deg' : '0deg' }] }} 
                                    />
                                </TouchableOpacity>
                                
                                {showStageDropdown && (
                                    <View className="absolute top-[70px] left-0 right-0 bg-[#36595f] border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-[100]" style={{ zIndex: 100, elevation: 100 }}>
                                        {['ALL', '1', '2', '3', '4'].map((s, i) => (
                                            <TouchableOpacity 
                                                key={i} 
                                                onPress={() => { setStage(s); setShowStageDropdown(false); }}
                                                className={`px-4 py-4 border-b border-white/10 ${stage === s ? 'bg-primary' : ''}`}
                                            >
                                                <Text className={`${stage === s ? 'text-[#1e2a2d]' : 'text-on-surface'} font-bold text-xs`}>
                                                    {s === 'ALL' ? 'Todas las Etapas' : `Etapa ${s}`}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Status Dropdown */}
                            <View className="flex-1 z-50" style={{ zIndex: 50, elevation: 50 }}>
                                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-2 ml-2">Estado del Lote</Text>
                                <TouchableOpacity 
                                    onPress={() => { setShowStatusDropdown(!showStatusDropdown); setShowStageDropdown(false); }}
                                    className="bg-surface-container-high border border-white/10 rounded-2xl px-4 py-3 flex-row justify-between items-center"
                                >
                                    <Text className="text-on-surface font-bold text-xs">
                                        {lotStatusFilter === 'ALL' ? 'Todos los Estados' : 
                                         lotStatusFilter === 'available' ? 'Disponibles' : 
                                         lotStatusFilter === 'sold' ? 'Vendidos' : 'Bloqueados'}
                                    </Text>
                                    <ChevronRight 
                                        color="#a8cdd4" 
                                        size={16} 
                                        style={{ transform: [{ rotate: showStatusDropdown ? '90deg' : '0deg' }] }} 
                                    />
                                </TouchableOpacity>
                                
                                {showStatusDropdown && (
                                    <View className="absolute top-[70px] left-0 right-0 bg-[#36595f] border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-[100]" style={{ zIndex: 100, elevation: 100 }}>
                                        {[
                                            { val: 'ALL', label: 'Todos los Estados' },
                                            { val: 'available', label: 'Disponibles' },
                                            { val: 'sold', label: 'Vendidos' },
                                            { val: 'reserved', label: 'Bloqueados' }
                                        ].map((s, i) => (
                                            <TouchableOpacity 
                                                key={i} 
                                                onPress={() => { setLotStatusFilter(s.val); setShowStatusDropdown(false); }}
                                                className={`px-4 py-4 border-b border-white/10 ${lotStatusFilter === s.val ? 'bg-primary' : ''}`}
                                            >
                                                <Text className={`${lotStatusFilter === s.val ? 'text-[#1e2a2d]' : 'text-on-surface'} font-bold text-xs`}>
                                                    {s.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {isLoading ? (
                        <ActivityIndicator color="#a8cdd4" size="large" className="mt-10 z-0" style={{ zIndex: 0 }} />
                    ) : (
                        <View style={{ zIndex: 0, elevation: 0 }}>
                            {filteredData?.map((item, index) => (
                                <LedgerCard key={index} item={item} />
                            ))}
                            
                            {filteredData?.length === 0 && (
                                <View className="mt-4 items-center justify-center p-12 bg-[#1e2a2d]/60 rounded-[40px] border border-dashed border-white/10">
                                    <Map color="#8b9293" size={48} strokeWidth={1} />
                                    <Text className="text-on-surface-variant text-center font-headline font-bold mt-4">No se encontraron resultados.</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default LedgerScreen;
