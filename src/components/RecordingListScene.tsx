import React, { useMemo, useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import RecordingCard from './RecordingCard';
import EmptyState from './EmptyState';
import { Recording, Priority } from '../models/types';
import { spacing } from '../theme';

interface RecordingListSceneProps {
  recordings: Recording[];
  sortFn: (recordings: Recording[]) => Recording[];
  emptyIcon: React.ReactNode;
  getBeehiveName?: (beehiveId: string) => string | undefined;
  getLocationName?: (locationId: string) => string | undefined;
  onPressRecording?: (id: string) => void;
}

export default function RecordingListScene({
  recordings,
  sortFn,
  emptyIcon,
  getBeehiveName,
  getLocationName,
  onPressRecording,
}: RecordingListSceneProps) {
  const { t } = useTranslation();
  const { updateRecording, deleteRecording } = useData();

  const sorted = useMemo(() => sortFn(recordings), [recordings, sortFn]);

  const firstSolvedId = useMemo(
    () => sorted.find((r) => r.solved)?.id ?? null,
    [sorted]
  );

  const renderItem = useCallback(
    ({ item }: { item: Recording }) => (
      <RecordingCard
        recording={item}
        beehiveName={getBeehiveName?.(item.beehiveId)}
        locationName={getLocationName?.(item.locationId)}
        showSolvedDivider={item.id === firstSolvedId}
        onUpdatePriority={(priority: Priority) => updateRecording(item.id, { priority })}
        onToggleSolved={() => updateRecording(item.id, { solved: !item.solved })}
        onDelete={() => deleteRecording(item.id)}
        onPlay={() => updateRecording(item.id, { lastListenedAt: Date.now() })}
        onPress={onPressRecording ? () => onPressRecording(item.id) : undefined}
      />
    ),
    [getBeehiveName, getLocationName, firstSolvedId, updateRecording, deleteRecording, onPressRecording]
  );

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <EmptyState
          icon={emptyIcon}
          title={t('recordings.empty')}
          description={t('recordings.emptyDesc')}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
    paddingBottom: 100,
  },
});
