import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../theme';
import { useData } from '../contexts/DataContext';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../hooks/useResponsive';

export default function FloatingActions() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locations } = useData();
  const { isTablet, contentMaxWidth } = useResponsive();
  const { width: screenWidth } = useWindowDimensions();

  const fabRight =
    isTablet && contentMaxWidth
      ? (screenWidth - contentMaxWidth) / 2 + spacing.lg
      : spacing.lg;

  const openRecord = () => {
    if (locations.length === 0) {
      if (Platform.OS === 'web') {
        window.alert(t('locations.emptyDesc'));
      } else {
        Alert.alert(t('locations.empty'), t('locations.emptyDesc'));
      }
      return;
    }
    router.push('/record');
  };

  return (
    <View style={[styles.container, { right: fabRight }]}>
      <TouchableOpacity style={styles.fab} onPress={openRecord} activeOpacity={0.7}>
        <Ionicons name="mic" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.fab,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.fab,
  },
});
