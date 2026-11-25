import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography } from '../theme';

interface OnboardingScreenProps {
  onDone: () => void;
}

const FEATURES = [
  { icon: 'location-outline' as const, iconSet: 'ionicons' as const, key: 'feature1' },
  { icon: 'archive-outline' as const, iconSet: 'material' as const, key: 'feature2' },
  { icon: 'mic-outline' as const, iconSet: 'ionicons' as const, key: 'feature3' },
] as const;

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="bee" size={64} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t('onboarding.welcome')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.key} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                {feature.iconSet === 'material' ? (
                  <MaterialCommunityIcons name={feature.icon} size={24} color={colors.primary} />
                ) : (
                  <Ionicons name={feature.icon} size={24} color={colors.primary} />
                )}
              </View>
              <Text style={styles.featureText}>{t(`onboarding.${feature.key}`)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Get Started button */}
      <TouchableOpacity style={styles.button} onPress={onDone} activeOpacity={0.7}>
        <Text style={styles.buttonText}>{t('onboarding.getStarted')}</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing.xxl * 2,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  features: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
});
