import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Priority } from '../models/types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useTranslation } from 'react-i18next';

interface PriorityPickerProps {
  selected: Priority | null;
  onSelect: (priority: Priority) => void;
}

const OPTIONS: { priority: Priority; iconName: keyof typeof Ionicons.glyphMap; colorBg: string; colorText: string }[] = [
  {
    priority: Priority.HIGH,
    iconName: 'alert-circle',
    colorBg: colors.priorityHighBg,
    colorText: colors.priorityHigh,
  },
  {
    priority: Priority.MEDIUM,
    iconName: 'warning-outline',
    colorBg: colors.priorityMediumBg,
    colorText: colors.priorityMedium,
  },
  {
    priority: Priority.LOW,
    iconName: 'information-circle-outline',
    colorBg: colors.priorityLowBg,
    colorText: colors.priorityLow,
  },
];

export default function PriorityPicker({ selected, onSelect }: PriorityPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('recordings.setPriority')}</Text>
      {OPTIONS.map((opt) => {
        const isSelected = selected === opt.priority;
        return (
          <TouchableOpacity
            key={opt.priority}
            style={[
              styles.option,
              {
                backgroundColor: opt.colorBg,
                borderWidth: isSelected ? 3 : 1,
                borderColor: isSelected ? opt.colorText : colors.border,
              },
            ]}
            onPress={() => onSelect(opt.priority)}
            activeOpacity={0.7}
          >
            <Ionicons name={opt.iconName} size={24} color={opt.colorText} />
            <Text style={[styles.label, { color: opt.colorText }]}>
              {opt.priority === Priority.HIGH
                ? t('priority.high')
                : opt.priority === Priority.MEDIUM
                ? t('priority.medium')
                : t('priority.low')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
  },
});
