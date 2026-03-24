import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock } from 'lucide-react-native';
import { ledgerService, LedgerEntry } from '../api/ledgerService';

const AlertsScreen = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['ledger', 'MORA'],
    queryFn: () => ledgerService.getLedger('ALL'),
  });

  const delinquentLedgers = data?.filter(item => item.lateDays > 0 || item.penaltyAmount > 0) || [];

  const MoraCard = ({ item }: { item: LedgerEntry }) => (
    <View className="bg-[#1C1B1B] p-6 rounded-2xl mb-4 border border-[#ffb4ab]/20">
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-[#E5E2E1] font-bold text-lg">{item.customerName}</Text>
          <Text className="text-[#94a3b8] text-sm">{item.lotId} - {item.stageName}</Text>
        </View>
        <View className="bg-[#ffb4ab]/10 px-3 py-1 rounded-full flex-row items-center">
          <AlertTriangle color="#ffb4ab" size={14} className="mr-1" />
          <Text className="text-[#ffb4ab] font-bold text-xs">{item.lateDays}d</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-[#94a3b8] text-xs uppercase">Multa Acumulada</Text>
          <Text className="text-[#ffb4ab] text-xl font-bold">${item.penaltyAmount.toLocaleString()}</Text>
        </View>
        <TouchableOpacity className="bg-[#1C1B1B] border border-[#414849] px-4 py-2 rounded-lg">
          <Text className="text-[#E5E2E1] text-sm">Gestionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] px-6 pt-8">
      <View className="mb-8">
        <Text className="text-[#E5E2E1] text-3xl font-bold font-[Outfit]">Mora & Alertas</Text>
        <Text className="text-[#94a3b8]">Ranking de deuda y vencimientos</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#A8CDD4" />
        </View>
      ) : (
        <FlatList 
          data={delinquentLedgers}
          keyExtractor={(item) => item.lotId}
          renderItem={MoraCard}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center mt-20">
              <Clock color="#94a3b8" size={48} className="mb-4 opacity-20" />
              <Text className="text-[#94a3b8] text-center">No hay clientes en mora actualmente</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default AlertsScreen;
