import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Image, Platform, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, ArrowLeft, Landmark, Map, ChevronRight, TrendingUp, Edit3, Trash2, FileText, User, CheckCircle2, Clock, Zap, AlertTriangle, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService, LedgerEntry } from '../api/ledgerService';
import { API_BASE_URL } from '../api/client';
import apiClient from '../api/client';
import { useAuth } from '../store/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const LedgerScreen = () => {
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState('ALL');
    const [lotStatusFilter, setLotStatusFilter] = useState('ALL');
    const [showStageDropdown, setShowStageDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;
    const { signOut } = useAuth();

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['ledger', stage],
        queryFn: () => ledgerService.getLedger(stage),
        // Actualizamos de forma automática y pasiva la base de terrenos cada 10 segundos
        // para dar esa sensación de "Tiempo Real" a las reservas entrantes.
        refetchInterval: 10000,
        refetchOnMount: true,
    });

    // Asegura "Tiempo Real" forzado y sincronización inmediata cada que el usuario
    // entra a la pestaña de terrenos.
    useFocusEffect(
        React.useCallback(() => {
            refetch();
        }, [refetch])
    );

    const resetLotMutation = useMutation({
        mutationFn: (lotId: string) => ledgerService.resetLot(lotId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger'] });
            Alert.alert('Éxito', 'El lote ha sido reseteado correctamente.');
        },
    });

    const processedData = data?.map(item => {
        const isVendido = !!item.customerId && item.lotStatus === 'sold';
        const computedStatus = isVendido ? 'sold' : 'available';
        return { ...item, computedStatus };
    }).sort((a, b) => {
        const numA = parseInt(a.lotId.replace(/\D/g, ''), 10);
        const numB = parseInt(b.lotId.replace(/\D/g, ''), 10);
        if (isNaN(numA) || isNaN(numB)) {
            return a.lotId.localeCompare(b.lotId);
        }
        return numA - numB;
    }) || [];

    const summaryCounts = {
        sold: processedData.filter(i => i.computedStatus === 'sold').length,
        available: processedData.filter(i => i.computedStatus === 'available').length,
    };

    const filteredData = processedData.filter(item => {
        const matchesSearch = item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
                              item.lotId?.toLowerCase().includes(search.toLowerCase()) ||
                              item.rut?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = lotStatusFilter === 'ALL' || item.computedStatus === lotStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil((filteredData?.length || 0) / ITEMS_PER_PAGE);
    const paginatedData = filteredData?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) || [];

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

    const StatusBadge = ({ status, moraFrozen }: { status: string, moraFrozen: boolean }) => {
        if (status === 'AVAILABLE') {
            return (
                <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">Disponible</Text>
                </View>
            );
        }

        const normalizedStatus = moraFrozen ? 'OK' : status;

        switch (normalizedStatus) {
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
            default:
                return (
                    <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex-row items-center gap-1">
                        <CheckCircle2 color="#2db395" size={8} />
                        <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">Al Día</Text>
                    </View>
                );
        }
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
                        <View className="items-end gap-2">
                            <StatusBadge status={isAvailable ? 'AVAILABLE' : item.status} moraFrozen={false} />
                            {!isAvailable && item.badges && item.badges.length > 0 && (
                                <View className="flex-row gap-1">
                                    {item.badges.map(b => (
                                        <Text key={b} className="text-[7px] font-black text-on-surface-variant opacity-50 bg-white/5 px-1.5 py-0.5 rounded">{b}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Contextual Content Segment */}
                    {isAvailable ? (
                        <View className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 mb-6">
                            <View className="flex-row items-center gap-2 mb-4">
                                <Zap color="#2db395" size={16} />
                                <Text className="text-emerald-400 font-headline font-bold text-sm">Detalles del Terreno</Text>
                            </View>
                            
                            <View className="flex-row flex-wrap gap-y-5">
                                <View className="w-1/2 pr-2">
                                    <View className="bg-neutral-900/40 p-3 rounded-xl border border-white/5">
                                        <Text className="text-on-surface-variant text-[9px] uppercase font-black tracking-widest mb-1">Superficie</Text>
                                        <Text className="text-on-surface font-bold text-xs">{item.area_m2} m²</Text>
                                    </View>
                                </View>
                                <View className="w-1/2 pl-2">
                                    <View className="bg-neutral-900/40 p-3 rounded-xl border border-white/5">
                                        <Text className="text-on-surface-variant text-[9px] uppercase font-black tracking-widest mb-1">Valor Total</Text>
                                        <Text className="text-on-surface font-bold text-xs">${item.price_total_clp?.toLocaleString()} CLP</Text>
                                    </View>
                                </View>
                                <View className="w-1/2 pr-2">
                                    <View className="bg-neutral-900/40 p-3 rounded-xl border border-white/5">
                                        <Text className="text-on-surface-variant text-[9px] uppercase font-black tracking-widest mb-1">Valor Pie</Text>
                                        <Text className="text-on-surface font-bold text-xs">${item.pie?.toLocaleString() || '0'} CLP</Text>
                                    </View>
                                </View>
                                <View className="w-1/2 pl-2">
                                    <View className="bg-neutral-900/40 p-3 rounded-xl border border-white/5">
                                        <Text className="text-on-surface-variant text-[9px] uppercase font-black tracking-widest mb-1">Reserva</Text>
                                        <Text className="text-on-surface font-bold text-xs">${item.reservation_amount?.toLocaleString() || '0'} CLP</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <>
                            {/* Owner Segment */}
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('LedgerDetail', { entry: item })}
                                className="flex-row items-center gap-3 mb-6 p-4 rounded-2xl bg-white/5"
                            >
                                <View className="bg-primary/20 p-2.5 rounded-xl">
                                    <User color="#a8cdd4" size={18} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-on-surface font-headline font-bold text-sm leading-tight">
                                        {item.customerName}
                                    </Text>
                                    <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">
                                        {item.rut}
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
                        </>
                    )}

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
                                    onPress={async () => {
                                        if (Platform.OS === 'web') {
                                            try {
                                                const path = `mobile/postventa/contracts/${item.customerId}/file?type=RESERVA`;
                                                const response = await apiClient.get(path, { responseType: 'blob' });
                                                const blobUrl = window.URL.createObjectURL(response.data);
                                                window.open(blobUrl, '_blank');
                                            } catch (e) {
                                                Alert.alert('Error', 'No se pudo abrir el documento.');
                                            }
                                        } else {
                                            const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
                                            Linking.openURL(`${baseUrl}mobile/postventa/contracts/${item.customerId}/file?type=RESERVA`);
                                        }
                                    }}
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
                        </View>

                        <View className="bg-surface-container-high rounded-[24px] px-6 py-4 flex-row items-center gap-4 border border-outline-variant/10 shadow-xl mb-6">
                            <Search color="#a8cdd4" size={20} />
                            <TextInput 
                                className="flex-1 text-on-surface font-body text-sm"
                                placeholder="Buscar por Lote, RUT o Nombre..."
                                placeholderTextColor="rgba(193, 200, 201, 0.5)"
                                value={search}
                                onChangeText={(val) => { setSearch(val); setCurrentPage(1); }}
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
                                                onPress={() => { setStage(s); setShowStageDropdown(false); setCurrentPage(1); }}
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
                                         lotStatusFilter === 'available' ? 'Disponibles' : 'Vendidos'}
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
                                            { val: 'sold', label: 'Vendidos' }
                                        ].map((s, i) => (
                                            <TouchableOpacity 
                                                key={i} 
                                                onPress={() => { setLotStatusFilter(s.val); setShowStatusDropdown(false); setCurrentPage(1); }}
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
                            {paginatedData?.map((item, index) => (
                                <LedgerCard key={index} item={item} />
                            ))}
                            
                            {filteredData?.length === 0 && (
                                <View className="mt-4 items-center justify-center p-12 bg-[#1e2a2d]/60 rounded-[40px] border border-dashed border-white/10">
                                    <Map color="#8b9293" size={48} strokeWidth={1} />
                                    <Text className="text-on-surface-variant text-center font-headline font-bold mt-4">No se encontraron resultados.</Text>
                                </View>
                            )}

                            {totalPages > 1 && (
                                <View className="flex-row justify-between items-center mt-4 mb-12 px-2">
                                    <TouchableOpacity 
                                        disabled={currentPage === 1}
                                        onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className={`px-6 py-3 rounded-2xl ${currentPage === 1 ? 'bg-white/5 opacity-50' : 'bg-surface-container-highest border border-white/10'}`}
                                    >
                                        <Text className="text-on-surface-variant font-black text-[10px] uppercase tracking-widest">Anterior</Text>
                                    </TouchableOpacity>
                                    
                                    <Text className="text-on-surface-variant font-bold text-xs">Página {currentPage} de {totalPages}</Text>

                                    <TouchableOpacity 
                                        disabled={currentPage === totalPages}
                                        onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className={`px-6 py-3 rounded-2xl ${currentPage === totalPages ? 'bg-white/5 opacity-50' : 'bg-[#edc062] border border-[#edc062]/20'}`}
                                    >
                                        <Text className={`font-black text-[10px] uppercase tracking-widest ${currentPage === totalPages ? 'text-on-surface-variant' : 'text-black'}`}>Siguiente</Text>
                                    </TouchableOpacity>
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
