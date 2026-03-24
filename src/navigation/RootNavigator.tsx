import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { LayoutDashboard, Wallet, Bell, CheckCircle, ShieldCheck } from 'lucide-react-native';
import { View, Platform } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LedgerScreen from '../screens/LedgerScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CoastalTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#73D9B5',
    background: '#0A0E1A',
    card: '#131313',
    text: '#E5E2E1',
    border: '#1B1B1B',
    notification: '#98FFD9',
  },
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#131313', 
          borderTopColor: 'rgba(115, 217, 181, 0.1)',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 12,
          elevation: 0,
          shadowOpacity: 0
        },
        tabBarActiveTintColor: '#73D9B5',
        tabBarInactiveTintColor: '#454957',
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4
        }
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={20} />,
          title: 'Resumen'
        }}
      />
      <Tab.Screen 
        name="Ledger" 
        component={LedgerScreen} 
        options={{
          tabBarIcon: ({ color }) => <Wallet color={color} size={20} />,
          title: 'Cartera'
        }}
      />
      <Tab.Screen 
        name="Receipts" 
        component={ReceiptsScreen} 
        options={{
          tabBarIcon: ({ color }) => <ShieldCheck color={color} size={20} />,
          title: 'Verificar'
        }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen} 
        options={{
          tabBarIcon: ({ color }) => <Bell color={color} size={20} />,
          title: 'Mora'
        }}
      />
    </Tab.Navigator>
  );
};

import { useAuth } from '../store/AuthContext';

const RootNavigator = () => {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    return (
        <View style={{ flex: 1, backgroundColor: '#0A0E1A' }} />
    ); 
  }

  return (
    <NavigationContainer theme={CoastalTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
