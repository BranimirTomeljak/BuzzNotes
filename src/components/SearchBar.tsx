import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Ionicons name="search-outline" size={20} color={colors.textLight} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={t('common.search')}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 18,
    color: colors.text,
  },
});
