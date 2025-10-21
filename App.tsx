
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all your screens
import Dashboard from './src/screens/Dashboard';
import MyAccount from './src/screens/MyAccount';
import AppDetailScreen from './src/screens/AppDetailScreen';
import AppListScreen from './src/screens/AppListScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DataUsageScreen from './src/screens/DataUsageScreen';
import PermissionManagerScreen from './src/screens/PermissionManagerScreen';
import SecurityAlertsScreen from './src/screens/SecurityAlertsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false, // Since your screens have custom headers
        }}
      >
        {/* Main Dashboard */}
        <Stack.Screen name="Dashboard" component={Dashboard} />
        
        {/* App Detail Screen - matches the navigation call in RecentApps */}
        <Stack.Screen name="AppDetailScreen" component={AppDetailScreen} />
        
        {/* App List Screen */}
        <Stack.Screen name="AppListScreen" component={AppListScreen} />
        
        {/* Settings Screen */}
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="DataUsageScreen" component={DataUsageScreen} />
        
        {/* Permission Manager Screen */}
        <Stack.Screen name="PermissionManagerScreen" component={PermissionManagerScreen} />
        
        {/* Security Alerts Screen */}
        <Stack.Screen name="SecurityAlertsScreen" component={SecurityAlertsScreen} />
        
        {/* My Account Screen */}
        <Stack.Screen name="MyAccount" component={MyAccount} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}