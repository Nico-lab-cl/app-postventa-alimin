import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../store/AuthContext';
import apiClient from '../api/client';

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
      const message = error.response?.data?.message || 'Error al conectar con el servidor';
      Alert.alert('Error de Login', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#131313] justify-center px-8">
      <View className="items-center mb-16">
        <View className="w-24 h-24 bg-[#a8cdd4]/10 rounded-full justify-center items-center mb-6 border border-[#a8cdd4]/20">
          <Text className="text-[#a8cdd4] text-5xl font-bold">L</Text>
        </View>
        <Text className="text-[#E5E2E1] text-4xl font-bold text-center" style={{ fontFamily: 'Outfit' }}>
          Lomas del Mar
        </Text>
        <Text className="text-[#94a3b8] text-lg mt-2" style={{ fontFamily: 'Inter' }}>
          Postventa & Gestión
        </Text>
      </View>

      <View className="space-y-6">
        <View className="mb-10">
          <Text className="text-[#E5E2E1] text-2xl font-bold mb-2">Bienvenido</Text>
          <Text className="text-[#94a3b8]">Ingresa tus credenciales para acceder</Text>
        </View>

        <View className="mb-4">
          <TextInput 
            placeholder="Email" 
            placeholderTextColor="#414849"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-[#1C1B1B] text-[#E5E2E1] p-5 rounded-2xl border border-[#414849]/30 focus:border-[#a8cdd4]"
          />
        </View>
        <View className="mb-8">
          <TextInput 
            placeholder="Contraseña" 
            placeholderTextColor="#414849"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-[#1C1B1B] text-[#E5E2E1] p-5 rounded-2xl border border-[#414849]/30 focus:border-[#a8cdd4]"
          />
        </View>
        
        <TouchableOpacity 
          onPress={handleLogin}
          disabled={loading}
          className="bg-[#edc062] p-5 rounded-full flex-row justify-center items-center shadow-lg shadow-[#edc062]/20"
        >
          {loading ? (
            <ActivityIndicator color="#131313" />
          ) : (
            <Text className="text-[#131313] text-center font-bold text-xl uppercase tracking-widest">Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity className="mt-8">
          <Text className="text-[#edc062] text-center font-medium">¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-auto mb-8">
        <Text className="text-[#414849] text-center text-sm">¿No tienes cuenta? <Text className="text-[#a8cdd4]">Contactar Soporte</Text></Text>
      </View>
    </View>
  );
};

export default LoginScreen;
