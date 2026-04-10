import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, RefreshControl, Linking, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCog, Mail, KeyRound, MapPin, Phone } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import { ledgerService } from '../api/ledgerService';
import { useNavigation } from '@react-navigation/native';

const AccountManagementScreen = () => {
    const { signOut } = useAuth();
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: users, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['users'],
        queryFn: () => ledgerService.getUsers(),
    });

    const resetMutation = useMutation({
        mutationFn: (userId: string) => ledgerService.resetUserPassword(userId),
        onSuccess: (data) => {
            Alert.alert('Éxito', data.message);
        },
        onError: () => {
            Alert.alert('Error', 'No se pudo restablecer la contraseña.');
        }
    });

    const excludedLots = [
        { stage: "1", number: "28" },
        { stage: "2", number: "1" },
        { stage: "2", number: "29" },
        { stage: "3", number: "26" },
        { stage: "3", number: "27" },
        { stage: "3", number: "43" }
    ];

    const validAccounts = users?.map((u: any) => {
        // Filtramos las reservas de cada usuario para aplicar la lógica de Etapa 4 y Lista Negra
        const validReservations = (u.reservations || []).filter((r: any) => {
            const lotNum = String(r.lotNumber || r.lotId || '').replace(/\D/g, '');
            const stg = String(r.stage || r.stageName || '').replace(/\D/g, '');

            // 1. Exclusión de Etapa 4
            if (stg === '4') return false;

            // 2. Exclusión de Lista Negra
            const isExcluded = excludedLots.some(
                (ex) => ex.stage === stg && ex.number === lotNum
            );
            if (isExcluded) return false;

            // 3. Validación de estatus: Solo excluimos si es explícitamente "disponible" o "pendiente" sin pagos.
            const statusStr = String(r.status || r.lotStatus || '').toLowerCase();
            const pieStatusStr = String(r.pie_status || '').toLowerCase();
            const isInvalid = statusStr === 'available' || (statusStr === 'pending' && pieStatusStr === 'pending' && (r.totalPaid || 0) === 0);

            return !isInvalid;
        });

        return { ...u, validReservations };
    }).filter((u: any) => u.validReservations.length > 0) || [];

    const totalValidLots = validAccounts.reduce((sum, u) => sum + u.validReservations.length, 0);

    const filteredUsers = validAccounts.filter((u: any) => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleResetPassword = (userId: string, name: string) => {
        Alert.alert(
            'Confirmar Restablecimiento',
            `¿Estás seguro de que quieres forzar una nueva contraseña para ${name}? La contraseña pasará a ser "Alimin2024*".`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Restablecer', style: 'destructive', onPress: () => resetMutation.mutate(userId) }
            ]
        );
    };

    const UserCard = ({ user }: { user: any }) => {
        const primaryPhone = user.validReservations.length > 0 ? user.validReservations[0].phone : null;
        const lots = user.validReservations.map((r: any) => `Lote ${r.lotNumber} (E${r.stage})`).join(', ');
        const totalUserLots = user.validReservations.length;

        return (
            <View className="bg-[#1c2a2d]/90 p-5 rounded-3xl mb-4 border border-white/5 mx-6 shadow-xl">
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                        <Text className="text-on-surface font-display font-bold text-lg mb-1">{user.name}</Text>
                        <View className="flex-row items-center gap-1.5 mb-1.5">
                            <Mail color="#a8cdd4" size={12} />
                            <Text className="text-primary font-mono text-xs">{user.email}</Text>
                        </View>
                        {primaryPhone && (
                            <TouchableOpacity onPress={() => Linking.openURL(`whatsapp://send?phone=${primaryPhone.replace('+', '')}`)}>
                                <View className="flex-row items-center gap-1.5 mt-1">
                                    <Phone color="#2db395" size={12} />
                                    <Text className="text-emerald-400 font-mono text-xs font-bold underline">{primaryPhone}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View className="bg-primary/20 px-3 py-1.5 rounded-xl border border-primary/30">
                        <Text className="text-primary font-bold text-[10px] uppercase tracking-wider">{totalUserLots} TERRENOS</Text>
                    </View>
                </View>

                {lots.length > 0 && (
                     <View className="flex-row items-center gap-2 mb-4 bg-black/20 p-3 rounded-xl border border-white/5 mt-2">
                        <MapPin color="#edc062" size={14} />
                        <Text className="text-on-surface-variant font-mono text-xs flex-1">{lots}</Text>
                     </View>
                )}

                <View className="border-t border-white/10 pt-4 flex-row justify-end gap-2 mt-2">
                    <TouchableOpacity 
                        className="bg-secondary/10 border border-secondary/20 px-4 py-3 rounded-xl flex-row items-center gap-2"
                        onPress={() => {
                            // Extraer el primer lote válido
                            const firstLot = user.validReservations.find((r: any) => 
                                (r.pie_status === 'PAID') || (['sold', 'paid', 'confirmed'].includes(String(r.status || '').toLowerCase()))
                            ) || user.validReservations[0];

                            navigation.navigate('ClientFinancialAnalysis', { 
                                user: user,
                                lotId: firstLot ? (firstLot.lotNumber || firstLot.lotId) : null 
                            });
                        }}
                    >
                        <UserCog color="#edc062" size={14} />
                        <Text className="text-secondary font-bold text-[10px] uppercase tracking-widest">Análisis Financiero</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        className="bg-error/20 px-4 py-3 rounded-xl flex-row items-center gap-2"
                        onPress={() => handleResetPassword(user.id, user.name)}
                    >
                        <KeyRound color="#ffb4ab" size={14} />
                        <Text className="text-error font-bold text-[10px] uppercase tracking-widest">Restablecer Clave</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background">
            <View 
                className="absolute top-0 w-full z-50 flex-col pt-16 pb-4 bg-neutral-950/90 px-6 backdrop-blur-md border-b border-primary/10"
            >
                 <View className="flex-row justify-between items-center mb-6">
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-2xl uppercase">Gestión de Cuentas</Text>
                    <View className="flex-row items-center gap-3 bg-[#36595f]/30 px-4 py-2 rounded-full border border-primary/20">
                         <UserCog color="#edc062" size={16} />
                         <View className="flex-row items-baseline gap-1">
                            <Text className="text-white font-mono font-bold text-xs">{validAccounts.length}</Text>
                            <Text className="text-white/40 font-mono text-[8px] uppercase">Clientes</Text>
                            <Text className="text-white/60 mx-1">|</Text>
                            <Text className="text-white font-mono font-bold text-xs">{totalValidLots}</Text>
                            <Text className="text-white/40 font-mono text-[8px] uppercase">Terrenos</Text>
                         </View>
                    </View>
                </View>

                {/* Buscador */}
                <View className="bg-[#1e2a2d] border border-white/10 rounded-2xl flex-row items-center px-4 py-3 shadow-lg">
                    <Search color="#8b9293" size={20} />
                    <TextInput 
                        placeholder="Buscar por Nombre o Correo..."
                        placeholderTextColor="#8b9293"
                        className="flex-1 ml-3 text-on-surface font-display text-base"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <FlatList
                 contentContainerStyle={{ paddingTop: 180, paddingBottom: 150 }}
                 data={filteredUsers}
                 keyExtractor={(item) => item.id}
                 renderItem={({ item }) => <UserCard user={item} />}
                 refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a8cdd4" />}
                 ListEmptyComponent={
                     !isLoading ? (
                         <View className="items-center justify-center mt-32 px-6 opacity-60">
                             <UserCog color="#8b9293" size={64} />
                             <Text className="text-on-surface-variant mt-6 font-display text-center text-lg">No se encontraron clientes.</Text>
                         </View>
                     ) : (
                         <View className="mt-32 items-center">
                            <ActivityIndicator size="large" color="#a8cdd4" />
                         </View>
                     )
                 }
            />
        </View>
    );
};

export default AccountManagementScreen;
