import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Platform, Modal, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeft, RefreshCcw, Landmark, BellRing, FileText, TrendingUp, Settings, Lock, LogOut, User, ChevronRight, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ledgerService } from '../api/ledgerService';
import { useAuth } from '../store/AuthContext';

const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const { signOut } = useAuth();
    const [isProfileMenuVisible, setIsProfileMenuVisible] = React.useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = React.useState(false);
    const [passwordData, setPasswordData] = React.useState({ old: '', new: '', confirm: '' });

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['dashboardSummary'],
        queryFn: () => ledgerService.getDashboardSummary(),
    });

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
                    <TouchableOpacity>
                        <ArrowLeft color="#a8cdd4" size={24} />
                    </TouchableOpacity>
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Lomas del Mar</Text>
                </View>
                <View className="flex-row items-center gap-4">
                    <Search color="#a8cdd4" size={24} />
                    <TouchableOpacity 
                        onPress={() => setIsProfileMenuVisible(true)}
                        className="w-10 h-10 rounded-full border border-primary-container overflow-hidden active:opacity-70"
                    >
                        <Image 
                            className="w-full h-full"
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMnereTlFQz73rf1ssaUBPqch7zLN3cEDYT4dF04UpwpyuwbY6CIkXzzdYzq4-LmF7AO0wHVaB_a_iCPnZQeH2z7oT3pM04HGKVxviTDht2_cMof9KYRzSE708io1cBpQO05tm7kWZ39DZkXWIs1PffXNaf-uPvsSse9kuxwXVE-AHybfUpzODF6SDYk_29Eg-bQcmixpDfVUK1NpLvM9kM38XTt5TCxu7j1XGYlHDgIsLB4ltTd2CuWhLlU9iBHp6CeRpSda4Cppd' }}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 110, paddingTop: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a8cdd4" />
                }
            >
                <View className="px-6 max-w-5xl mx-auto w-full">
                    {/* Hero Welcome */}
                    <View className="mb-10">
                        <Text className="font-display text-on-surface-variant tracking-wide uppercase text-[10px] mb-2">Panel de Control</Text>
                        <Text className="font-display font-bold text-4xl tracking-tight text-on-surface mb-2">Hola, Administrador</Text>
                        <View className="h-1 w-12 bg-secondary rounded-full" />
                    </View>

                    {/* Bento Grid Summary */}
                    <View className="flex-col gap-6 mb-12">
                        <View className="flex-row gap-6">
                            {/* Total de Lotes Card */}
                            <View className="flex-1 bg-[#1e2a2d]/60 p-6 rounded-3xl border border-primary-container/20 aspect-square justify-between overflow-hidden">
                                <View className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full" />
                                <View>
                                    <View className="w-10 h-10 items-center justify-center">
                                        <Landmark color="#a8cdd4" size={28} />
                                    </View>
                                    <Text className="font-display font-medium text-on-surface-variant mt-2 text-xs">Total Lotes</Text>
                                </View>
                                <View>
                                    <Text className="text-4xl font-display font-black text-primary tracking-tighter">{data?.activeContracts || 482}</Text>
                                    <View className="flex-row items-center gap-1 mt-1">
                                        <TrendingUp size={10} color="#a8cdd4" />
                                        <Text className="text-[10px] text-on-surface-variant/60">
                                            12 nuevos mes
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Alertas de Deuda Card */}
                            <View className="flex-1 bg-[#1e2a2d]/60 p-6 rounded-3xl border border-error-container/20 aspect-square justify-between overflow-hidden">
                                <View className="absolute -right-8 -top-8 w-32 h-32 bg-error/10 rounded-full" />
                                <View>
                                    <View className="w-10 h-10 items-center justify-center">
                                        <BellRing color="#ffb4ab" size={28} />
                                    </View>
                                    <Text className="font-display font-medium text-on-surface-variant mt-2 text-xs">Alertas Mora</Text>
                                </View>
                                <View>
                                    <Text className="text-4xl font-display font-black text-error tracking-tighter">{data?.totalMora ? Math.round(data.totalMora / 1000) : 24}</Text>
                                    <View className="bg-error/20 self-start px-2 py-0.5 rounded-full mt-1">
                                        <Text className="text-[8px] text-error uppercase font-black">Requerido</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Recibos Pendientes Card */}
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Receipts')}
                            className="bg-[#1e2a2d]/60 p-6 rounded-3xl border border-primary-container/20 h-32 flex-row justify-between items-center overflow-hidden active:bg-[#1e2a2d]/80"
                        >
                            <View className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container/20 rounded-full" />
                            <View>
                                <View className="flex-row items-center gap-3">
                                    <FileText color="#a8cdd4" size={28} />
                                    <View>
                                        <Text className="font-display font-medium text-on-surface-variant text-sm">Recibos Pendientes</Text>
                                        <Text className="text-[10px] text-on-surface-variant/60">Sincronización mensual</Text>
                                    </View>
                                </View>
                            </View>
                            <Text className="text-4xl font-display font-black text-primary-fixed-dim tracking-tighter">{data?.pendingReceipts || 0}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Action Section */}
                    <View className="bg-surface-container-high rounded-3xl p-6 flex-col items-center justify-between gap-6 border border-outline-variant/10 shadow-xl mb-12">
                        <View className="flex-row items-center gap-6 w-full">
                            <View className="w-14 h-14 rounded-full bg-secondary/10 items-center justify-center">
                                <RefreshCcw color="#edc062" size={24} />
                            </View>
                            <View className="flex-1">
                                <Text className="font-display font-bold text-lg text-on-surface">Sincronizar Datos</Text>
                                <Text className="text-on-surface-variant text-xs">Última: Hace 14 minutos</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Receipts')}
                            className="w-full bg-secondary py-4 rounded-full shadow-lg shadow-secondary/10 items-center active:bg-secondary/80"
                        >
                            <Text className="text-on-secondary font-display font-bold uppercase tracking-widest text-xs">Procesar Recibos</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Activity */}
                    <View>
                        <View className="flex-row justify-between items-end mb-6">
                            <Text className="font-display font-bold text-2xl text-on-surface">Actividad Reciente</Text>
                            <TouchableOpacity>
                                <Text className="text-secondary text-xs font-bold uppercase tracking-widest">Ver Todo</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View className="gap-4">
                            {[
                                { title: 'Pago Lote B-24', time: 'Hoy, 10:45 AM', amount: '+$1,250.00', icon: <Landmark color="#a8cdd4" size={20} />, status: 'success' },
                                { title: 'Alerta Mora A-08', time: 'Hoy, 09:12 AM', amount: 'Vencido', icon: <BellRing color="#ffb4ab" size={20} />, status: 'error' },
                                { title: 'Nuevo Recibo', time: 'Ayer, 06:30 PM', amount: '#REC-9021', icon: <FileText color="#c1c8c9" size={20} />, status: 'neutral' },
                            ].map((item, index) => (
                                <View key={index} className="bg-[#1e2a2d]/60 p-5 rounded-3xl flex-row items-center justify-between border border-white/5">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-12 h-12 rounded-2xl bg-surface-container-highest items-center justify-center">
                                            {item.icon}
                                        </View>
                                        <View>
                                            <Text className="text-on-surface font-semibold text-sm">{item.title}</Text>
                                            <Text className="text-on-surface-variant text-[10px]">{item.time}</Text>
                                        </View>
                                    </View>
                                    <Text className={`font-display font-bold ${item.status === 'success' ? 'text-primary' : item.status === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>
                                        {item.amount}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Profile Menu Modal */}
            <Modal
                visible={isProfileMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsProfileMenuVisible(false)}
            >
                <Pressable 
                    className="flex-1 bg-black/40" 
                    onPress={() => setIsProfileMenuVisible(false)}
                >
                    <View className="absolute top-24 right-6 w-72 bg-neutral-900 rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
                        <LinearGradient 
                            colors={['rgba(168, 205, 212, 0.05)', 'transparent']} 
                            className="absolute inset-0"
                        />
                        
                        {/* Profile Header */}
                        <View className="p-6 border-b border-white/5 flex-row items-center gap-4">
                            <View className="w-12 h-12 rounded-full border border-[#edc062] p-0.5">
                                <View className="w-full h-full rounded-full overflow-hidden">
                                    <Image 
                                        className="w-full h-full"
                                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMnereTlFQz73rf1ssaUBPqch7zLN3cEDYT4dF04UpwpyuwbY6CIkXzzdYzq4-LmF7AO0wHVaB_a_iCPnZQeH2z7oT3pM04HGKVxviTDht2_cMof9KYRzSE708io1cBpQO05tm7kWZ39DZkXWIs1PffXNaf-uPvsSse9kuxwXVE-AHybfUpzODF6SDYk_29Eg-bQcmixpDfVUK1NpLvM9kM38XTt5TCxu7j1XGYlHDgIsLB4ltTd2CuWhLlU9iBHp6CeRpSda4Cppd' }}
                                    />
                                </View>
                            </View>
                            <View>
                                <Text className="text-on-surface font-display font-bold">Administrador</Text>
                                <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest">Postventa Master</Text>
                            </View>
                        </View>

                        {/* Menu Options */}
                        <View className="p-2">
                            <TouchableOpacity className="flex-row items-center justify-between p-4 rounded-2xl active:bg-white/5">
                                <View className="flex-row items-center gap-4">
                                    <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
                                        <Settings color="#a8cdd4" size={18} />
                                    </View>
                                    <Text className="text-on-surface text-sm font-semibold text-white">Configuraciones</Text>
                                </View>
                                <ChevronRight color="rgba(255,255,255,0.2)" size={16} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => {
                                    setIsProfileMenuVisible(false);
                                    setIsPasswordModalVisible(true);
                                }}
                                className="flex-row items-center justify-between p-4 rounded-2xl active:bg-white/5"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="w-8 h-8 rounded-xl bg-secondary/10 items-center justify-center">
                                        <Lock color="#edc062" size={18} />
                                    </View>
                                    <Text className="text-on-surface text-sm font-semibold text-white">Cambiar Contraseña</Text>
                                </View>
                                <ChevronRight color="rgba(255,255,255,0.2)" size={16} />
                            </TouchableOpacity>

                            <View className="h-[1px] bg-white/5 my-2 mx-4" />

                            <TouchableOpacity 
                                onPress={() => {
                                    setIsProfileMenuVisible(false);
                                    signOut();
                                }}
                                className="flex-row items-center gap-4 p-4 rounded-2xl active:bg-error/5"
                            >
                                <View className="w-8 h-8 rounded-xl bg-error/10 items-center justify-center">
                                    <LogOut color="#ffb4ab" size={18} />
                                </View>
                                <Text className="text-error text-sm font-bold">Cerrar Sesión</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer / Close Button */}
                        <TouchableOpacity 
                            onPress={() => setIsProfileMenuVisible(false)}
                            className="bg-neutral-800/50 p-4 items-center"
                        >
                            <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-[2px]">Cerrar Menú</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* Password Change Modal */}
            <Modal
                visible={isPasswordModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsPasswordModalVisible(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-neutral-900 rounded-t-[40px] p-8 border-t border-white/10 pb-12">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-on-surface font-display font-bold text-2xl">Cambiar Contraseña</Text>
                                <Text className="text-on-surface-variant text-xs mt-1 text-white/50 uppercase tracking-widest font-black">Seguridad de la Cuenta</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setIsPasswordModalVisible(false)}
                                className="w-10 h-10 rounded-full bg-white/5 items-center justify-center"
                            >
                                <X color="white" size={20} />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-6">
                            <View>
                                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-2 ml-1">Contraseña Actual</Text>
                                <View className="bg-white/5 rounded-2xl p-4 border border-white/5 flex-row items-center">
                                    <Lock color="#a8cdd4" size={18} />
                                    <View className="flex-1 ml-3">
                                        <Text className="text-white/20 text-sm">••••••••••••</Text>
                                    </View>
                                </View>
                            </View>

                            <View>
                                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-2 ml-1">Nueva Contraseña</Text>
                                <View className="bg-white/5 rounded-2xl p-4 border border-white/5 flex-row items-center">
                                    <Lock color="#edc062" size={18} />
                                    <View className="flex-1 ml-3">
                                        <Text className="text-white/20 text-sm">Ingresa la nueva contraseña</Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={() => {
                                    // Placeholder for actual update logic
                                    setIsPasswordModalVisible(false);
                                }}
                                className="bg-secondary py-5 rounded-3xl items-center shadow-xl shadow-secondary/20 mt-4"
                            >
                                <Text className="text-on-secondary font-display font-black uppercase tracking-[2px] text-xs">Actualizar Contraseña</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => setIsPasswordModalVisible(false)}
                                className="py-2 items-center"
                            >
                                <Text className="text-on-surface-variant text-xs opacity-50 font-bold uppercase tracking-widest">Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default DashboardScreen;
