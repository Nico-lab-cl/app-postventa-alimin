import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Search, ArrowLeft, User, Phone, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ledgerService, LedgerEntry } from '../api/ledgerService';

const SelectClientForPaymentScreen = () => {
    const navigation = useNavigation<any>();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: ledger, isLoading } = useQuery({
        queryKey: ['ledgerBasicSearch'],
        queryFn: () => ledgerService.getLedger('ALL')
    });

    // Filtramos solo los lotes "Sold" que tienen clientes
    const clients = React.useMemo(() => {
        if (!ledger) return [];
        let filtered = ledger.filter(l => l.customerId && l.pie_status === 'PAID');
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(l => 
                l.customerName?.toLowerCase().includes(q) || 
                l.rut?.toLowerCase().includes(q) || 
                l.lotId.includes(q)
            );
        }
        return filtered;
    }, [ledger, searchQuery]);

    const handleSelectClient = (client: LedgerEntry) => {
        // En vez de ir al detalle del Terreno, abrimos el Dashboard de Pagos
        navigation.navigate('PaymentDashboard', { clientId: client.customerId, lotId: client.lotId });
    };

    return (
        <View className="flex-1 bg-background">
            <LinearGradient colors={['rgba(54, 89, 95, 0.1)', 'transparent']} className="absolute inset-0" />
            
            <View className="px-6 h-28 flex-row items-center justify-between z-50 bg-neutral-950/80 pb-2 border-b border-white/5" style={{ paddingTop: Platform.OS === 'ios' ? 44 : 20 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2">
                    <ArrowLeft color="#a8cdd4" size={24} />
                    <View>
                        <Text className="font-display font-black text-[#edc062] tracking-tighter text-lg uppercase">Buscar Cliente</Text>
                        <Text className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">Declarar Transferencia</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View className="px-6 pt-6 flex-1">
                {/* Search Bar */}
                <View className="bg-surface-container-high rounded-2xl flex-row items-center border border-white/5 mb-6 px-4 py-3">
                    <Search color="#a8cdd4" size={20} />
                    <TextInput 
                        placeholder="Buscar por Nombre, RUT o Lote..."
                        placeholderTextColor="#8b9293"
                        className="flex-1 text-on-surface ml-3 font-body text-base"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#a8cdd4" size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={clients}
                        keyExtractor={item => item.customerId}
                        contentContainerStyle={{ paddingBottom: 60 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                onPress={() => handleSelectClient(item)}
                                className="bg-[#1e2a2d]/40 p-4 rounded-3xl mb-4 flex-row items-center justify-between border border-white/5 active:bg-primary/20"
                            >
                                <View className="flex-row items-center gap-4 flex-1">
                                    <View className="bg-black/30 p-3 rounded-2xl border border-white/10">
                                        <User color="#a8cdd4" size={20} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-on-surface font-headline font-bold text-base">{item.customerName}</Text>
                                        <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest mt-1">Lote {item.lotId} • Etapa {item.stageName.replace('Etapa ', '')}</Text>
                                    </View>
                                </View>
                                <ChevronRight color="rgba(193, 200, 201, 0.3)" size={20} />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                            <View className="items-center py-10 opacity-50">
                                <Text className="text-on-surface-variant font-bold">No se encontraron clientes activos.</Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </View>
    );
};

export default SelectClientForPaymentScreen;
