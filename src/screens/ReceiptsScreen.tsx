import React from 'react';
import { View, Text } from 'react-native';

const ReceiptsScreen = () => {
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-white text-2xl font-bold">Verificación</Text>
      <Text className="text-slate-400 mt-2">Aprobación de comprobantes</Text>
    </View>
  );
};

export default ReceiptsScreen;
