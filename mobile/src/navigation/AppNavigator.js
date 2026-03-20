import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import RequestCreateScreen from '../screens/RequestCreateScreen';
import AvailableRequestsScreen from '../screens/AvailableRequestsScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import UserRequestsScreen from '../screens/UserRequestsScreen';
import ReportCreateScreen from '../screens/ReportCreateScreen';
import ReportViewScreen from '../screens/ReportViewScreen';
import ReviewCreateScreen from '../screens/ReviewCreateScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SupportScreen from '../screens/SupportScreen';
import SupportDetailScreen from '../screens/SupportDetailScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import QRScanScreen from '../screens/QRScanScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  const Theme = {
    dark: true,
    colors: {
      primary: '#38bdf8',
      background: '#0f172a',
      card: '#1e293b',
      text: '#ffffff',
      border: '#334155',
      notification: '#38bdf8',
    },
  };

  return (
    <NavigationContainer theme={Theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="RequestCreate" component={RequestCreateScreen} />
            <Stack.Screen name="AvailableRequests" component={AvailableRequestsScreen} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="UserRequests" component={UserRequestsScreen} />
            <Stack.Screen name="ReportCreate" component={ReportCreateScreen} />
            <Stack.Screen name="ReportView" component={ReportViewScreen} />
            <Stack.Screen name="ReviewCreate" component={ReviewCreateScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="SupportDetail" component={SupportDetailScreen} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="QRScan" component={QRScanScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
