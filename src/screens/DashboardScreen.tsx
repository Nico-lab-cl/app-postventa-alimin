import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, AlertCircle, FileText, TrendingUp, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService } from '../api/ledgerService';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => ledgerService.getDashboardSummary(),
  });

  const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <View className="bg-surface-container/60 p-5 rounded-3xl mb-4 overflow-hidden">
      <View className="flex-row justify-between items-start mb-4">
        <View className="bg-white/5 p-2 rounded-xl">
          <Icon color={color} size={20} />
        </View>
        <TrendingUp color="#73D9B5" size={16} opacity={0.5} />
      </View>
      <Text className="text-secondary/50 text-[10px] font-sans uppercase tracking-[2px] mb-1">{title}</Text>
      <Text className="text-white text-3xl font-display font-bold">{value}</Text>
      {subValue && (
        <Text className="text-primary/70 text-[10px] mt-2 font-sans">{subValue}</Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={['#0A0E1A', '#131313']}
        className="absolute inset-0"
      />
      
      <ScrollView 
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#73D9B5" />
        }
      >
        <View className="pt-16 pb-8">
          <View className="flex-row justify-between items-end mb-8">
            <View>
              <Text className="text-primary text-[12px] font-sans uppercase tracking-[3px] mb-2">Executive Overview</Text>
              <Text className="text-white text-4xl font-serif font-bold">Resumen</Text>
              <Text className="text-white text-4xl font-serif font-bold opacity-40">de Cartera</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-surface-high border border-white/10 items-center justify-center">
              <Users color="white" size={20} />
            </View>
          </View>

          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%]">
              <StatCard 
                title="Recaudación" 
                value={data ? `$${(data.totalCollection / 1000000).toFixed(1)}M` : '...'} 
                icon={LayoutDashboard} 
                color="#73D9B5"
                subValue="+12% este mes"
              />
            </View>
            <View className="w-[48%]">
              <StatCard 
                title="Contratos" 
                value={data?.activeContracts || '...'} 
                icon={Users} 
                color="#C3C6D7"
                subValue="14 pendientes"
              />
            </View>
            <View className="w-[48%]">
              <StatCard 
                title="Total Mora" 
                value={data ? `$${(data.totalMora / 1000).toFixed(0)}k` : '...'} 
                icon={AlertCircle} 
                color="#FFB4AB"
                subValue="Vencimiento hoy"
              />
            </View>
            <View className="w-[48%]">
              <StatCard 
                title="Recibos" 
                value={data?.pendingReceipts || '...'} 
                icon={FileText} 
                color="#98FFD9"
                subValue="Requiere revisión"
              />
            </View>
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            className="mt-6 rounded-3xl overflow-hidden"
          >
            <LinearGradient
              colors={['#148C6C', '#002117']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-6 flex-row justify-between items-center"
            >
              <View>
                <Text className="text-white text-lg font-bold">Ver Reporte Detallado</Text>
                <Text className="text-white/60 text-xs">Análisis profundo trimestral</Text>
              </View>
              <View className="bg-white/20 p-2 rounded-full">
                <ArrowRight color="white" size={20} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <View className="mt-12 mb-8">
            <Text className="text-white/30 text-[10px] font-sans text-center uppercase tracking-[4px]">Alimin Spa • Coastal Nocturne v2.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;
