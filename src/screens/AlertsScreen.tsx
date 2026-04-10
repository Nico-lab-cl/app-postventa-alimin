import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, ScrollView, TextInput, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { 
    AlertTriangle, Clock, ArrowLeft, BellRing, ChevronRight, 
    CheckCircle2, AlertCircle, Bookmark, Search, Download, 
    Filter, X, MapPin, DollarSign, TrendingUp, ShieldCheck
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService, LedgerEntry } from '../api/ledgerService';
import { useAuth } from '../store/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type AlertStatus = 'LATE' | 'GRACE' | 'UPCOMING' | 'OK';

const DEEP_NAVY = '#0a1622';
const CYBER_TEAL = '#3f6066';
const ALIMIN_GOLD = '#edc062';

const AlertsScreen = () => {
    const navigation = useNavigation<any>();
    const { signOut } = useAuth();
    const [filterType, setFilterType] = useState<AlertStatus>('LATE');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['ledger', 'ALERTS'],
        queryFn: () => ledgerService.getLedger('ALL'),
    });

    const statusConfig = {
        LATE: { 
            color: '#ff4d4d', 
            label: 'En Mora', 
            icon: AlertCircle, 
            bg: 'bg-red-500/10', 
            border: 'border-red-500/30', 
            text: 'text-red-400',
            glow: 'shadow-red-500/20'
        },
        GRACE: { 
            color: ALIMIN_GOLD, 
            label: 'Gracia', 
            icon: AlertTriangle, 
            bg: 'bg-amber-500/10', 
            border: 'border-amber-500/30', 
            text: 'text-amber-400',
            glow: 'shadow-amber-500/20'
        },
        UPCOMING: { 
            color: '#a8cdd4', 
            label: 'Próximos', 
            icon: Clock, 
            bg: 'bg-primary/10', 
            border: 'border-primary/30', 
            text: 'text-primary',
            glow: 'shadow-primary/20'
        },
        OK: { 
            color: '#2db395', 
            label: 'Al Día', 
            icon: CheckCircle2, 
            bg: 'bg-emerald-500/10', 
            border: 'border-emerald-500/30', 
            text: 'text-emerald-400',
            glow: 'shadow-emerald-500/20'
        },
    };

    const excludedLots = [
        { stage: "1", number: "28" },
        { stage: "2", number: "1" },
        { stage: "2", number: "29" },
        { stage: "3", number: "26" },
        { stage: "3", number: "27" },
        { stage: "3", number: "43" }
    ];

    const validData = (data || []).reduce((acc: LedgerEntry[], item) => {
        const lotNumberStr = item.lotId.replace(/\D/g, '');
        const stageStr = item.stageName?.replace(/\D/g, '') || item.stageName;
        if (stageStr === '4' || stageStr === 'ETAPA 4') return acc;
        const isExcluded = excludedLots.some(ex => ex.stage === stageStr && ex.number === lotNumberStr);
        if (isExcluded) return acc;
        const statusStr = String(item.lotStatus || '').toLowerCase();
        if (statusStr !== 'sold' && statusStr !== 'paid' && statusStr !== 'confirmed') return acc;
        acc.push(item);
        return acc;
    }, []);

    const counts = {
        LATE: validData.filter(i => i.status === 'LATE').length || 0,
        GRACE: validData.filter(i => i.status === 'GRACE').length || 0,
        UPCOMING: validData.filter(i => i.status === 'UPCOMING').length || 0,
        OK: validData.filter(i => i.status === 'OK').length || 0,
    };

    const filteredAlerts = validData.filter(item => {
        const matchesStatus = item.status === filterType;
        const matchesSearch = item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.lotId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);
    const paginatedAlerts = filteredAlerts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE, 
        currentPage * ITEMS_PER_PAGE
    );

    const handleFilterChange = (type: AlertStatus) => {
        setFilterType(type);
        setCurrentPage(1);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const exportToCSV = async () => {
        if (validData.length === 0) return;
        try {
            const header = 'Cliente,Lote,Etapa,Email,Telefono,Cuotas Pagadas,Total Cuotas,Status,Mora CLP,Total Invertido\n';
            const rows = validData.map(i => 
                `${i.customerName},${i.lotId},${i.stageName},${i.email},${i.phone},${i.installments_paid},${i.total_cuotas},${i.status},${i.penaltyAmount},${i.totalInvested}`
            ).join('\n');
            const csvContent = header + rows;
            const fileUri = `${FileSystem.documentDirectory}reporte_mora_${new Date().getTime()}.csv`;
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
            await Sharing.shareAsync(fileUri);
        } catch (e) {
            Alert.alert('Error', 'No se pudo exportar el archivo');
        }
    };

    const ProgressBar = ({ progress, color }: { progress: number, color: string }) => (
        <View className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-3">
            <View 
                className="h-full rounded-full" 
                style={{ 
                    width: `${Math.min(100, progress)}%`, 
                    backgroundColor: color,
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 5,
                    elevation: 5
                }} 
            />
        </View>
    );

    const AlertCard = ({ item }: { item: LedgerEntry }) => {
        const config = statusConfig[item.status === 'OK' && item.isMoraFrozen ? 'OK' : filterType];
        const Icon = config.icon;
        const progress = (item.installments_paid / (item.total_cuotas || 1)) * 100;

        return (
            <TouchableOpacity 
                onPress={() => navigation.navigate('LedgerDetail', { entry: item })}
                className={`bg-[#1c2a2d]/40 p-5 rounded-3xl mb-5 border ${config.border} backdrop-blur-xl shadow-2xl relative overflow-hidden`}
                style={{ shadowColor: config.color, elevation: 10 }}
            >
                <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center gap-3">
                        <View className={`${config.bg} p-2.5 rounded-2xl`}>
                            <Icon color={config.color} size={20} strokeWidth={2.5} />
                        </View>
                        <View className="flex-1 mr-2">
                            <Text numberOfLines={1} className="text-white font-display font-black text-lg uppercase tracking-tight">{item.customerName}</Text>
                            <View className="flex-row items-center gap-2 mt-0.5">
                                <MapPin color={CYBER_TEAL} size={10} />
                                <Text className="text-[#a8cdd4] font-mono font-bold text-[9px] uppercase tracking-wider">{item.lotId} ({item.stageName})</Text>
                            </View>
                        </View>
                    </View>
                    <View className="items-end">
                        <View className={`${config.bg} px-2.5 py-1 rounded-lg border border-white/5`}>
                            <Text className={`${config.text} font-mono font-black text-[9px] uppercase tracking-tighter`}>
                                {item.status === 'LATE' ? `${item.lateDays} Días` : item.status === 'OK' ? 'OK' : 'PRÓX'}
                            </Text>
                        </View>
                        {item.isMoraFrozen && (
                            <View className="mt-1 flex-row items-center gap-1">
                                <ShieldCheck color="#60a5fa" size={10} />
                                <Text className="text-blue-400 font-mono text-[7px] font-black uppercase">Frozen</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-white/40 font-mono font-bold text-[8px] uppercase tracking-widest">Contrato: {item.installments_paid}/{item.total_cuotas} Cuotas</Text>
                        <Text className="text-white/60 font-mono font-black text-[9px] uppercase">{Math.round(progress)}%</Text>
                    </View>
                    <ProgressBar progress={progress} color={config.color} />
                </View>

                <View className="flex-row justify-between mb-4 gap-4">
                    <View className="flex-1 bg-black/20 p-3 rounded-2xl border border-white/5">
                        <Text className="text-white/40 text-[7px] font-black uppercase tracking-[2px] mb-1">Monto Cuota</Text>
                        <View className="flex-row items-baseline gap-1">
                            <Text className="text-white font-display font-black text-xl tracking-tighter">
                                ${item.valor_cuota.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-1 bg-black/20 p-3 rounded-2xl border border-white/5">
                        <Text className="text-white/40 text-[7px] font-black uppercase tracking-[2px] mb-1">Vencimiento</Text>
                        <View className="flex-row items-center gap-1">
                            <Clock color={config.color} size={10} />
                            <Text className={`${config.text} font-mono font-black text-xs uppercase`}>
                                {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '---'}
                            </Text>
                        </View>
                    </View>
                </View>

                {item.status === 'LATE' && !item.isMoraFrozen && (
                    <View className="mb-4 bg-red-500/10 p-3 rounded-2xl border border-red-500/20 flex-row justify-between items-center">
                        <View>
                            <Text className="text-red-400/60 text-[7px] font-black uppercase tracking-[2px] mb-0.5">Penalización acumulada</Text>
                            <Text className="text-red-400 font-display font-black text-lg tracking-tighter">${item.penaltyAmount.toLocaleString()} CLP</Text>
                        </View>
                        <AlertCircle color="#ff4d4d" size={20} opacity={0.5} />
                    </View>
                )}

                <View className="flex-row justify-between items-center bg-white/5 p-4 rounded-2xl">
                    <View className="flex-row items-center gap-2">
                         <TrendingUp color={CYBER_TEAL} size={14} />
                         <Text className="text-[#a8cdd4] font-mono font-bold text-[9px] uppercase">Contrato Activo</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('LedgerDetail', { entry: item })}
                        className="bg-white/5 p-2 rounded-xl flex-row items-center gap-2"
                    >
                        <Text className="text-secondary font-display font-black text-[9px] uppercase tracking-widest">Detalles</Text>
                        <ChevronRight color={ALIMIN_GOLD} size={16} />
                    </TouchableOpacity>
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
                onPress={() => handleFilterChange(type)}
                className={`px-5 py-4 rounded-3xl mr-3 flex-row items-center gap-3 border ${isActive ? `${config.border} bg-white/5 shadow-2xl` : 'border-white/5 bg-[#1c2a2d]/20 opacity-40'}`}
                style={isActive ? { shadowColor: config.color, elevation: 5 } : {}}
            >
                <Icon color={isActive ? config.color : '#8b9293'} size={16} strokeWidth={isActive ? 3 : 2} />
                <View>
                    <Text className={`font-black text-[9px] uppercase tracking-widest ${isActive ? config.text : 'text-white/40'}`}>{config.label}</Text>
                    <Text className={`font-bold text-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{count}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-[#0a1622]">
            <LinearGradient colors={['rgba(63, 96, 102, 0.15)', 'transparent']} className="absolute inset-0 h-96" />
            
            <View 
                className="absolute top-0 w-full z-50 flex-col pt-14 pb-4 px-6 bg-[#0a1622]/90 border-b border-white/5"
            >
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-white/5 p-2 rounded-xl">
                            <ArrowLeft color="#a8cdd4" size={20} />
                        </TouchableOpacity>
                        <Text className="font-display font-black text-[#edc062] tracking-tighter text-2xl uppercase">Alertas</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity 
                            onPress={() => setIsSearchVisible(!isSearchVisible)}
                            className={`p-2.5 rounded-xl border ${isSearchVisible ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10'}`}
                        >
                            <Search color={isSearchVisible ? ALIMIN_GOLD : "#a8cdd4"} size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={exportToCSV}
                            className="bg-white/5 p-2.5 rounded-xl border border-white/10"
                        >
                            <Download color="#a8cdd4" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {isSearchVisible && (
                    <View className="flex-row items-center bg-black/20 px-4 py-3 rounded-2xl border border-white/10">
                        <Search color="#a8cdd4" size={16} />
                        <TextInput 
                            placeholder="Buscar por nombre, lote o email..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            className="flex-1 ml-3 text-white font-mono text-sm h-6"
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearchChange('')}>
                                <X color="#a8cdd4" size={16} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 150, paddingTop: isSearchVisible ? 180 : 120 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={statusConfig[filterType].color} />
                }
            >
                <View className="px-6 max-w-5xl mx-auto w-full">
                    <View className="mb-8">
                        <View className="flex-row items-center gap-2 mb-1">
                            <TrendingUp color={CYBER_TEAL} size={14} />
                            <Text className="font-mono text-[#a8cdd4] tracking-[3px] uppercase text-[9px] font-black">Finance Intelligence v2</Text>
                        </View>
                        <Text className="font-display font-black text-4xl tracking-tighter text-white">Gestión de Mora</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-6 px-6">
                        {(['LATE', 'GRACE', 'UPCOMING', 'OK'] as AlertStatus[]).map(type => (
                            <FilterChip key={type} type={type} />
                        ))}
                    </ScrollView>

                    <View>
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center gap-2">
                                <View className={`w-1.5 h-6 rounded-full`} style={{ backgroundColor: statusConfig[filterType].color }} />
                                <Text className="font-display font-black text-xl text-white uppercase tracking-tighter">{statusConfig[filterType].label}</Text>
                            </View>
                            <Text className="text-white/40 font-mono text-[9px] font-black uppercase tracking-widest">{filteredAlerts.length} Registros</Text>
                        </View>

                        {isLoading ? (
                            <ActivityIndicator color={statusConfig[filterType].color} size="large" className="mt-10" />
                        ) : (
                            <View>
                                {paginatedAlerts.map((item) => (
                                    <AlertCard key={item.lotId} item={item} />
                                ))}

                                {filteredAlerts.length === 0 && (
                                    <View className="mt-4 items-center justify-center p-12 bg-[#1c2a2d]/20 border-dashed border-white/5 rounded-[40px]">
                                        <ShieldCheck color="#3f6066" size={48} strokeWidth={1} />
                                        <Text className="text-white/40 text-lg text-center font-display font-black mt-6 uppercase tracking-widest">Sin Pendientes</Text>
                                        <Text className="text-white/20 text-center font-mono text-[10px] mt-2">Todo el sector {statusConfig[filterType].label} se encuentra saneado.</Text>
                                    </View>
                                )}

                                {/* Paginación */}
                                {totalPages > 1 && (
                                    <View className="mt-10 flex-row justify-between items-center bg-[#1c2a2d]/40 p-4 rounded-3xl border border-white/5">
                                        <TouchableOpacity 
                                            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className={`px-4 py-2 rounded-xl bg-white/5 ${currentPage === 1 ? 'opacity-20' : 'active:bg-white/10'}`}
                                        >
                                            <Text className="text-white font-display font-black text-[10px] uppercase">Anterior</Text>
                                        </TouchableOpacity>
                                        
                                        <View className="items-center">
                                            <Text className="text-white/40 font-mono text-[8px] uppercase tracking-widest mb-0.5">Página</Text>
                                            <Text className="text-white font-mono font-black text-xs">{currentPage} de {totalPages}</Text>
                                        </View>

                                        <TouchableOpacity 
                                            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className={`px-4 py-2 rounded-xl bg-white/5 ${currentPage === totalPages ? 'opacity-20' : 'active:bg-white/10'}`}
                                        >
                                            <Text className="text-white font-display font-black text-[10px] uppercase">Siguiente</Text>
                                        </TouchableOpacity>
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


