import React from 'react';
import { View, Text } from 'react-native';

const DashboardScreen = () => {
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-white text-2xl font-bold">Terrenos</Text>
      <Text className="text-slate-400 mt-2">Visualización de lotes y estados</Text>
    </View>
  );
};

export default DashboardScreen;
