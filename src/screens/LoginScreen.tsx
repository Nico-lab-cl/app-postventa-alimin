import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '../store/AuthContext';
import apiClient from '../api/client';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

const LoginScreen = () => {
    const [email, setEmail] = useState('postventa@lomasdelmar.cl');
    const [password, setPassword] = useState('postventa123');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingrese email y contraseña');
            return;
        }
        setLoading(true);
        try {
            const response = await apiClient.post('mobile/auth/login', {
                email: email.toLowerCase(),
                password,
            });

            if (response.data.token && response.data.user) {
                await signIn(response.data.token, response.data.user);
            } else {
                Alert.alert('Error', 'No se recibió la información de sesión completa');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const message = error.response?.data?.error || 'Error al conectar con el servidor';
            Alert.alert('Error de Login', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAi1Ps5yYYrXkEf3P0EYvNCxvLpYxUHconsF15DF9_pWthyQgCiKnmjHlGjJ3iV6TYwzhh-9dWWkLum1geMMGtvhtmpeejSJJbi-UiWxCQ11dsihV6riZADCOMz6oYaLgiIQhQ0UUiF6pdKI9GjWryBNXoT3yBuSGiqnaRTmzPBOFERBdK5pdUFHMGK7uDHzcM405ODhJ_gOlEqHueJ_NkM8AXhJaI_nCfOxn_wxRT_cQ_zSCwg1EC4c4fpOacDhPejP1izp7B7kQPX' }}
            className="flex-1"
            resizeMode="cover"
        >
            <View className="absolute inset-0 bg-[#131313]/60" />
            
            {/* Background Bloom Decor */}
            <View className="absolute -top-[10%] -left-[10%] w-[80%] h-[50%] rounded-full bg-primary-container/20" />
            <View className="absolute -bottom-[10%] -right-[10%] w-[80%] h-[50%] rounded-full bg-secondary-container/10" />

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
                    <View className="flex-1 px-8 pt-20 pb-10 justify-center">
                        {/* Branding Header */}
                        <View className="items-center mb-12">
                            <View className="relative w-24 h-24 items-center justify-center">
                                <View className="absolute inset-0 bg-secondary/10 rounded-full" />
                                <Image 
                                    alt="Lomas del Mar Logo" 
                                    className="w-full h-full"
                                    resizeMode="contain"
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBsx8TKlTmN78jKIMdO-InU-aJA8Fp95-Dlw3o7n1G9Fmk_VeMwAa2TxoL1DuR4z0Y85FEk0hhwqHv9enXaC8qETnzGYPwrKkMAgLA-ScPnRhKQaYKsEQqKyhn5-_IfOKE7XkAsF2Dm8tHT-5l477AQyXA2okTyQbnFW5O7FSILnTFArLBr4CJ4vT0klcZuXO8q6Lv3cI4cQBp8yED62cv3yy0jonid6o10Eanu1ruubyy9jFaKR-KO0Qx8Qa_ZNSuzrfQauNuAtXJ' }}
                                />
                            </View>
                            <View className="mt-6 items-center">
                                <Text className="font-display font-black text-3xl tracking-tighter text-on-surface uppercase text-center">Lomas del Mar</Text>
                                <Text className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-bold mt-1 text-center">Postventa & Gestión</Text>
                            </View>
                        </View>

                        {/* Login Form Card */}
                        <View className="bg-[#1c1b1b]/45 rounded-[32px] p-8 border border-white/5 shadow-2xl">
                            <View className="mb-8">
                                <Text className="font-display text-2xl font-bold text-on-surface">Bienvenido</Text>
                                <Text className="text-on-surface-variant text-sm mt-1">Ingresa tus credenciales para acceder al portal.</Text>
                            </View>

                            <View className="space-y-6">
                                {/* Email Field */}
                                <View>
                                    <Text className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1 mb-2">Correo Electrónico</Text>
                                    <View className="relative flex-row items-center bg-surface-container-high rounded-2xl px-4 py-1">
                                        <Mail color="#c1c8c9" size={18} />
                                        <TextInput 
                                            className="flex-1 py-3 pl-3 text-on-surface font-body"
                                            placeholder="nombre@ejemplo.com"
                                            placeholderTextColor="rgba(193, 200, 201, 0.4)"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                </View>

                                {/* Password Field */}
                                <View>
                                    <Text className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1 mb-2">Contraseña</Text>
                                    <View className="relative flex-row items-center bg-surface-container-high rounded-2xl px-4 py-1">
                                        <Lock color="#c1c8c9" size={18} />
                                        <TextInput 
                                            className="flex-1 py-3 pl-3 text-on-surface font-body"
                                            placeholder="••••••••"
                                            placeholderTextColor="rgba(193, 200, 201, 0.4)"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity 
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff color="#c1c8c9" size={18} /> : <Eye color="#c1c8c9" size={18} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity className="self-end mt-1">
                                    <Text className="text-xs font-bold text-secondary">¿Olvidaste tu contraseña?</Text>
                                </TouchableOpacity>

                                {/* Primary Button */}
                                <TouchableOpacity 
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                    className="w-full bg-secondary py-4 rounded-3xl shadow-lg shadow-secondary/10 mt-4 items-center"
                                >
                                    <Text className="text-on-secondary font-display font-black text-lg uppercase tracking-tight">
                                        {loading ? 'Cargando...' : 'Iniciar Sesión'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer links */}
                        <View className="mt-12 items-center">
                            <Text className="text-on-surface-variant text-sm text-center">
                                ¿No tienes una cuenta? {' '}
                                <Text className="text-on-surface font-bold underline">Contactar Soporte</Text>
                            </Text>
                        </View>
                        
                        {/* Mobile Accents */}
                        <View className="mt-8 items-center opacity-30">
                            <View className="h-[1px] w-24 bg-secondary mb-2" />
                            <Text className="text-[8px] font-label uppercase tracking-widest text-on-surface-variant">Residential Portal v2.0</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default LoginScreen;
