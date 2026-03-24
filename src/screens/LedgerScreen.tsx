import React from 'react';
import { View, Text } from 'react-native';

const LedgerScreen = () => {
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-white text-2xl font-bold">Cartera</Text>
      <Text className="text-slate-400 mt-2">Estado de cuenta de clientes</Text>
    </View>
  );
};

export default LedgerScreen;
