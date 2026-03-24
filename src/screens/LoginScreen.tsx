import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../store/AuthContext';
import apiClient from '../api/client';
import { ShieldCheck, ArrowRight } from 'lucide-react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('postventa@lomasdelmar.cl');
  const [password, setPassword] = useState('postventa123');
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
        email,
        password,
      });

      if (response.data.token) {
        await signIn(response.data.token);
      } else {
        Alert.alert('Error', 'No se recibió un token de acceso');
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <LinearGradient
        colors={['#0A0E1A', '#131313']}
        className="absolute inset-0"
      />

      <View className="flex-1 justify-center px-10">
        <View className="items-center mb-16">
          <View className="bg-primary/10 p-5 rounded-3xl border border-primary/20 rotate-12">
            <ShieldCheck color="#73D9B5" size={48} />
          </View>
          <Text className="text-white text-5xl font-serif font-bold mt-8 tracking-tighter">ALIMIN</Text>
          <Text className="text-primary text-[10px] font-sans uppercase tracking-[6px] mt-2 opacity-60">Management Suite</Text>
        </View>

        <View>
          <View className="mb-10">
            <Text className="text-white text-3xl font-serif font-bold mb-2">Bienvenido</Text>
            <Text className="text-secondary/50 font-sans text-sm">Ingresa a la plataforma de gestión</Text>
          </View>

          <View className="space-y-4">
            <View className="bg-surface-container/40 rounded-2xl p-1 mb-4">
              <TextInput 
                placeholder="Email corporativo" 
                placeholderTextColor="#454957"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="text-white px-5 py-4 font-sans"
              />
            </View>
            
            <View className="bg-surface-container/40 rounded-2xl p-1 mb-8">
              <TextInput 
                placeholder="Contraseña" 
                placeholderTextColor="#454957"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="text-white px-5 py-4 font-sans"
              />
            </View>
            
            <TouchableOpacity 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
              className="rounded-full overflow-hidden"
            >
              <LinearGradient
                colors={['#73D9B5', '#148C6C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-5 flex-row justify-center items-center"
              >
                {loading ? (
                  <ActivityIndicator color="#0A0E1A" />
                ) : (
                  <>
                    <Text className="text-[#0A0E1A] font-bold text-lg uppercase tracking-[2px] mr-2">Acceder</Text>
                    <ArrowRight color="#0A0E1A" size={18} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity className="mt-8">
              <Text className="text-secondary/30 text-center font-sans text-xs">Recuperar acceso</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-20">
          <Text className="text-white/10 text-center text-[10px] font-sans uppercase tracking-[4px]">Ethereal Estate Foundation</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
