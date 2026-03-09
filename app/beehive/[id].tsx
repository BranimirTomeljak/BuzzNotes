import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TabView, SceneRendererProps } from 'react-native-tab-view';
import { useData } from '../../src/contexts/DataContext';
import RecordingListScene from '../../src/components/RecordingListScene';
import EditableNameRow from '../../src/components/EditableNameRow';
import { confirmDelete } from '../../src/utils/confirmDelete';
import { useDetailTabBar } from '../../src/hooks/useDetailTabBar';
import { colors, spacing, borderRadius, typography } from '../../src/theme';
import { sortByRecent, sortByPriority } from '../../src/utils/sorting';

type Route = { key: string; title: string };

function RecentScene({ beehiveId }: { beehiveId: string }) {
  const router = useRouter();
  const { getRecordingsForBeehive } = useData();
  const recordings = getRecordingsForBeehive(beehiveId);
  const handlePress = useCallback((id: string) => router.push(`/recording/${id}`), [router]);

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByRecent}
      emptyIcon={<Ionicons name="mic-outline" size={40} color={colors.textLight} />}
      onPressRecording={handlePress}
    />
  );
}

function PriorityScene({ beehiveId }: { beehiveId: string }) {
  const router = useRouter();
  const { getRecordingsForBeehive } = useData();
  const recordings = getRecordingsForBeehive(beehiveId);
  const handlePress = useCallback((id: string) => router.push(`/recording/${id}`), [router]);

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByPriority}
      emptyIcon={<Ionicons name="mic-outline" size={40} color={colors.textLight} />}
      onPressRecording={handlePress}
    />
  );
}

export default function BeehiveDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const layout = useWindowDimensions();
  const { getBeehiveById, getLocationById, updateBeehive, deleteBeehive, locations } = useData();

  const beehive = getBeehiveById(id);
  const location = beehive ? getLocationById(beehive.locationId) : undefined;

  const [tabIndex, setTabIndex] = useState(0);
  const [changingLocation, setChangingLocation] = useState(false);

  const routes: Route[] = useMemo(
    () => [
      { key: 'recent', title: t('nav.recent') },
      { key: 'priority', title: t('nav.priority') },
    ],
    [t],
  );

  const renderScene = useCallback(
    ({ route }: SceneRendererProps & { route: Route }) => {
      switch (route.key) {
        case 'recent':
          return <RecentScene beehiveId={id} />;
        case 'priority':
          return <PriorityScene beehiveId={id} />;
        default:
          return null;
      }
    },
    [id],
  );

  const { renderTabBar } = useDetailTabBar(routes);

  const handleChangeLocation = useCallback(
    (locationId: string) => {
      if (beehive) {
        updateBeehive(beehive.id, { locationId });
      }
      setChangingLocation(false);
    },
    [beehive, updateBeehive],
  );

  const handleDelete = useCallback(() => {
    confirmDelete(
      t('beehives.delete'),
      t('beehives.deleteConfirm'),
      () => {
        deleteBeehive(id);
        router.back();
      },
      t('common.cancel'),
      t('common.delete'),
    );
  }, [id, deleteBeehive, router, t]);

  if (!beehive) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>{t('common.error')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: beehive.name,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.settingsButton}
            >
              <Ionicons name="settings-outline" size={22} color={colors.white} />
            </TouchableOpacity>
          ),
        }}
      />

      <EditableNameRow
        name={beehive.name}
        icon="archive-outline"
        onSave={(newName) => updateBeehive(beehive.id, { name: newName })}
        onDelete={handleDelete}
      />

      {/* Location */}
      <View style={styles.locationRow}>
        <Text style={styles.locationLabel}>{t('beehives.location')}: </Text>
        {changingLocation ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.locationScroll}
          >
            {locations.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={[
                  styles.locationChip,
                  loc.id === beehive.locationId && styles.locationChipActive,
                ]}
                onPress={() => handleChangeLocation(loc.id)}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    loc.id === beehive.locationId && styles.locationChipTextActive,
                  ]}
                >
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity
            onPress={() => setChangingLocation(true)}
            style={styles.locationValueRow}
          >
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.locationValue}>{location?.name || '?'}</Text>
            <Ionicons name="create-outline" size={14} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Record button */}
      <TouchableOpacity
        style={styles.recordButton}
        onPress={() =>
          router.push({
            pathname: '/record',
            params: { beehiveId: beehive.id, locationId: beehive.locationId },
          })
        }
        activeOpacity={0.7}
      >
        <Ionicons name="mic" size={20} color={colors.white} style={styles.recordIcon} />
        <Text style={styles.recordButtonText}>{t('recordings.add')}</Text>
      </TouchableOpacity>

      {/* Swipeable Tabs */}
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        renderTabBar={renderTabBar}
        initialLayout={{ width: layout.width }}
        lazy
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    ...typography.h2,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  locationLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  locationValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationValue: {
    ...typography.body,
    color: colors.primary,
  },
  locationScroll: {
    flex: 1,
  },
  locationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  locationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locationChipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  locationChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  recordButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    backgroundColor: colors.fab,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  recordIcon: {
    marginRight: spacing.sm,
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  settingsButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
});
