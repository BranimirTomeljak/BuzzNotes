import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Priority } from '../models/types';
import { colors, borderRadius, spacing } from '../theme';
import { useTranslation } from 'react-i18next';

interface PriorityBadgeProps {
  priority: Priority;
  onPress?: () => void;
  size?: 'small' | 'normal';
}

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  [Priority.HIGH]: { bg: colors.priorityHighBg, text: colors.priorityHigh },
  [Priority.MEDIUM]: { bg: colors.priorityMediumBg, text: colors.priorityMedium },
  [Priority.LOW]: { bg: colors.priorityLowBg, text: colors.priorityLow },
};

const PRIORITY_ICONS: Record<Priority, keyof typeof Ionicons.glyphMap> = {
  [Priority.HIGH]: 'alert-circle',
  [Priority.MEDIUM]: 'warning-outline',
  [Priority.LOW]: 'information-circle-outline',
};

export default function PriorityBadge({ priority, onPress, size = 'normal' }: PriorityBadgeProps) {
  const { t } = useTranslation();
  const colorScheme = PRIORITY_COLORS[priority];
  const iconName = PRIORITY_ICONS[priority];
  const isSmall = size === 'small';

  const label =
    priority === Priority.HIGH
      ? t('priority.high')
      : priority === Priority.MEDIUM
      ? t('priority.medium')
      : t('priority.low');

  const badge = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colorScheme.bg,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
          paddingVertical: isSmall ? 2 : spacing.xs,
        },
      ]}
    >
      <Ionicons
        name={iconName}
        size={isSmall ? 12 : 14}
        color={colorScheme.text}
      />
      <Text
        style={[
          styles.text,
          {
            color: colorScheme.text,
            fontSize: isSmall ? 12 : 14,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {badge}
      </TouchableOpacity>
    );
  }

  return badge;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    gap: 4,
  },
  text: {
    fontWeight: '600',
  },
});
