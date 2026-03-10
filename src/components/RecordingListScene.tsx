import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FlatList, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import RecordingCard from './RecordingCard';
import EmptyState from './EmptyState';
import { Recording, Priority } from '../models/types';
import { spacing } from '../theme';
import { useResponsive } from '../hooks/useResponsive';

function FadeInView({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(1);
    }
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

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
  const { columns } = useResponsive();

  const cardStyle = useMemo(
    () => (columns > 1 ? ({ flex: 1, marginHorizontal: 0 } as const) : undefined),
    [columns],
  );

  const sorted = useMemo(() => sortFn(recordings), [recordings, sortFn]);

  const firstSolvedId = useMemo(() => sorted.find((r) => r.solved)?.id ?? null, [sorted]);

  const renderItem = useCallback(
    ({ item }: { item: Recording }) => (
      <FadeInView>
        <RecordingCard
          recording={item}
          beehiveName={getBeehiveName?.(item.beehiveId)}
          locationName={getLocationName?.(item.locationId)}
          showSolvedDivider={columns === 1 && item.id === firstSolvedId}
          onUpdatePriority={(priority: Priority) => updateRecording(item.id, { priority })}
          onToggleSolved={() => updateRecording(item.id, { solved: !item.solved })}
          onDelete={() => deleteRecording(item.id)}
          onPlay={() => updateRecording(item.id, { lastListenedAt: Date.now() })}
          onPress={onPressRecording ? () => onPressRecording(item.id) : undefined}
          style={cardStyle}
        />
      </FadeInView>
    ),
    [
      getBeehiveName,
      getLocationName,
      firstSolvedId,
      columns,
      cardStyle,
      updateRecording,
      deleteRecording,
      onPressRecording,
    ],
  );

  return (
    <FlatList
      key={columns}
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
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
  columnWrapper: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
