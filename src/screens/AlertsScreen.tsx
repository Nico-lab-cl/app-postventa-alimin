import React from 'react';
import { View, Text } from 'react-native';

const AlertsScreen = () => {
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-white text-2xl font-bold">Alertas & Mora</Text>
      <Text className="text-slate-400 mt-2">Gestión de vencimientos y mora</Text>
    </View>
  );
};

export default AlertsScreen;
