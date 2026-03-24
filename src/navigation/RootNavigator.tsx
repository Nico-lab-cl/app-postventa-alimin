import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { LayoutDashboard, Wallet, Bell, CheckCircle } from 'lucide-react-native';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LedgerScreen from '../screens/LedgerScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#0F172A', borderTopColor: '#1E293B' },
        tabBarActiveTintColor: '#10b981', // emerald-500
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          title: 'Dashboard'
        }}
      />
      <Tab.Screen 
        name="Ledger" 
        component={LedgerScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          title: 'Cartera'
        }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          title: 'Mora'
        }}
      />
      <Tab.Screen 
        name="Receipts" 
        component={ReceiptsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <CheckCircle color={color} size={size} />,
          title: 'Recibos'
        }}
      />
    </Tab.Navigator>
  );
};

import { useAuth } from '../store/AuthContext';

const RootNavigator = () => {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    // You could return a Splash screen here
    return null; 
  }

  return (
    <NavigationContainer theme={{
      dark: true,
      colors: {
        primary: '#A8CDD4',
        background: '#131313',
        card: '#1C1B1B',
        text: '#E5E2E1',
        border: '#414849',
        notification: '#EDC062',
      },
      fonts: {
        regular: { fontFamily: 'Inter', fontWeight: '400' },
        medium: { fontFamily: 'Inter', fontWeight: '500' },
        bold: { fontFamily: 'Outfit', fontWeight: '700' },
        heavy: { fontFamily: 'Outfit', fontWeight: '800' },
      }
    }}>
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
