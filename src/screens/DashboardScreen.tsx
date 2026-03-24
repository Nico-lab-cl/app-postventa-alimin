import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, AlertCircle, FileText } from 'lucide-react-native';
import { ledgerService } from '../api/ledgerService';

const DashboardScreen = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => ledgerService.getDashboardSummary(),
  });

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <View className="bg-[#1C1B1B] p-6 rounded-2xl mb-4 border border-[#414849]/10">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-[#94a3b8] font-[Inter]">{title}</Text>
        <Icon color={color} size={24} />
      </View>
      <Text className="text-[#E5E2E1] text-2xl font-bold font-[Outfit]">{value}</Text>
    </View>
  );

  return (
    <ScrollView 
      className="flex-1 bg-[#131313] px-6"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#A8CDD4" />
      }
    >
      <View className="py-8">
        <Text className="text-[#E5E2E1] text-3xl font-bold font-[Outfit] mb-2">Resumen Ejecutivo</Text>
        <Text className="text-[#94a3b8] mb-8">Estado actual de la cartera</Text>

        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%]">
            <StatCard 
              title="Recaudación" 
              value={data ? `$${(data.totalCollection / 1000000).toFixed(1)}M` : '...'} 
              icon={LayoutDashboard} 
              color="#A8CDD4" 
            />
          </View>
          <View className="w-[48%]">
            <StatCard 
              title="Contratos" 
              value={data?.activeContracts || '...'} 
              icon={Users} 
              color="#EDC062" 
            />
          </View>
          <View className="w-[48%]">
            <StatCard 
              title="Total Mora" 
              value={data ? `$${(data.totalMora / 1000).toFixed(0)}k` : '...'} 
              icon={AlertCircle} 
              color="#ffb4ab" 
            />
          </View>
          <View className="w-[48%]">
            <StatCard 
              title="Recibos" 
              value={data?.pendingReceipts || '...'} 
              icon={FileText} 
              color="#A8CDD4" 
            />
          </View>
        </View>

        <TouchableOpacity className="bg-[#1C1B1B] p-6 rounded-2xl mt-4 border border-[#A8CDD4]/20">
          <Text className="text-[#A8CDD4] font-bold text-center">Ver Reporte Detallado</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;
