import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, FileText } from 'lucide-react-native';
import { ledgerService } from '../api/ledgerService';

const ReceiptsScreen = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: () => ledgerService.getReceipts(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => 
      ledgerService.verifyReceipt(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      Alert.alert('Éxito', 'El recibo ha sido procesado correctamente');
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo procesar el recibo');
    }
  });

  const ReceiptCard = ({ item }: { item: any }) => (
    <View className="bg-[#1C1B1B] p-6 rounded-2xl mb-4 border border-[#414849]/10">
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-[#E5E2E1] font-bold text-lg">{item.customerName}</Text>
          <Text className="text-[#94a3b8] text-sm">{item.lotId}</Text>
        </View>
        <Text className="text-[#A8CDD4] font-bold">${item.amount.toLocaleString()}</Text>
      </View>

      <View className="h-40 bg-[#131313] rounded-xl mb-6 justify-center items-center overflow-hidden">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <FileText color="#414849" size={48} />
        )}
      </View>

      <View className="flex-row space-x-3">
        <TouchableOpacity 
          onPress={() => mutation.mutate({ id: item.id, action: 'reject' })}
          className="flex-1 bg-[#1C1B1B] border border-[#ffb4ab]/20 p-4 rounded-xl flex-row justify-center items-center"
        >
          <X color="#ffb4ab" size={20} className="mr-2" />
          <Text className="text-[#ffb4ab] font-bold">Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => mutation.mutate({ id: item.id, action: 'approve' })}
          className="flex-1 bg-[#A8CDD4] p-4 rounded-xl flex-row justify-center items-center"
        >
          <Check color="#131313" size={20} className="mr-2" />
          <Text className="text-[#131313] font-bold">Aprobar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] px-6 pt-8">
      <View className="mb-8">
        <Text className="text-[#E5E2E1] text-3xl font-bold font-[Outfit]">Verificación</Text>
        <Text className="text-[#94a3b8]">Aprobar o rechazar comprobantes de pago</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#A8CDD4" />
        </View>
      ) : (
        <FlatList 
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={ReceiptCard}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center mt-20">
              <Text className="text-[#94a3b8] text-center">No hay recibos pendientes de verificación</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default ReceiptsScreen;
