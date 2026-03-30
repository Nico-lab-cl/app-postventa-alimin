import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Switch, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Phone, Mail, FileText, Landmark, Wallet, Plus, Trash2, Calendar, ShieldCheck, Zap, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ledgerService, LedgerEntry, AssignmentData } from '../api/ledgerService';

const AssignOwnerScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const queryClient = useQueryClient();
    const { lot } = route.params as { lot: LedgerEntry };

    // Form State
    const [formData, setFormData] = useState<AssignmentData>({
        name: lot.customerName?.split(' ')[0] || '',
        surname: lot.customerName?.split(' ').slice(1).join(' ') || '',
        rut: lot.rut || '',
        email: lot.email || '',
        phone: lot.phone || '',
        maritalStatus: 'SOLTERO/A',
        profession: '',
        nationality: 'CHILENA',
        address: {
            street: '',
            number: '',
            region: '',
            commune: ''
        },
        priceTotal: lot.price_total_clp || 0,
        reservationAmount: 500000,
        pieAmount: lot.pie || 0,
        piePaid: lot.pie_status === 'PAID',
        installmentCount: 82,
        normalInstallmentValue: lot.valor_cuota || 0,
        lastInstallmentValue: 0,
        firstInstallmentDate: new Date().toISOString().split('T')[0],
        isPromotion: false,
        freezeMora: false,
        operationalCosts: false,
        exceptionalRanges: []
    });

    const updateField = (field: string, value: any) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...(prev as any)[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const addRange = () => {
        setFormData(prev => ({
            ...prev,
            exceptionalRanges: [...prev.exceptionalRanges, { start: 1, end: 6, value: 0 }]
        }));
    };

    const removeRange = (index: number) => {
        setFormData(prev => ({
            ...prev,
            exceptionalRanges: prev.exceptionalRanges.filter((_, i) => i !== index)
        }));
    };

    const assignMutation = useMutation({
        mutationFn: (data: AssignmentData) => ledgerService.assignOwner(lot.lotId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger'] });
            Alert.alert('Éxito', 'El propietario ha sido asignado correctamente.');
            navigation.goBack();
        },
        onError: (error: any) => {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo realizar la asignación.');
        }
    });

    const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
        <View className="mb-10">
            <View className="flex-row items-center gap-3 mb-6 ml-2">
                <View className="bg-primary/20 p-2.5 rounded-xl">
                    <Icon color="#a8cdd4" size={18} />
                </View>
                <Text className="font-display font-black text-on-surface text-lg uppercase tracking-widest">{title}</Text>
            </View>
            <View className="bg-[#1e2a2d]/60 p-6 rounded-[32px] border border-white/5">
                {children}
            </View>
        </View>
    );

    const InputField = ({ label, value, onChange, placeholder, keyboardType = 'default', half = false }: any) => (
        <View className={`mb-6 ${half ? 'flex-1' : 'w-full'}`}>
            <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-2 ml-1">{label}</Text>
            <View className="bg-white/5 rounded-2xl border border-white/5 px-4 py-3">
                <TextInput
                    className="text-on-surface font-headline font-bold text-sm"
                    value={String(value)}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(193, 200, 201, 0.3)"
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <LinearGradient colors={['rgba(54, 89, 95, 0.15)', 'transparent']} className="absolute inset-0" />
            
            {/* Header */}
            <View className="px-6 h-24 flex-row items-center justify-between z-50 bg-neutral-950/60" style={{ paddingTop: Platform.OS === 'ios' ? 40 : 0 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2">
                    <ArrowLeft color="#a8cdd4" size={24} />
                    <View>
                        <Text className="font-display font-black text-[#edc062] tracking-tighter text-xl uppercase">Asignación Propietario</Text>
                        <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">{lot.lotId} • {lot.stageName}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                    
                    {/* Progress Info */}
                    <View className="bg-secondary/10 p-6 rounded-[32px] border border-secondary/20 mb-10 flex-row items-center gap-4">
                        <Zap color="#edc062" size={24} />
                        <Text className="flex-1 text-secondary text-xs font-bold leading-tight">
                            Estás configurando el contrato digital para este terreno. Todos los valores serán usados para generar los documentos PDF y el plan de pagos.
                        </Text>
                    </View>

                    <Section title="Datos Personales" icon={User}>
                        <View className="flex-row gap-4">
                            <InputField label="Nombres" value={formData.name} onChange={(v: string) => updateField('name', v)} placeholder="Ej: Juan" half />
                            <InputField label="Apellidos" value={formData.surname} onChange={(v: string) => updateField('surname', v)} placeholder="Ej: Perez" half />
                        </View>
                        <InputField label="RUT" value={formData.rut} onChange={(v: string) => updateField('rut', v)} placeholder="12.345.678-9" />
                        <InputField label="Email" value={formData.email} onChange={(v: string) => updateField('email', v)} placeholder="cliente@ejemplo.com" keyboardType="email-address" />
                        <InputField label="Teléfono" value={formData.phone} onChange={(v: string) => updateField('phone', v)} placeholder="+56 9..." keyboardType="phone-pad" />
                        <View className="flex-row gap-4">
                            <InputField label="Nacionalidad" value={formData.nationality} onChange={(v: string) => updateField('nationality', v)} placeholder="Chilena" half />
                            <InputField label="Estado Civil" value={formData.maritalStatus} onChange={(v: string) => updateField('maritalStatus', v)} placeholder="Soltero/a" half />
                        </View>
                        <InputField label="Profesión" value={formData.profession} onChange={(v: string) => updateField('profession', v)} placeholder="Ej: Ingeniero" />
                        <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest mb-4 mt-2 border-b border-white/5 pb-2">Dirección</Text>
                        <InputField label="Calle / Pasaje" value={formData.address.street} onChange={(v: string) => updateField('address.street', v)} placeholder="Ej: Av. Las Condes" />
                        <View className="flex-row gap-4">
                            <InputField label="Número" value={formData.address.number} onChange={(v: string) => updateField('address.number', v)} placeholder="1234" half />
                            <InputField label="Comuna" value={formData.address.commune} onChange={(v: string) => updateField('address.commune', v)} placeholder="Ej: La Serena" half />
                        </View>
                    </Section>

                    <Section title="Configuración Financiera" icon={Wallet}>
                        <InputField label="Precio Total Terreno (CLP)" value={formData.priceTotal} onChange={(v: string) => updateField('priceTotal', Number(v))} keyboardType="numeric" />
                        <View className="flex-row gap-4">
                            <InputField label="Monto Reserva" value={formData.reservationAmount} onChange={(v: string) => updateField('reservationAmount', Number(v))} keyboardType="numeric" half />
                            <InputField label="Monto Pie" value={formData.pieAmount} onChange={(v: string) => updateField('pieAmount', Number(v))} keyboardType="numeric" half />
                        </View>
                        <View className="flex-row items-center justify-between mt-2 bg-white/5 p-4 rounded-2xl">
                            <Text className="text-on-surface text-xs font-bold">¿El Pie ya está pagado?</Text>
                            <Switch 
                                value={formData.piePaid} 
                                onValueChange={(v) => updateField('piePaid', v)}
                                trackColor={{ false: '#3e3e3e', true: '#a8cdd4' }}
                                thumbColor={formData.piePaid ? '#edc062' : '#f4f3f4'}
                            />
                        </View>
                    </Section>

                    <Section title="Plan de Cuotas" icon={Landmark}>
                        <InputField label="Total de Cuotas" value={formData.installmentCount} onChange={(v: string) => updateField('installmentCount', Number(v))} keyboardType="numeric" />
                        <View className="flex-row gap-4">
                            <InputField label="Valor Cuota Normal" value={formData.normalInstallmentValue} onChange={(v: string) => updateField('normalInstallmentValue', Number(v))} keyboardType="numeric" half />
                            <InputField label="Valor Última Cuota" value={formData.lastInstallmentValue} onChange={(v: string) => updateField('lastInstallmentValue', Number(v))} keyboardType="numeric" half />
                        </View>
                        <InputField label="Fecha Inicio de Cuotas" value={formData.firstInstallmentDate} onChange={(v: string) => updateField('firstInstallmentDate', v)} placeholder="AAAA-MM-DD" />
                        
                        <View className="mt-4">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">Rangos Excepcionales</Text>
                                <TouchableOpacity onPress={addRange} className="flex-row items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                                    <Plus color="#a8cdd4" size={14} />
                                    <Text className="text-primary text-[8px] font-black uppercase">Agregar Rango</Text>
                                </TouchableOpacity>
                            </View>
                            {formData.exceptionalRanges.map((range, index) => (
                                <View key={index} className="flex-row items-center gap-3 bg-white/5 p-3 rounded-2xl mb-3 border border-white/5">
                                    <View className="flex-row flex-1 items-center gap-2">
                                        <TextInput className="bg-neutral-900 text-white p-2 rounded-lg text-center w-12 text-xs" value={String(range.start)} keyboardType="numeric" />
                                        <Text className="text-on-surface-variant text-[10px]">a</Text>
                                        <TextInput className="bg-neutral-900 text-white p-2 rounded-lg text-center w-12 text-xs" value={String(range.end)} keyboardType="numeric" />
                                        <Text className="text-on-surface-variant text-[10px] ml-1">Valor:</Text>
                                        <TextInput className="flex-1 bg-neutral-900 text-white p-2 rounded-lg text-xs" value={String(range.value)} keyboardType="numeric" />
                                    </View>
                                    <TouchableOpacity onPress={() => removeRange(index)}>
                                        <Trash2 color="#ffb4ab" size={16} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </Section>

                    <Section title="Lógica Especial" icon={ShieldCheck}>
                        <View className="gap-4">
                            {[
                                { label: 'Aplica Promoción', field: 'isPromotion', desc: 'Condiciones especiales de venta' },
                                { label: 'Congelar Mora', field: 'freezeMora', desc: 'El cliente no paga recargos por atraso' },
                                { label: 'Gastos Operacionales', field: 'operationalCosts', desc: 'Incluye gastos de escrituración' }
                            ].map((item, i) => (
                                <View key={i} className="flex-row items-center justify-between bg-white/5 p-4 rounded-[24px]">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-on-surface font-bold text-sm mb-0.5">{item.label}</Text>
                                        <Text className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest opacity-50">{item.desc}</Text>
                                    </View>
                                    <Switch 
                                        value={(formData as any)[item.field]} 
                                        onValueChange={(v) => updateField(item.field, v)}
                                        trackColor={{ false: '#3e3e3e', true: '#a8cdd4' }}
                                        thumbColor={(formData as any)[item.field] ? '#edc062' : '#f4f3f4'}
                                    />
                                </View>
                            ))}
                        </View>
                    </Section>

                    {/* Submit */}
                    <TouchableOpacity 
                        className={`p-6 rounded-[32px] mt-4 flex-row items-center justify-center gap-3 ${assignMutation.isPending ? 'bg-secondary/50' : 'bg-secondary shadow-2xl shadow-secondary/20'}`}
                        disabled={assignMutation.isPending}
                        onPress={() => assignMutation.mutate(formData)}
                    >
                        {assignMutation.isPending ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <CheckCircle color="#000" size={24} />
                                <Text className="text-black font-display font-black text-lg uppercase tracking-widest">Asignar Propietario</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default AssignOwnerScreen;
