import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { ArrowLeft, CheckCircle2, Upload, Minus, Plus, AlertCircle, Banknote, Landmark } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { ledgerService } from '../api/ledgerService';
import { MobileLotFinancials, MobileReservationAccount } from '../types/payment.types';
import { calcularTotalAPagar } from '../lib/financials';

const PaymentTransferScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { financials, account } = (route.params as { financials: MobileLotFinancials, account: MobileReservationAccount }) || {};

    const [installmentsCount, setInstallmentsCount] = useState(1);
    const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!financials || !account) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-white">Error de Contexto. Faltan datos financieros.</Text>
            </View>
        );
    }

    const availableCuotas = Math.max(0, financials.totalCuotas - account.installmentsPaid);
    
    const handleAdd = () => installmentsCount < availableCuotas && setInstallmentsCount(prev => prev + 1);
    const handleSub = () => installmentsCount > 1 && setInstallmentsCount(prev => prev - 1);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para subir el comprobante.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            compressAndSetImage(result.assets[0].uri);
        }
    };

    const compressAndSetImage = async (uri: string) => {
        try {
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1080 } }],
                { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );
            setReceiptBase64(manipResult.base64 || null);
            setReceiptPreview(manipResult.uri);
        } catch (error) {
            Alert.alert('Error', 'No se pudo procesar la imagen');
        }
    };

    const totalCalculado = calcularTotalAPagar(
        installmentsCount,
        account.installmentsPaid,
        financials.totalCuotas,
        financials.valorUltimaCuota,
        financials.valorCuotaNormal,
        account.penaltyAmountClp,
        financials.legacyInstallmentRanges
    );

    const handleSubmit = async () => {
        if (!receiptBase64) {
             Alert.alert('Falta Comprobante', 'Por favor adjunta la foto de tu transferencia.');
             return;
        }

        setIsSubmitting(true);
        try {
             await ledgerService.uploadPaymentReceipt({
                 reservationId: account.reservationId,
                 lotId: financials.lotId,
                 amount: totalCalculado,
                 scope: 'INSTALLMENT',
                 installmentsCount: installmentsCount,
                 receiptBase64
             });
             Alert.alert('Éxito', 'Comprobante enviado. Sujeto a revisión por administración.', [
                 { text: 'Entendido', onPress: () => navigation.goBack() }
             ]);
        } catch (err) {
             Alert.alert('Error', 'Hubo un problema al enviar el comprobante. Intenta nuevamente.');
        } finally {
             setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: number) => val.toLocaleString('es-CL');

    return (
        <View className="flex-1 bg-background">
            <LinearGradient colors={['rgba(54, 89, 95, 0.1)', 'transparent']} className="absolute inset-0" />
            
            <View className="px-6 h-24 flex-row items-center justify-between z-50 bg-neutral-950/80 border-b border-white/5" style={{ paddingTop: Platform.OS === 'ios' ? 40 : 0 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2">
                    <ArrowLeft color="#a8cdd4" size={24} />
                    <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Declarar Pago</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="px-6 pt-6">
                    {/* Bank Info */}
                    <View className="bg-surface-container-high p-6 rounded-3xl border border-white/5 mb-6">
                        <View className="flex-row items-center gap-3 mb-4">
                            <Landmark color="#a8cdd4" size={20} />
                            <Text className="font-display font-bold text-on-surface text-lg">Datos de Transferencia</Text>
                        </View>
                        <View className="space-y-3 gap-3">
                            <View className="flex-row justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                <Text className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest">Banco</Text>
                                <Text className="text-on-surface font-bold text-sm">Banco Santander</Text>
                            </View>
                            <View className="flex-row justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                <Text className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest">Cuenta Corriente</Text>
                                <Text className="text-on-surface font-bold text-sm font-mono">86876868</Text>
                            </View>
                            <View className="flex-row justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                <Text className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest">RUT / Titular</Text>
                                <Text className="text-on-surface font-bold text-sm">77.508.711-0 (Alimin SPA)</Text>
                            </View>
                        </View>
                    </View>

                    {/* Installments Config */}
                    <View className="bg-[#1e2a2d]/40 p-6 rounded-3xl border border-white/5 mb-6">
                        <Text className="font-display font-bold text-on-surface text-lg mb-4">¿Cuántas cuotas vas a transferir?</Text>
                        <View className="flex-row items-center justify-between bg-black/30 p-2 rounded-2xl border border-white/10">
                            <TouchableOpacity onPress={handleSub} className="p-4 bg-white/5 rounded-xl active:bg-white/10">
                                <Minus color="#a8cdd4" size={20} />
                            </TouchableOpacity>
                            <Text className="text-on-surface font-display font-black text-3xl px-6">{installmentsCount}</Text>
                            <TouchableOpacity onPress={handleAdd} className="p-4 bg-white/5 rounded-xl active:bg-white/10">
                                <Plus color="#a8cdd4" size={20} />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-on-surface-variant text-center text-[10px] mt-3 uppercase tracking-widest font-bold">
                            Cobros del #{account.installmentsPaid + 1} al #{account.installmentsPaid + installmentsCount}
                        </Text>
                    </View>

                    {/* Dynamic Breakdown */}
                    <View className="bg-surface-container-highest p-6 rounded-3xl border border-white/5 mb-6">
                        <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-4">Desglose de Pago</Text>
                        
                        <View className="flex-row justify-between mb-3">
                            <Text className="text-on-surface/80 text-sm">Capital ({installmentsCount} cuotas)</Text>
                            <Text className="text-on-surface font-bold">${formatCurrency(totalCalculado - account.penaltyAmountClp)}</Text>
                        </View>

                        {account.penaltyAmountClp > 0 && (
                            <View className="flex-row justify-between mb-3 border-l-2 border-error pl-3 ml-1">
                                <Text className="text-error font-bold text-sm">Interés por mora acumulado</Text>
                                <Text className="text-error font-bold">${formatCurrency(account.penaltyAmountClp)}</Text>
                            </View>
                        )}
                        
                        <View className="h-[1px] bg-white/10 my-4" />
                        
                        <View className="flex-row justify-between items-end">
                            <Text className="text-primary font-display font-black text-lg">Total a Transferir</Text>
                            <Text className="text-primary font-display font-black text-3xl">${formatCurrency(totalCalculado)}</Text>
                        </View>
                    </View>

                    {/* Upload Area */}
                    <Text className="font-display font-bold text-on-surface text-lg mb-4 ml-2">Subir Comprobante</Text>
                    <TouchableOpacity 
                        onPress={pickImage}
                        className={`border-2 border-dashed ${receiptPreview ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-primary/30 bg-primary/5'} rounded-3xl p-8 items-center justify-center mb-8 h-48 overflow-hidden`}
                    >
                        {receiptPreview ? (
                            <View className="items-center absolute inset-0 w-full h-full">
                                <Image source={{ uri: receiptPreview }} className="w-full h-full opacity-60" resizeMode="cover" />
                                <View className="absolute inset-0 items-center justify-center bg-black/40">
                                    <CheckCircle2 color="#2db395" size={40} className="mb-2" />
                                    <Text className="text-emerald-400 font-bold uppercase tracking-widest text-xs shadow-black drop-shadow-lg">Comprobante Adjunto</Text>
                                    <Text className="text-white text-[10px] mt-1 underline">Tocar para cambiar</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View className="bg-primary/20 p-4 rounded-full mb-3">
                                    <Upload color="#a8cdd4" size={28} />
                                </View>
                                <Text className="text-primary font-bold text-sm text-center">Abrir Carrete o Cámara</Text>
                                <Text className="text-primary/60 text-[10px] text-center mt-2 max-w-[200px]">Solo se aceptan capturas de pantalla o fotos del baucher emitido por el banco.</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </View>
            </ScrollView>

            {/* Bottom Sticky CTA */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-background/95 border-t border-white/5 pb-10">
                 <TouchableOpacity 
                    disabled={!receiptBase64 || isSubmitting}
                    onPress={handleSubmit}
                    className={`p-4 rounded-2xl items-center flex-row justify-center gap-3 ${!receiptBase64 ? 'bg-surface-container-highest' : 'bg-primary'}`}
                 >
                     {isSubmitting ? (
                         <ActivityIndicator color="#000" />
                     ) : (
                         <>
                            <Banknote color={!receiptBase64 ? '#5e5e5e' : '#000'} size={20} />
                            <Text className={`${!receiptBase64 ? 'text-[#5e5e5e]' : 'text-black'} font-display font-black uppercase text-sm tracking-widest`}>
                                Declarar Pago Ahora
                            </Text>
                         </>
                     )}
                 </TouchableOpacity>
            </View>

        </View>
    );
};

export default PaymentTransferScreen;
