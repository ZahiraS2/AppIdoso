import React from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import { AppProvider, useApp } from './src/store/AppContext';
import { useTheme } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewElderScreen from './src/screens/NewElderScreen';
import ElderScreen from './src/screens/ElderScreen';

const Stack = createNativeStackNavigator();

function Routes() {
  const { user } = useApp();
  const t = useTheme();
  const base = useColorScheme() === 'light' ? DefaultTheme : DarkTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: t.bg, card: t.bg, text: t.text, border: t.border, primary: t.primary } };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NewElder" component={NewElderScreen} />
            <Stack.Screen name="Elder" component={ElderScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [loaded] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  const scheme = useColorScheme();

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#031026' }}>
        <ActivityIndicator color="#5ca4ff" />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        <Routes />
      </AppProvider>
    </SafeAreaProvider>
  );
}