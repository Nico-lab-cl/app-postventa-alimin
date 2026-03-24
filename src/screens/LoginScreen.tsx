import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

const LoginScreen = () => {
  return (
    <View className="flex-1 bg-background justify-center px-8">
      <Text className="text-emerald-500 text-3xl font-bold mb-8 text-center">Lomas del Mar</Text>
      <View className="space-y-4">
        <TextInput 
          placeholder="Email" 
          placeholderTextColor="#94a3b8"
          className="bg-slate-800 text-white p-4 rounded-xl border border-emerald-500/10"
        />
        <TextInput 
          placeholder="Password" 
          placeholderTextColor="#94a3b8"
          secureTextEntry
          className="bg-slate-800 text-white p-4 rounded-xl border border-emerald-500/10"
        />
        <TouchableOpacity className="bg-emerald-500 p-4 rounded-xl mt-4">
          <Text className="text-white text-center font-bold">Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;
