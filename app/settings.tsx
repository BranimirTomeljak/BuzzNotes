import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useData } from '../src/contexts/DataContext';
import LanguageSelector from '../src/components/LanguageSelector';
import { colors, spacing, borderRadius, typography } from '../src/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { syncing, exportAllData, importAllData } = useData();
  // expo-file-system is a stub on web, so export and import would always fail there.
  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('nav.settings')}</Text>
        <View style={styles.closeButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <LanguageSelector />
        </View>

        <View style={styles.section}>
          {isWeb && <Text style={styles.webNote}>{t('common.webUnavailable')}</Text>}
          <TouchableOpacity
            onPress={exportAllData}
            disabled={syncing || isWeb}
            style={[styles.actionButton, isWeb && styles.disabledButton]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={colors.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.actionButtonText}>
              {syncing ? t('common.exporting') : t('common.export')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={importAllData}
            disabled={syncing || isWeb}
            style={[styles.importButton, isWeb && styles.disabledButton]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.buttonIcon}
            />
            <Text style={styles.importButtonText}>{t('common.import')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.white,
  },
  importButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  importButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  webNote: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
