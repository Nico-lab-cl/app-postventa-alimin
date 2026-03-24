import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, TrendingDown, ArrowRight, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService, LedgerEntry } from '../api/ledgerService';

const AlertsScreen = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ledger', 'MORA'],
    queryFn: () => ledgerService.getLedger('ALL'),
  });

  const delinquentLedgers = data?.filter(item => item.lateDays > 0 || item.penaltyAmount > 0) || [];

  const MoraCard = ({ item }: { item: LedgerEntry }) => (
    <View className="bg-surface-container/50 p-6 rounded-[32px] mb-4 overflow-hidden border border-error/5">
      <View className="flex-row justify-between items-start mb-6">
        <View className="flex-row items-center">
            <View className="bg-error/10 p-2 rounded-xl mr-3">
                <AlertTriangle color="#FFB4AB" size={18} />
            </View>
            <View>
                <Text className="text-white font-serif font-bold text-lg">{item.customerName}</Text>
                <Text className="text-secondary/40 text-[10px] font-sans uppercase tracking-[2px]">{item.lotId}</Text>
            </View>
        </View>
        <View className="bg-error/20 px-3 py-1 rounded-full border border-error/30">
            <Text className="text-error font-bold text-[10px]">{item.lateDays}d de atraso</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-end">
        <View>
          <Text className="text-secondary/40 text-[10px] uppercase tracking-[1px] mb-1">Multa Acumulada</Text>
          <Text className="text-error text-2xl font-display font-bold">${item.penaltyAmount.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
            activeOpacity={0.8}
            className="bg-surface-high px-5 py-3 rounded-2xl border border-white/5 flex-row items-center"
        >
          <Text className="text-white text-xs font-bold mr-2">Gestionar</Text>
          <ArrowRight color="#FFB4AB" size={14} />
        </TouchableOpacity>
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
        <View className="flex-row justify-between items-end mb-10">
            <View>
              <Text className="text-error text-[12px] font-sans uppercase tracking-[3px] mb-2">High Priority Risks</Text>
              <Text className="text-white text-4xl font-serif font-bold">Mora &</Text>
              <Text className="text-white text-4xl font-serif font-bold opacity-40">Alertas</Text>
            </View>
            <View className="bg-error/5 p-3 rounded-2xl">
                <Bell color="#FFB4AB" size={24} />
            </View>
        </View>

        {isLoading ? (
            <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#FFB4AB" />
            </View>
        ) : (
            <FlatList 
            data={delinquentLedgers}
            keyExtractor={(item) => item.lotId}
            renderItem={MoraCard}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FFB4AB" />
            }
            ListEmptyComponent={() => (
                <View className="mt-20 items-center px-10">
                    <View className="bg-primary/5 p-8 rounded-full mb-6">
                        <Clock color="#73D9B5" size={48} opacity={0.2} />
                    </View>
                    <Text className="text-secondary/30 text-center font-serif text-xl italic mb-2">Sin alertas críticas</Text>
                    <Text className="text-secondary/10 text-center font-sans text-[10px] uppercase tracking-[2px]">La cartera está saludable</Text>
                </View>
            )}
            ListFooterComponent={<View className="h-20" />}
            />
        )}
      </View>
    </View>
  );
};

export default AlertsScreen;
