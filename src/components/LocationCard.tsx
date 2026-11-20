import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Location } from '../models/types';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../hooks/useResponsive';

const ACCENT_COLORS = ['#B8860B', '#5C9CE6', '#EF5350', '#4CAF50', '#9C6ADE'];

interface LocationCardProps {
  location: Location;
  beehiveCount: number;
  recordingCount: number;
  index: number;
  onPress: () => void;
  style?: ViewStyle;
}

const HEX_POSITIONS = [
  { top: 8, right: 12, size: 32 },
  { top: 6, right: 52, size: 28 },
  { top: 38, right: 30, size: 24 },
  { top: 44, right: 72, size: 30 },
  { top: 70, right: 8, size: 26 },
  { top: 76, right: 56, size: 22 },
  { top: 108, right: 34, size: 28 },
  { top: 100, right: 78, size: 24 },
  { top: 140, right: 14, size: 30 },
  { top: 148, right: 60, size: 26 },
  { top: 170, right: 40, size: 22 },
  { top: 180, right: 80, size: 28 },
] as const;

const hexPositionStyles = HEX_POSITIONS.map((h) => ({
  position: 'absolute' as const,
  top: h.top,
  right: h.right,
  opacity: 0.07,
}));

function HexPattern({ color }: { color: string }) {
  return (
    <View style={styles.hexOverlay} pointerEvents="none">
      {HEX_POSITIONS.map((h, i) => (
        <MaterialCommunityIcons
          key={i}
          name="hexagon-outline"
          size={h.size}
          color={color}
          style={hexPositionStyles[i]}
        />
      ))}
    </View>
  );
}

export default function LocationCard({
  location,
  beehiveCount,
  recordingCount,
  index,
  onPress,
  style,
}: LocationCardProps) {
  const { t } = useTranslation();
  const { isTablet, scale } = useResponsive();
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <TouchableOpacity
      style={[styles.card, isTablet && { minHeight: 160 }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <HexPattern color={accentColor} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="location" size={24} color={accentColor} />
            <Text style={[styles.name, { fontSize: 17 * scale }]} numberOfLines={1}>
              {location.name}
            </Text>
            <Ionicons name="chevron-forward" size={22} color={colors.textLight} />
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="archive-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.statValue, { fontSize: 20 * scale }]}>{beehiveCount}</Text>
              <Text style={[styles.statLabel, { fontSize: 13 * scale }]}>
                {t('beehives.title')}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.statValue, { fontSize: 20 * scale }]}>{recordingCount}</Text>
              <Text style={[styles.statLabel, { fontSize: 13 * scale }]}>
                {t('recordings.title')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    minHeight: 200,
    overflow: 'hidden',
    ...shadows.card,
  },
  accent: {
    width: 6,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  hexOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
