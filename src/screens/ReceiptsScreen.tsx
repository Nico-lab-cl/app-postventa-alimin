import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, FileText, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService } from '../api/ledgerService';

const ReceiptsScreen = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['receipts'],
    queryFn: () => ledgerService.getReceipts(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => 
      ledgerService.verifyReceipt(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      Alert.alert('Éxito', 'El recibo ha sido procesado correctamente');
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo procesar el recibo');
    }
  });

  const ReceiptCard = ({ item }: { item: any }) => (
    <View className="bg-surface-container/50 p-6 rounded-[32px] mb-6 overflow-hidden">
      <View className="flex-row justify-between items-start mb-6">
        <View>
          <Text className="text-white font-serif font-bold text-xl">{item.customerName}</Text>
          <Text className="text-secondary/40 text-[10px] font-sans uppercase tracking-[2px]">{item.lotNumber}</Text>
        </View>
        <View className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
            <Text className="text-primary font-bold text-sm">${item.amount.toLocaleString()}</Text>
        </View>
      </View>

      <View className="h-56 bg-surface-low rounded-3xl mb-8 justify-center items-center overflow-hidden border border-white/5 shadow-inner">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="items-center">
            <FileText color="#454957" size={48} />
            <Text className="text-secondary/20 text-[10px] mt-2 uppercase tracking-[2px]">Sin imagen</Text>
          </View>
        )}
      </View>

      <View className="flex-row space-x-4">
        <TouchableOpacity 
          onPress={() => mutation.mutate({ id: item.id, action: 'reject' })}
          activeOpacity={0.7}
          className="flex-1 bg-surface-low border border-error/20 py-4 rounded-2xl flex-row justify-center items-center"
        >
          <X color="#FFB4AB" size={18} />
          <Text className="text-error font-bold ml-2 text-xs uppercase tracking-[1px]">Rechazar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => mutation.mutate({ id: item.id, action: 'approve' })}
          activeOpacity={0.9}
          className="flex-1 rounded-2xl overflow-hidden"
        >
          <LinearGradient
            colors={['#73D9B5', '#148C6C']}
            className="py-4 flex-row justify-center items-center"
          >
            <Check color="#0A0E1A" size={18} />
            <Text className="text-[#0A0E1A] font-bold ml-2 text-xs uppercase tracking-[1px]">Aprobar</Text>
          </LinearGradient>
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
              <Text className="text-primary text-[12px] font-sans uppercase tracking-[3px] mb-2">Internal Audit</Text>
              <Text className="text-white text-4xl font-serif font-bold">Verificación</Text>
              <Text className="text-white text-4xl font-serif font-bold opacity-40">de Pagos</Text>
            </View>
            <View className="bg-primary/5 p-3 rounded-2xl">
                <ShieldCheck color="#73D9B5" size={24} />
            </View>
        </View>

        {isLoading ? (
            <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#73D9B5" />
            </View>
        ) : (
            <FlatList 
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={ReceiptCard}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#73D9B5" />
            }
            ListEmptyComponent={() => (
                <View className="mt-20 items-center px-10">
                    <Text className="text-secondary/20 text-center font-serif text-xl italic mb-4">No hay recibos pendientes</Text>
                    <Text className="text-secondary/10 text-center font-sans text-[10px] uppercase tracking-[2px]">Todo está al día por ahora</Text>
                </View>
            )}
            ListFooterComponent={<View className="h-20" />}
            />
        )}
      </View>
    </View>
  );
};

export default ReceiptsScreen;
