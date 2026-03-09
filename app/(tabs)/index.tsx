import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TabView, TabBar, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/contexts/DataContext';
import LocationCard from '../../src/components/LocationCard';
import RecordingListScene from '../../src/components/RecordingListScene';
import EmptyState from '../../src/components/EmptyState';
import FloatingActions from '../../src/components/FloatingActions';
import { colors, spacing } from '../../src/theme';
import { sortByRecent, sortByPriority } from '../../src/utils/sorting';
import { Location } from '../../src/models/types';

type Route = { key: string; title: string; icon: React.ComponentProps<typeof Ionicons>['name'] };

function LocationsScene() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locations, beehives, recordings, syncing, refreshData } = useData();

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => a.createdAt - b.createdAt),
    [locations]
  );

  const getBeehiveCount = useCallback(
    (locationId: string) => beehives.filter((b) => b.locationId === locationId).length,
    [beehives]
  );

  const getRecordingCount = useCallback(
    (locationId: string) => recordings.filter((r) => r.locationId === locationId).length,
    [recordings]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Location; index: number }) => (
      <LocationCard
        location={item}
        beehiveCount={getBeehiveCount(item.id)}
        recordingCount={getRecordingCount(item.id)}
        index={index}
        onPress={() => router.push(`/location/${item.id}`)}
      />
    ),
    [getBeehiveCount, getRecordingCount, router]
  );

  return (
    <FlatList
      data={sortedLocations}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={sceneStyles.list}
      refreshControl={
        <RefreshControl
          refreshing={syncing}
          onRefresh={refreshData}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon={<Ionicons name="location-outline" size={40} color={colors.textLight} />}
          title={t('locations.empty')}
          description={t('locations.emptyDesc')}
        />
      }
    />
  );
}

function RecentScene() {
  const router = useRouter();
  const { recordings, getBeehiveById, getLocationById } = useData();

  const getBeehiveName = useCallback(
    (beehiveId: string) => getBeehiveById(beehiveId)?.name,
    [getBeehiveById]
  );
  const getLocationName = useCallback(
    (locationId: string) => getLocationById(locationId)?.name,
    [getLocationById]
  );
  const handlePress = useCallback(
    (id: string) => router.push(`/recording/${id}`),
    [router]
  );

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByRecent}
      emptyIcon={<Ionicons name="time-outline" size={40} color={colors.textLight} />}
      getBeehiveName={getBeehiveName}
      getLocationName={getLocationName}
      onPressRecording={handlePress}
    />
  );
}

function PriorityScene() {
  const router = useRouter();
  const { recordings, getBeehiveById, getLocationById } = useData();

  const getBeehiveName = useCallback(
    (beehiveId: string) => getBeehiveById(beehiveId)?.name,
    [getBeehiveById]
  );
  const getLocationName = useCallback(
    (locationId: string) => getLocationById(locationId)?.name,
    [getLocationById]
  );
  const handlePress = useCallback(
    (id: string) => router.push(`/recording/${id}`),
    [router]
  );

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByPriority}
      emptyIcon={<Ionicons name="flag-outline" size={40} color={colors.textLight} />}
      getBeehiveName={getBeehiveName}
      getLocationName={getLocationName}
      onPressRecording={handlePress}
    />
  );
}

const sceneStyles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
    paddingBottom: 100,
  },
});

const renderScene = ({ route }: SceneRendererProps & { route: Route }) => {
  switch (route.key) {
    case 'locations':
      return <LocationsScene />;
    case 'recent':
      return <RecentScene />;
    case 'priority':
      return <PriorityScene />;
    default:
      return null;
  }
};

export default function MainScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const routes: Route[] = useMemo(
    () => [
      { key: 'locations', title: t('nav.locations'), icon: 'location-outline' },
      { key: 'recent', title: t('nav.recent'), icon: 'time-outline' },
      { key: 'priority', title: t('nav.priority'), icon: 'flag-outline' },
    ],
    [t]
  );

  const tabOptions = useMemo(
    () =>
      Object.fromEntries(
        routes.map((route) => [
          route.key,
          {
            icon: ({ color }: { route: Route; focused: boolean; color: string; size: number }) => (
              <Ionicons name={route.icon} size={24} color={color} />
            ),
            labelStyle: styles.tabLabel,
          },
        ])
      ),
    [routes]
  );

  const renderTabBar = useCallback(
    (props: SceneRendererProps & { navigationState: NavigationState<Route> }) => (
      <TabBar
        {...props}
        style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 24) }]}
        indicatorStyle={styles.tabIndicator}
        activeColor={colors.tabActive}
        inactiveColor={colors.tabInactive}
        options={tabOptions}
      />
    ),
    [insets.bottom, tabOptions]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>BuzzNotes</Text>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={renderTabBar}
        tabBarPosition="bottom"
        initialLayout={{ width: layout.width }}
        lazy
      />

      <FloatingActions />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 20,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  tabBar: {
    backgroundColor: colors.tabBar,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  tabIndicator: {
    backgroundColor: colors.tabActive,
    height: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
});
