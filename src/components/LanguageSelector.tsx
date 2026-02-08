import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';
import { colors, spacing, borderRadius, typography } from '../theme';

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language;

  return (
    <View style={styles.container}>
      <Ionicons name="globe-outline" size={20} color={colors.textSecondary} />
      <Text style={styles.label}>{t('common.language')}:</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, currentLang === 'hr' && styles.buttonActive]}
          onPress={() => setLanguage('hr')}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, currentLang === 'hr' && styles.buttonTextActive]}>
            HR
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, currentLang === 'en' && styles.buttonActive]}
          onPress={() => setLanguage('en')}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, currentLang === 'en' && styles.buttonTextActive]}>
            EN
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  buttonTextActive: {
    color: colors.white,
  },
});
