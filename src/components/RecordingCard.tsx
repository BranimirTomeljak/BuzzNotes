import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Recording, Priority } from '../models/types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { formatDateTime, formatDuration } from '../utils/formatting';
import PriorityBadge from './PriorityBadge';
import AudioPlayer from './AudioPlayer';
import { useTranslation } from 'react-i18next';
import { confirmDelete } from '../utils/confirmDelete';

interface RecordingCardProps {
  recording: Recording;
  beehiveName?: string;
  locationName?: string;
  onUpdatePriority: (priority: Priority) => void;
  onToggleSolved: () => void;
  onDelete: () => void;
  onPlay: () => void;
  onPress?: () => void;
  showSolvedDivider?: boolean;
}

const PRIORITY_CYCLE: Priority[] = [Priority.HIGH, Priority.MEDIUM, Priority.LOW];

export default function RecordingCard({
  recording,
  beehiveName,
  locationName,
  onUpdatePriority,
  onToggleSolved,
  onDelete,
  onPlay,
  onPress,
  showSolvedDivider,
}: RecordingCardProps) {
  const { t } = useTranslation();

  const cyclePriority = useCallback(() => {
    const idx = PRIORITY_CYCLE.indexOf(recording.priority);
    const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
    onUpdatePriority(next);
  }, [recording.priority, onUpdatePriority]);

  const handleDelete = useCallback(() => {
    confirmDelete(
      t('recordings.delete'),
      t('recordings.deleteConfirm'),
      onDelete,
      t('common.cancel'),
      t('common.delete'),
    );
  }, [onDelete, t]);

  const audioUri = recording.localPath || recording.audioUrl;

  // Solved: compact single-row card
  if (recording.solved) {
    return (
      <>
        {showSolvedDivider && (
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('recordings.solved')}</Text>
            <View style={styles.dividerLine} />
          </View>
        )}
        <View style={styles.cardSolved}>
          <View style={styles.solvedHeader}>
            <View style={styles.solvedRow}>
              <Text style={styles.solvedDate}>{formatDateTime(recording.createdAt)}</Text>
              {beehiveName && (
                <>
                  <MaterialCommunityIcons name="archive-outline" size={12} color={colors.textLight} />
                  <Text style={styles.solvedMeta} numberOfLines={1}>{beehiveName}</Text>
                </>
              )}
              <Text style={styles.solvedDuration}>{formatDuration(recording.duration)}</Text>
              <PriorityBadge
                priority={recording.priority}
                onPress={cyclePriority}
                size="small"
              />
            </View>
            <View style={styles.solvedActions}>
              <TouchableOpacity onPress={onToggleSolved} style={styles.checkboxButton} activeOpacity={0.6}>
                <Ionicons name="checkmark-circle" size={28} color={colors.solved} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.solvedDeleteBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
          {audioUri && (
            <AudioPlayer uri={audioUri} duration={recording.duration} onPlay={onPlay} muted />
          )}
        </View>
      </>
    );
  }

  // Unsolved: full card
  const priorityTint =
    recording.priority === Priority.HIGH
      ? colors.priorityHighTint
      : recording.priority === Priority.MEDIUM
      ? colors.priorityMediumTint
      : colors.priorityLowTint;

  const hasNotes = !!recording.notes?.trim();
  const hasPhotos = !!recording.photos?.length;

  const cardContent = (
    <View style={[styles.card, { backgroundColor: priorityTint }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{formatDateTime(recording.createdAt)}</Text>
          {beehiveName && (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="archive-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.meta}>
                {beehiveName}
                {locationName ? '  ' : ''}
              </Text>
              {locationName && (
                <>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.meta}>{locationName}</Text>
                </>
              )}
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <PriorityBadge
            priority={recording.priority}
            onPress={cyclePriority}
          />
          <TouchableOpacity onPress={onToggleSolved} style={styles.checkboxButton} activeOpacity={0.6}>
            <Ionicons name="checkmark-circle-outline" size={28} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {audioUri ? (
        <AudioPlayer uri={audioUri} duration={recording.duration} onPlay={onPlay} />
      ) : (
        <Text style={styles.noAudio}>{formatDuration(recording.duration)}</Text>
      )}

      {/* Notes preview */}
      {hasNotes && (
        <View style={styles.notesPreview}>
          <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.notesPreviewText} numberOfLines={2}>
            {recording.notes}
          </Text>
        </View>
      )}

      {/* Photo thumbnails */}
      {hasPhotos && (
        <View style={styles.photoRow}>
          {recording.photos!.slice(0, 4).map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photoThumb} />
          ))}
          {recording.photos!.length > 4 && (
            <View style={styles.photoMore}>
              <Text style={styles.photoMoreText}>+{recording.photos!.length - 4}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          {recording.lastListenedAt && (
            <Text style={styles.lastListened}>
              {t('recordings.lastListened')}: {formatDateTime(recording.lastListenedAt)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  // --- Unsolved (full) card ---
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  date: {
    ...typography.body,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  meta: {
    ...typography.bodySmall,
  },
  noAudio: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerInfo: {
    flex: 1,
  },
  lastListened: {
    ...typography.caption,
    marginTop: 2,
  },
  checkboxButton: {
    padding: 2,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  notesPreviewText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  photoRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  photoThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  photoMore: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoMoreText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // --- Solved divider ---
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 12,
  },

  // --- Solved (compact) card ---
  cardSolved: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: 3,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  solvedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  solvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  solvedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  solvedDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  solvedMeta: {
    fontSize: 12,
    color: colors.textLight,
    flexShrink: 1,
  },
  solvedDuration: {
    fontSize: 12,
    color: colors.textLight,
  },
  solvedDeleteBtn: {
    padding: 4,
  },
});
