import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadSavedLanguage } from '../src/i18n';
import { DataProvider } from '../src/contexts/DataContext';
import { colors } from '../src/theme';

function RootLayout() {
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <DataProvider>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: colors.white,
                headerTitleStyle: { fontWeight: '600', fontSize: 20 },
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="record"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="settings"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen name="location/[id]" options={{ title: '' }} />
              <Stack.Screen name="beehive/[id]" options={{ title: '' }} />
            </Stack>
          </DataProvider>
          <Toast visibilityTime={1500} />
        </I18nextProvider>
      </SafeAreaProvider>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

export default RootLayout;
