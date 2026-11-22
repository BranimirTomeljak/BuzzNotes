import React, { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { ErrorToast, ToastConfig } from 'react-native-toast-message';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadSavedLanguage } from '../src/i18n';
import { DataProvider } from '../src/contexts/DataContext';
import OnboardingScreen from '../src/screens/OnboardingScreen';
import { colors } from '../src/theme';

const ONBOARDING_KEY = '@buzznotes/onboardingDone';

// The default error toast shows one line; 0 removes the limit so long messages wrap in full.
const toastConfig: ToastConfig = {
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#FE6301', height: 'auto', minHeight: 60 }}
      text1NumberOfLines={0}
    />
  ),
};

function RootLayout() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    Promise.all([loadSavedLanguage(), AsyncStorage.getItem(ONBOARDING_KEY)]).then(
      ([_, onboardingDone]) => {
        setShowOnboarding(onboardingDone !== 'true');
        setReady(true);
      },
    );
  }, []);

  const handleOnboardingDone = useCallback(() => {
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          {showOnboarding ? (
            <OnboardingScreen onDone={handleOnboardingDone} />
          ) : (
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
                <Stack.Screen name="recording/[id]" options={{ title: '' }} />
              </Stack>
            </DataProvider>
          )}
          <Toast config={toastConfig} visibilityTime={1500} />
        </I18nextProvider>
      </SafeAreaProvider>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

export default RootLayout;
