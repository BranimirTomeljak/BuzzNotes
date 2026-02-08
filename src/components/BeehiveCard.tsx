import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Beehive } from '../models/types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { useTranslation } from 'react-i18next';

interface BeehiveCardProps {
  beehive: Beehive;
  recordingCount: number;
  onPress: () => void;
  onRecord?: () => void;
}

export default function BeehiveCard({ beehive, recordingCount, onPress, onRecord }: BeehiveCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="archive-outline" size={24} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {beehive.name}
        </Text>
        <Text style={styles.count}>
          {t('beehives.recordingCount', { count: recordingCount })}
        </Text>
      </View>
      {onRecord && (
        <TouchableOpacity
          style={styles.recordButton}
          onPress={onRecord}
          activeOpacity={0.7}
        >
          <Ionicons name="mic" size={20} color={colors.white} />
        </TouchableOpacity>
      )}
      <Ionicons name="chevron-forward" size={22} color={colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  count: {
    ...typography.bodySmall,
  },
  recordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.fab,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
});
