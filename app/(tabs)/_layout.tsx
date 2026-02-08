import React from 'react';
import { Slot, Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Slot />
    </>
  );
}
