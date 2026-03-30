import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image, RefreshControl, Platform, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, ArrowLeft, FileText, ShieldCheck, CheckCircle, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService } from '../api/ledgerService';
import { useAuth } from '../store/AuthContext';

const ReceiptsScreen = () => {
    const queryClient = useQueryClient();
    const { signOut } = useAuth();
    
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
            Alert.alert('Éxito', 'El recibo ha sido procesado correctamente');
        },
        onError: () => {
            Alert.alert('Error', 'No se pudo procesar el recibo');
        }
    });

    const ReceiptCard = ({ item }: { item: any }) => (
        <View className="bg-[#1e2a2d]/60 p-6 rounded-[32px] mb-8 border border-white/5 overflow-hidden shadow-2xl">
            <View className="flex-row justify-between items-start mb-6">
                <View className="flex-1 mr-4">
                    <Text className="text-on-surface font-display font-bold text-xl tracking-tight leading-tight">{item.customerName}</Text>
                    <Text className="text-secondary font-display font-black text-[10px] uppercase tracking-[2px] mt-1">{item.lotNumber}</Text>
                </View>
                <View className="bg-[#36595f]/20 px-4 py-2 rounded-2xl border border-primary/20">
                    <Text className="text-primary font-display font-black text-sm">${item.amount.toLocaleString()} <Text className="text-[8px] font-normal">USD</Text></Text>
                </View>
            </View>

            <View className="h-64 bg-surface-container-lowest rounded-3xl mb-8 justify-center items-center overflow-hidden border border-white/10 relative">
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="items-center opacity-30">
                        <FileText color="#8b9293" size={48} strokeWidth={1} />
                        <Text className="text-on-surface-variant text-[10px] mt-2 uppercase tracking-[2px] font-bold">Sin comprobante visual</Text>
                    </View>
                )}
                <View className="absolute bottom-4 right-4 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <Text className="text-white font-black text-[10px] uppercase tracking-widest">Vista Previa</Text>
                </View>
            </View>

            <View className="flex-row gap-4">
                <TouchableOpacity 
                    onPress={() => mutation.mutate({ id: item.id, action: 'reject' })}
                    activeOpacity={0.7}
                    className="flex-1 bg-error-container/20 border border-error/20 py-4 rounded-2xl flex-row justify-center items-center"
                >
                    <X color="#ffb4ab" size={18} />
                    <Text className="text-error font-display font-bold ml-2 text-xs uppercase tracking-[2px]">Rechazar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={() => mutation.mutate({ id: item.id, action: 'approve' })}
                    activeOpacity={0.9}
                    className="flex-1 rounded-2xl overflow-hidden shadow-lg shadow-primary/20"
                >
                    <LinearGradient
                        colors={['#a8cdd4', '#36595f']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        className="py-4 flex-row justify-center items-center"
                    >
                        <Check color="#0f353b" size={18} />
                        <Text className="text-[#0f353b] font-display font-black ml-2 text-xs uppercase tracking-[2px]">Aprobar</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            {/* TopAppBar */}
            <View 
                className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 h-24 bg-neutral-950/60"
                style={{ paddingTop: Platform.OS === 'ios' ? 40 : 0 }}
            >
                <LinearGradient 
                    colors={['rgba(54, 89, 95, 0.15)', 'transparent']} 
                    className="absolute inset-0"
                />
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => signOut()}>
                        <ArrowLeft color="#a8cdd4" size={24} />
                    </TouchableOpacity>
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Recibos</Text>
                </View>
                <View className="flex-row items-center gap-4">
                    <ShieldCheck color="#edc062" size={24} />
                </View>
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a8cdd4" />
                }
            >
                <View className="px-6 max-w-5xl mx-auto w-full">
                    {/* Hero Title */}
                    <View className="mb-10">
                        <Text className="font-display text-on-surface-variant tracking-wide uppercase text-[10px] mb-2">Auditoría Financiera</Text>
                        <Text className="font-display font-bold text-4xl tracking-tight text-on-surface mb-2">Gestión de Recibos</Text>
                        <View className="h-1 w-12 bg-primary rounded-full" />
                    </View>

                    {/* Stats Section */}
                    <View className="flex-row gap-6 mb-12 h-32">
                        <View className="flex-1 bg-[#1e2a2d]/60 p-6 rounded-3xl border border-primary-container/20 justify-between overflow-hidden">
                            <View className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full" />
                            <View className="flex-row items-center gap-3">
                                <CheckCircle color="#a8cdd4" size={20} />
                                <Text className="font-display font-medium text-on-surface-variant text-[10px] uppercase tracking-widest">Verificados</Text>
                            </View>
                            <Text className="text-3xl font-display font-black text-primary tracking-tighter">124</Text>
                        </View>
                        <View className="flex-1 bg-[#1e2a2d]/60 p-6 rounded-3xl border border-white/5 justify-between overflow-hidden">
                            <View className="flex-row items-center gap-3">
                                <Clock color="#edc062" size={20} />
                                <Text className="font-display font-medium text-on-surface-variant text-[10px] uppercase tracking-widest">Pendientes</Text>
                            </View>
                            <Text className="text-3xl font-display font-black text-[#edc062] tracking-tighter">{data?.length || 0}</Text>
                        </View>
                    </View>

                    {/* Receipts List */}
                    <View>
                        <View className="flex-row justify-between items-end mb-8 px-2">
                            <Text className="font-display font-bold text-2xl text-on-surface">Validar Ingresos</Text>
                            <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">{data?.length || 0} Pendientes</Text>
                        </View>

                        {isLoading ? (
                            <ActivityIndicator color="#a8cdd4" size="large" className="mt-10" />
                        ) : (
                            <View>
                                {data?.map((item, index) => (
                                    <ReceiptCard key={item.id} item={item} />
                                ))}

                                {data?.length === 0 && (
                                    <View className="mt-4 items-center justify-center p-12 bg-[#1e2a2d]/60 border-dashed border-white/10 opacity-40">
                                        <ShieldCheck color="#8b9293" size={64} strokeWidth={1} />
                                        <Text className="text-on-surface-variant text-xl text-center font-display font-bold mt-6">¡Todo al día!</Text>
                                        <Text className="text-on-surface-variant text-center font-body text-xs mt-2">No hay recibos pendientes de validación.</Text>
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

export default ReceiptsScreen;
