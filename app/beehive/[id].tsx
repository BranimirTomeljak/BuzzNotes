import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TabView, TabBar, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { useData } from '../../src/contexts/DataContext';
import RecordingCard from '../../src/components/RecordingCard';
import EmptyState from '../../src/components/EmptyState';
import { colors, spacing, borderRadius, typography } from '../../src/theme';
import { sortByRecent, sortByPriority } from '../../src/utils/sorting';
import { Recording, Priority } from '../../src/models/types';

type Route = { key: string; title: string };

function RecentScene({ beehiveId }: { beehiveId: string }) {
  const { t } = useTranslation();
  const { getRecordingsForBeehive, updateRecording, deleteRecording } = useData();

  const beehiveRecordings = getRecordingsForBeehive(beehiveId);
  const recentRecordings = useMemo(() => sortByRecent(beehiveRecordings), [beehiveRecordings]);

  const firstSolvedId = useMemo(
    () => recentRecordings.find((r) => r.solved)?.id ?? null,
    [recentRecordings]
  );

  const renderItem = useCallback(
    ({ item }: { item: Recording }) => (
      <RecordingCard
        recording={item}
        showSolvedDivider={item.id === firstSolvedId}
        onUpdatePriority={(priority: Priority) => updateRecording(item.id, { priority })}
        onToggleSolved={() => updateRecording(item.id, { solved: !item.solved })}
        onDelete={() => deleteRecording(item.id)}
        onPlay={() => updateRecording(item.id, { lastListenedAt: Date.now() })}
      />
    ),
    [updateRecording, deleteRecording, firstSolvedId]
  );

  return (
    <FlatList
      data={recentRecordings}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={sceneStyles.list}
      ListEmptyComponent={
        <EmptyState
          icon={<Ionicons name="mic-outline" size={40} color={colors.textLight} />}
          title={t('recordings.empty')}
          description={t('recordings.emptyDesc')}
        />
      }
    />
  );
}

function PriorityScene({ beehiveId }: { beehiveId: string }) {
  const { t } = useTranslation();
  const { getRecordingsForBeehive, updateRecording, deleteRecording } = useData();

  const beehiveRecordings = getRecordingsForBeehive(beehiveId);
  const priorityRecordings = useMemo(() => sortByPriority(beehiveRecordings), [beehiveRecordings]);

  const firstSolvedId = useMemo(
    () => priorityRecordings.find((r) => r.solved)?.id ?? null,
    [priorityRecordings]
  );

  const renderItem = useCallback(
    ({ item }: { item: Recording }) => (
      <RecordingCard
        recording={item}
        showSolvedDivider={item.id === firstSolvedId}
        onUpdatePriority={(priority: Priority) => updateRecording(item.id, { priority })}
        onToggleSolved={() => updateRecording(item.id, { solved: !item.solved })}
        onDelete={() => deleteRecording(item.id)}
        onPlay={() => updateRecording(item.id, { lastListenedAt: Date.now() })}
      />
    ),
    [updateRecording, deleteRecording, firstSolvedId]
  );

  return (
    <FlatList
      data={priorityRecordings}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={sceneStyles.list}
      ListEmptyComponent={
        <EmptyState
          icon={<Ionicons name="mic-outline" size={40} color={colors.textLight} />}
          title={t('recordings.empty')}
          description={t('recordings.emptyDesc')}
        />
      }
    />
  );
}

const sceneStyles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
    paddingBottom: 100,
  },
});

export default function BeehiveDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const layout = useWindowDimensions();
  const {
    getBeehiveById,
    getLocationById,
    updateBeehive,
    deleteBeehive,
    locations,
  } = useData();

  const beehive = getBeehiveById(id);
  const location = beehive ? getLocationById(beehive.locationId) : undefined;

  const [tabIndex, setTabIndex] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(beehive?.name || '');
  const [changingLocation, setChangingLocation] = useState(false);

  const routes: Route[] = useMemo(
    () => [
      { key: 'recent', title: t('nav.recent') },
      { key: 'priority', title: t('nav.priority') },
    ],
    [t]
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
    [id]
  );

  const tabOptions = useMemo(
    () =>
      Object.fromEntries(
        routes.map((route) => [
          route.key,
          { labelStyle: styles.tabLabelTop },
        ])
      ),
    [routes]
  );

  const renderTabBar = useCallback(
    (props: SceneRendererProps & { navigationState: NavigationState<Route> }) => (
      <TabBar
        {...props}
        style={styles.tabBarTop}
        indicatorStyle={styles.tabIndicator}
        activeColor={colors.primary}
        inactiveColor={colors.textLight}
        options={tabOptions}
      />
    ),
    [tabOptions]
  );

  const handleSaveName = useCallback(() => {
    if (nameInput.trim() && beehive) {
      updateBeehive(beehive.id, { name: nameInput.trim() });
    }
    setEditingName(false);
  }, [nameInput, beehive, updateBeehive]);

  const handleChangeLocation = useCallback(
    (locationId: string) => {
      if (beehive) {
        updateBeehive(beehive.id, { locationId });
      }
      setChangingLocation(false);
    },
    [beehive, updateBeehive]
  );

  const handleDelete = useCallback(() => {
    const doDelete = () => {
      deleteBeehive(id);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (confirm(t('beehives.deleteConfirm'))) doDelete();
    } else {
      Alert.alert(t('beehives.delete'), t('beehives.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
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
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={22} color={colors.white} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Editable name + delete */}
      <View style={styles.nameRow}>
        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity onPress={handleSaveName} style={styles.saveNameBtn}>
              <Ionicons name="checkmark" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameAndActions}>
            <TouchableOpacity
              style={styles.nameButton}
              onPress={() => {
                setNameInput(beehive.name);
                setEditingName(true);
              }}
            >
              <View style={styles.nameWithIcon}>
                <MaterialCommunityIcons name="archive-outline" size={22} color={colors.primary} />
                <Text style={styles.beehiveName}>{beehive.name}</Text>
                <Ionicons name="create-outline" size={18} color={colors.textLight} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Text style={styles.locationLabel}>{t('beehives.location')}: </Text>
        {changingLocation ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
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
          <TouchableOpacity onPress={() => setChangingLocation(true)} style={styles.locationValueRow}>
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
  nameRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
  },
  saveNameBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  beehiveName: {
    ...typography.h2,
    flex: 1,
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
  tabBarTop: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  tabIndicator: {
    backgroundColor: colors.primary,
    height: 2,
  },
  tabLabelTop: {
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'none',
  },
  nameAndActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameButton: {
    flex: 1,
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
});
