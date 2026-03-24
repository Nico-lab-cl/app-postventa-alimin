import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { ledgerService, LedgerEntry } from '../api/ledgerService';

const LedgerScreen = () => {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['ledger', stage],
    queryFn: () => ledgerService.getLedger(stage),
  });

  const filteredData = data?.filter(item => 
    item.customerName.toLowerCase().includes(search.toLowerCase()) ||
    item.lotId.toLowerCase().includes(search.toLowerCase())
  );

  const LedgerCard = ({ item }: { item: LedgerEntry }) => (
    <View className="bg-[#1C1B1B] p-6 rounded-2xl mb-4 border border-[#414849]/10">
      <View className="flex-row justify-between mb-2">
        <Text className="text-[#E5E2E1] font-bold text-lg">{item.customerName}</Text>
        <Text className="text-[#A8CDD4] font-bold">{item.lotId}</Text>
      </View>
      <Text className="text-[#94a3b8] text-sm mb-4">{item.stageName}</Text>
      
      <View className="h-2 bg-[#131313] rounded-full mb-2 overflow-hidden">
        <View 
          className="h-full bg-[#A8CDD4]" 
          style={{ width: `${(item.totalPaid / (item.totalPaid + item.pendingBalance)) * 100}%` }} 
        />
      </View>

      <View className="flex-row justify-between items-center mt-2">
        <View className="flex-row items-center">
          {item.badges.map(badge => (
            <View key={badge} className="bg-[#EDC062]/10 px-2 py-1 rounded-md mr-1">
              <Text className="text-[#EDC062] text-xs font-bold">{badge}</Text>
            </View>
          ))}
        </View>
        <Text className="text-[#E5E2E1] font-bold">${item.pendingBalance.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] px-6 pt-8">
      <View className="flex-row items-center bg-[#1C1B1B] p-4 rounded-xl mb-6 border border-[#414849]/20">
        <Search color="#94a3b8" size={20} />
        <TextInput 
          placeholder="Buscar cliente o lote..." 
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          className="flex-1 ml-3 text-[#E5E2E1]"
        />
      </View>

      <View style={{ maxHeight: 50 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {['ALL', 'Etapa 1', 'Etapa 2', 'Etapa 3', 'Etapa 4'].map(s => (
            <TouchableOpacity 
              key={s}
              onPress={() => setStage(s)}
              className={`px-6 py-2 rounded-full mr-2 ${stage === s ? 'bg-[#A8CDD4]' : 'bg-[#1C1B1B] border border-[#414849]/20'}`}
            >
              <Text className={stage === s ? 'text-[#131313] font-bold' : 'text-[#94a3b8]'}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#A8CDD4" />
        </View>
      ) : (
        <FlatList 
          data={filteredData}
          keyExtractor={(item) => item.customerId + item.lotId}
          renderItem={LedgerCard}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <Text className="text-[#94a3b8] text-center mt-10">No se encontraron registros</Text>
          )}
        />
      )}
    </View>
  );
};

export default LedgerScreen;
