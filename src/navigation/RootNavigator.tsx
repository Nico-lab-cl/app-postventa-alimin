import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { LayoutDashboard, Wallet, Bell, CheckCircle, ShieldCheck, Users } from 'lucide-react-native';
import { View, Platform } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LedgerScreen from '../screens/LedgerScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import LedgerDetailScreen from '../screens/LedgerDetailScreen';
import AccountManagementScreen from '../screens/AccountManagementScreen';
import AssignOwnerScreen from '../screens/AssignOwnerScreen';
import PaymentTransferScreen from '../screens/PaymentTransferScreen';
import SelectClientForPaymentScreen from '../screens/SelectClientForPaymentScreen';
import PaymentDashboardScreen from '../screens/PaymentDashboardScreen';
import ClientFinancialAnalysisScreen from '../screens/ClientFinancialAnalysisScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CoastalTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#a8cdd4',
    background: '#131313',
    card: '#1c1c1c',
    text: '#e5e2e1',
    border: 'rgba(54, 89, 95, 0.2)',
    notification: '#edc062',
  },
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: 'rgba(28, 28, 28, 0.6)', 
          borderTopColor: 'rgba(54, 89, 95, 0.2)',
          height: Platform.OS === 'ios' ? 94 : 84,
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          paddingTop: 12,
          elevation: 10,
          position: 'absolute',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#edc062',
        tabBarInactiveTintColor: 'rgba(193, 200, 201, 0.7)',
        tabBarLabelStyle: {
          fontFamily: undefined,
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 6
        }
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`px-4 py-1.5 rounded-2xl ${focused ? "bg-[#36595f]/30" : ""}`}>
                <LayoutDashboard color={color} size={22} fill={focused ? color : 'transparent'} />
            </View>
          ),
          tabBarLabel: 'Home'
        }}
      />
      <Tab.Screen 
        name="Ledger" 
        component={LedgerScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`px-4 py-1.5 rounded-2xl ${focused ? "bg-[#36595f]/30" : ""}`}>
                <Wallet color={color} size={22} />
            </View>
          ),
          tabBarLabel: 'Terrenos'
        }}
      />
      <Tab.Screen 
        name="Receipts" 
        component={ReceiptsScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`px-4 py-1.5 rounded-2xl ${focused ? "bg-[#36595f]/30" : ""}`}>
                <CheckCircle color={color} size={22} />
            </View>
          ),
          tabBarLabel: 'Recibos'
        }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`px-4 py-1.5 rounded-2xl ${focused ? "bg-[#36595f]/30" : ""}`}>
                <Bell color={color} size={22} />
            </View>
          ),
          tabBarLabel: 'Alertas'
        }}
      />
      <Tab.Screen 
        name="Accounts" 
        component={AccountManagementScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`px-4 py-1.5 rounded-2xl ${focused ? "bg-[#36595f]/30" : ""}`}>
                <Users color={color} size={22} />
            </View>
          ),
          tabBarLabel: 'Cuentas'
        }}
      />
    </Tab.Navigator>
  );
};

import { useAuth } from '../store/AuthContext';

import ProjectSelectorScreen from '../screens/ProjectSelectorScreen';

const RootNavigator = () => {
  const { userToken, isLoading, activeProject } = useAuth();

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
        ) : !activeProject ? (
          <Stack.Screen name="ProjectSelector" component={ProjectSelectorScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="LedgerDetail" component={LedgerDetailScreen} />
            <Stack.Screen name="AssignOwner" component={AssignOwnerScreen} />
            <Stack.Screen name="ClientFinancialAnalysis" component={ClientFinancialAnalysisScreen} />
            <Stack.Screen name="SelectClientForPayment" component={SelectClientForPaymentScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="PaymentDashboard" component={PaymentDashboardScreen} />
            <Stack.Screen name="PaymentTransfer" component={PaymentTransferScreen} options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
