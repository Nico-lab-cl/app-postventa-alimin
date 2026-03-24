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
      const response = await apiClient.post('/mobile/auth/login', {
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
      <View className="items-center mb-12">
        <View className="w-20 h-20 bg-[#a8cdd4] rounded-full justify-center items-center mb-4">
          <Text className="text-[#131313] text-4xl font-bold">L</Text>
        </View>
        <Text className="text-[#E5E2E1] text-4xl font-bold font-[Outfit]">Lomas del Mar</Text>
        <Text className="text-[#A8CDD4] text-lg font-[Inter]">Portal de Postventa</Text>
      </View>

      <View className="space-y-4">
        <View>
          <TextInput 
            placeholder="Email" 
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-[#1C1B1B] text-[#E5E2E1] p-4 rounded-xl border border-[#414849]/20"
          />
        </View>
        <View className="mt-4">
          <TextInput 
            placeholder="Password" 
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-[#1C1B1B] text-[#E5E2E1] p-4 rounded-xl border border-[#414849]/20"
          />
        </View>
        
        <TouchableOpacity 
          onPress={handleLogin}
          disabled={loading}
          className="bg-[#a8cdd4] p-4 rounded-xl mt-8 flex-row justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="#131313" />
          ) : (
            <Text className="text-[#131313] text-center font-bold text-lg">Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity className="mt-4">
          <Text className="text-[#EDC062] text-center">¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;
