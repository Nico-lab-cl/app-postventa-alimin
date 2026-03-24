import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ArrowUpRight, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService, LedgerEntry } from '../api/ledgerService';

const LedgerScreen = () => {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ledger', stage],
    queryFn: () => ledgerService.getLedger(stage),
  });

  const filteredData = data?.filter(item => 
    item.customerName.toLowerCase().includes(search.toLowerCase()) ||
    item.lotId.toLowerCase().includes(search.toLowerCase())
  );

  const LedgerCard = ({ item }: { item: LedgerEntry }) => (
    <View className="bg-surface-container/50 p-6 rounded-[32px] mb-4 overflow-hidden">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center">
            <View className="bg-white/5 p-2 rounded-xl mr-3">
                <User color="#C3C6D7" size={18} />
            </View>
            <View>
                <Text className="text-white font-serif font-bold text-lg">{item.customerName}</Text>
                <Text className="text-secondary/40 text-[10px] font-sans uppercase tracking-[2px]">{item.stageName}</Text>
            </View>
        </View>
        <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <Text className="text-primary font-bold text-[10px]">{item.lotId}</Text>
        </View>
      </View>
      
      <View className="space-y-4">
        <View>
            <View className="flex-row justify-between mb-2">
                <Text className="text-secondary/60 text-xs font-sans">Progreso de Pago</Text>
                <Text className="text-white text-xs font-bold">{Math.round((item.totalPaid / (item.totalPaid + item.pendingBalance)) * 100)}%</Text>
            </View>
            <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <View 
                className="h-full bg-primary" 
                style={{ width: `${(item.totalPaid / (item.totalPaid + item.pendingBalance)) * 100}%` }} 
                />
            </View>
        </View>

        <View className="flex-row justify-between items-end pt-2">
            <View>
                <Text className="text-secondary/40 text-[10px] uppercase tracking-[1px] mb-1">Saldo Pendiente</Text>
                <Text className="text-white font-display font-bold text-xl">${item.pendingBalance.toLocaleString()}</Text>
            </View>
            <TouchableOpacity className="bg-surface-high p-3 rounded-2xl border border-white/5">
                <ArrowUpRight color="#73D9B5" size={16} />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={['#0A0E1A', '#131313']}
        className="absolute inset-0"
      />
      
      <View className="flex-1 px-6 pt-16">
        <View className="flex-row justify-between items-end mb-8">
            <View>
              <Text className="text-primary text-[12px] font-sans uppercase tracking-[3px] mb-2">Portfolio Details</Text>
              <Text className="text-white text-4xl font-serif font-bold">Cartera</Text>
              <Text className="text-white text-4xl font-serif font-bold opacity-40">de Clientes</Text>
            </View>
        </View>

        <View className="flex-row items-center bg-surface-container/40 px-5 py-4 rounded-3xl mb-6">
            <Search color="#454957" size={20} />
            <TextInput 
            placeholder="Buscar por nombre o lote..." 
            placeholderTextColor="#454957"
            value={search}
            onChangeText={setSearch}
            className="flex-1 ml-3 text-white font-sans"
            />
        </View>

        <View style={{ height: 40 }} className="mb-8">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['ALL', 'Etapa 1', 'Etapa 2', 'Etapa 3', 'Etapa 4'].map(s => (
                <TouchableOpacity 
                key={s}
                onPress={() => setStage(s === 'ALL' ? 'ALL' : s.replace('Etapa ', ''))}
                className={`px-6 justify-center rounded-full mr-2 ${stage === (s === 'ALL' ? 'ALL' : s.replace('Etapa ', '')) ? 'bg-primary' : 'bg-surface-container/40'}`}
                >
                <Text className={stage === (s === 'ALL' ? 'ALL' : s.replace('Etapa ', '')) ? 'text-background font-bold text-xs' : 'text-secondary/60 text-xs'}>{s}</Text>
                </TouchableOpacity>
            ))}
            </ScrollView>
        </View>

        {isLoading ? (
            <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#73D9B5" />
            </View>
        ) : (
            <FlatList 
            data={filteredData}
            keyExtractor={(item) => item.customerId + item.lotId}
            renderItem={LedgerCard}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#73D9B5" />
            }
            ListEmptyComponent={() => (
                <View className="mt-20 items-center">
                    <Text className="text-secondary/20 text-center font-serif text-xl italic">No se encontraron registros</Text>
                </View>
            )}
            ListFooterComponent={<View className="h-20" />}
            />
        )}
      </View>
    </View>
  );
};

export default LedgerScreen;
