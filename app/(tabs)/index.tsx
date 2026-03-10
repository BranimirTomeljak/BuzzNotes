import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TabView, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/contexts/DataContext';
import LocationCard from '../../src/components/LocationCard';
import RecordingListScene from '../../src/components/RecordingListScene';
import EmptyState from '../../src/components/EmptyState';
import FloatingActions from '../../src/components/FloatingActions';
import Toast from 'react-native-toast-message';
import { colors, spacing, borderRadius, typography } from '../../src/theme';
import { sortByRecent, sortByPriority } from '../../src/utils/sorting';
import { Location } from '../../src/models/types';
import { useResponsive } from '../../src/hooks/useResponsive';

type Route = { key: string; title: string; icon: React.ComponentProps<typeof Ionicons>['name'] };

function LocationsScene() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locations, beehives, recordings, syncing, refreshData, addLocation } = useData();
  const { columns, isTablet } = useResponsive();

  const cardStyle = useMemo(
    () => (columns > 1 ? ({ flex: 1, marginHorizontal: 0 } as const) : undefined),
    [columns],
  );

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => a.createdAt - b.createdAt),
    [locations],
  );

  const getBeehiveCount = useCallback(
    (locationId: string) => beehives.filter((b) => b.locationId === locationId).length,
    [beehives],
  );

  const getRecordingCount = useCallback(
    (locationId: string) => recordings.filter((r) => r.locationId === locationId).length,
    [recordings],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Location; index: number }) => (
      <LocationCard
        location={item}
        beehiveCount={getBeehiveCount(item.id)}
        recordingCount={getRecordingCount(item.id)}
        index={index}
        onPress={() => router.push(`/location/${item.id}`)}
        style={cardStyle}
      />
    ),
    [getBeehiveCount, getRecordingCount, router, cardStyle],
  );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  const handleAddLocation = useCallback(async () => {
    if (!newLocationName.trim()) return;
    await addLocation(newLocationName.trim());
    setNewLocationName('');
    setShowAddDialog(false);
    Toast.show({ type: 'success', text1: t('common.success'), visibilityTime: 1500 });
  }, [newLocationName, addLocation, t]);

  return (
    <>
      <FlatList
        key={columns}
        data={sortedLocations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? sceneStyles.columnWrapper : undefined}
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
        ListFooterComponent={
          <TouchableOpacity
            style={sceneStyles.dashedCard}
            onPress={() => setShowAddDialog(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={colors.primary} />
            <Text style={sceneStyles.dashedCardText}>{t('locations.add')}</Text>
          </TouchableOpacity>
        }
      />

      <Modal visible={showAddDialog} transparent animationType="fade">
        <Pressable
          style={sceneStyles.overlay}
          onPress={() => {
            setShowAddDialog(false);
            setNewLocationName('');
          }}
        >
          <Pressable style={[sceneStyles.dialog, isTablet && { maxWidth: 500 }]} onPress={() => {}}>
            <Text style={sceneStyles.dialogTitle}>{t('locations.add')}</Text>
            <TextInput
              style={sceneStyles.dialogInput}
              placeholder={t('locations.namePlaceholder')}
              placeholderTextColor={colors.textLight}
              value={newLocationName}
              onChangeText={setNewLocationName}
              autoFocus
              onSubmitEditing={handleAddLocation}
            />
            <View style={sceneStyles.dialogActions}>
              <TouchableOpacity
                style={sceneStyles.cancelButton}
                onPress={() => {
                  setShowAddDialog(false);
                  setNewLocationName('');
                }}
              >
                <Text style={sceneStyles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  sceneStyles.saveButton,
                  !newLocationName.trim() && sceneStyles.saveButtonDisabled,
                ]}
                onPress={handleAddLocation}
                disabled={!newLocationName.trim()}
              >
                <Text style={sceneStyles.saveText}>{t('common.create')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function RecentScene() {
  const router = useRouter();
  const { recordings, getBeehiveById, getLocationById } = useData();

  const getBeehiveName = useCallback(
    (beehiveId: string) => getBeehiveById(beehiveId)?.name,
    [getBeehiveById],
  );
  const getLocationName = useCallback(
    (locationId: string) => getLocationById(locationId)?.name,
    [getLocationById],
  );
  const handlePress = useCallback((id: string) => router.push(`/recording/${id}`), [router]);

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
    [getBeehiveById],
  );
  const getLocationName = useCallback(
    (locationId: string) => getLocationById(locationId)?.name,
    [getLocationById],
  );
  const handlePress = useCallback((id: string) => router.push(`/recording/${id}`), [router]);

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
  columnWrapper: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  dashedCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    minHeight: 80,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dashedCardText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  dialogInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  cancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  saveButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    ...typography.button,
    color: colors.white,
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
    [t],
  );

  const renderTabBar = useCallback(
    (props: SceneRendererProps & { navigationState: NavigationState<Route> }) => {
      const { navigationState, jumpTo } = props;
      return (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {navigationState.routes.map((route, i) => {
            const isActive = navigationState.index === i;
            const color = isActive ? colors.tabActive : colors.tabInactive;
            return (
              <TouchableOpacity
                key={route.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => jumpTo(route.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={route.icon} size={24} color={color} />
                <Text style={[styles.tabLabel, { color }]}>{route.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    },
    [insets.bottom],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>BuzzNotes</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.tabBar,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
    paddingTop: spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: colors.primaryTint,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
