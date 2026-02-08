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
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TabView, TabBar, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import Toast from 'react-native-toast-message';
import { useData } from '../../src/contexts/DataContext';
import BeehiveCard from '../../src/components/BeehiveCard';
import RecordingCard from '../../src/components/RecordingCard';
import SearchBar from '../../src/components/SearchBar';
import EmptyState from '../../src/components/EmptyState';
import { colors, spacing, borderRadius, typography } from '../../src/theme';
import { naturalSort, sortByRecent, sortByPriority } from '../../src/utils/sorting';
import { Beehive, Recording, Priority } from '../../src/models/types';

type Route = { key: string; title: string };

function BeehivesScene({
  locationId,
  search,
  setSearch,
  setShowAddBeehive,
}: {
  locationId: string;
  search: string;
  setSearch: (s: string) => void;
  setShowAddBeehive: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { getBeehivesForLocation, getRecordingsForLocation } = useData();

  const beehives = getBeehivesForLocation(locationId);
  const locationRecordings = getRecordingsForLocation(locationId);

  const filteredBeehives = useMemo(() => {
    const sorted = [...beehives].sort((a, b) => naturalSort(a.name, b.name));
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((b) => b.name.toLowerCase().includes(q));
  }, [beehives, search]);

  const recordingsForBeehive = useCallback(
    (beehiveId: string) =>
      locationRecordings.filter((r) => r.beehiveId === beehiveId).length,
    [locationRecordings]
  );

  const renderBeehive = useCallback(
    ({ item }: { item: Beehive }) => (
      <BeehiveCard
        beehive={item}
        recordingCount={recordingsForBeehive(item.id)}
        onPress={() => router.push(`/beehive/${item.id}`)}
        onRecord={() =>
          router.push({ pathname: '/record', params: { beehiveId: item.id, locationId } })
        }
      />
    ),
    [recordingsForBeehive, router, locationId]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={sceneStyles.beehiveToolbar}>
        <View style={{ flex: 1 }}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity
          style={sceneStyles.addBeehiveButton}
          onPress={() => setShowAddBeehive(true)}
          activeOpacity={0.7}
        >
          <Text style={sceneStyles.addBeehiveText}>+ {t('beehives.add')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredBeehives}
        keyExtractor={(item) => item.id}
        renderItem={renderBeehive}
        contentContainerStyle={sceneStyles.list}
        ListEmptyComponent={
          <EmptyState
            icon={<MaterialCommunityIcons name="archive-outline" size={40} color={colors.textLight} />}
            title={t('beehives.empty')}
            description={t('beehives.emptyDesc')}
          />
        }
      />
    </View>
  );
}

function RecentScene({ locationId }: { locationId: string }) {
  const { t } = useTranslation();
  const { getRecordingsForLocation, updateRecording, deleteRecording, getBeehiveById } = useData();

  const locationRecordings = getRecordingsForLocation(locationId);
  const recentRecordings = useMemo(() => sortByRecent(locationRecordings), [locationRecordings]);

  const firstSolvedId = useMemo(
    () => recentRecordings.find((r) => r.solved)?.id ?? null,
    [recentRecordings]
  );

  const renderItem = useCallback(
    ({ item }: { item: Recording }) => {
      const beehive = getBeehiveById(item.beehiveId);
      return (
        <RecordingCard
          recording={item}
          beehiveName={beehive?.name}
          showSolvedDivider={item.id === firstSolvedId}
          onUpdatePriority={(priority: Priority) => updateRecording(item.id, { priority })}
          onToggleSolved={() => updateRecording(item.id, { solved: !item.solved })}
          onDelete={() => deleteRecording(item.id)}
          onPlay={() => updateRecording(item.id, { lastListenedAt: Date.now() })}
        />
      );
    },
    [getBeehiveById, updateRecording, deleteRecording, firstSolvedId]
  );

  return (
    <FlatList
      data={recentRecordings}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={sceneStyles.list}
      ListEmptyComponent={
        <EmptyState
          icon={<Ionicons name="time-outline" size={40} color={colors.textLight} />}
          title={t('recordings.empty')}
          description={t('recordings.emptyDesc')}
        />
      }
    />
  );
}

function PriorityScene({ locationId }: { locationId: string }) {
  const { t } = useTranslation();
  const { getRecordingsForLocation, updateRecording, deleteRecording, getBeehiveById } = useData();

  const locationRecordings = getRecordingsForLocation(locationId);
  const priorityRecordings = useMemo(() => sortByPriority(locationRecordings), [locationRecordings]);

  const firstSolvedId = useMemo(
    () => priorityRecordings.find((r) => r.solved)?.id ?? null,
    [priorityRecordings]
  );

  const renderItem = useCallback(
    ({ item }: { item: Recording }) => {
      const beehive = getBeehiveById(item.beehiveId);
      return (
        <RecordingCard
          recording={item}
          beehiveName={beehive?.name}
          showSolvedDivider={item.id === firstSolvedId}
          onUpdatePriority={(priority: Priority) => updateRecording(item.id, { priority })}
          onToggleSolved={() => updateRecording(item.id, { solved: !item.solved })}
          onDelete={() => deleteRecording(item.id)}
          onPlay={() => updateRecording(item.id, { lastListenedAt: Date.now() })}
        />
      );
    },
    [getBeehiveById, updateRecording, deleteRecording, firstSolvedId]
  );

  return (
    <FlatList
      data={priorityRecordings}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={sceneStyles.list}
      ListEmptyComponent={
        <EmptyState
          icon={<Ionicons name="flag-outline" size={40} color={colors.textLight} />}
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
  beehiveToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  addBeehiveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  addBeehiveText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default function LocationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const layout = useWindowDimensions();
  const {
    getLocationById,
    updateLocation,
    deleteLocation,
    addBeehive,
  } = useData();

  const location = getLocationById(id);

  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(location?.name || '');
  const [showAddBeehive, setShowAddBeehive] = useState(false);
  const [newBeehiveName, setNewBeehiveName] = useState('');

  const routes: Route[] = useMemo(
    () => [
      { key: 'beehives', title: t('beehives.title') },
      { key: 'recent', title: t('nav.recent') },
      { key: 'priority', title: t('nav.priority') },
    ],
    [t]
  );

  const renderScene = useCallback(
    ({ route }: SceneRendererProps & { route: Route }) => {
      switch (route.key) {
        case 'beehives':
          return (
            <BeehivesScene
              locationId={id}
              search={search}
              setSearch={setSearch}
              setShowAddBeehive={setShowAddBeehive}
            />
          );
        case 'recent':
          return <RecentScene locationId={id} />;
        case 'priority':
          return <PriorityScene locationId={id} />;
        default:
          return null;
      }
    },
    [id, search]
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
    if (nameInput.trim() && location) {
      updateLocation(location.id, { name: nameInput.trim() });
    }
    setEditingName(false);
  }, [nameInput, location, updateLocation]);

  const handleDelete = useCallback(() => {
    const doDelete = () => {
      deleteLocation(id);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (confirm(t('locations.deleteConfirm'))) doDelete();
    } else {
      Alert.alert(t('locations.delete'), t('locations.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [id, deleteLocation, router, t]);

  const handleAddBeehive = useCallback(async () => {
    if (!newBeehiveName.trim()) return;
    await addBeehive(newBeehiveName.trim(), id);
    setNewBeehiveName('');
    setShowAddBeehive(false);
    Toast.show({ type: 'success', text1: t('common.success'), visibilityTime: 1500 });
  }, [newBeehiveName, addBeehive, id, t]);

  if (!location) {
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
          title: location.name,
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
                setNameInput(location.name);
                setEditingName(true);
              }}
            >
              <View style={styles.nameWithIcon}>
                <Ionicons name="location-outline" size={22} color={colors.primary} />
                <Text style={styles.locationName}>{location.name}</Text>
                <Ionicons name="create-outline" size={18} color={colors.textLight} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Swipeable Tabs */}
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        renderTabBar={renderTabBar}
        initialLayout={{ width: layout.width }}
        lazy
      />

      {/* Add Beehive Modal */}
      <Modal visible={showAddBeehive} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => { setShowAddBeehive(false); setNewBeehiveName(''); }}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.dialogTitle}>{t('beehives.add')}</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder={t('beehives.namePlaceholder')}
              placeholderTextColor={colors.textLight}
              value={newBeehiveName}
              onChangeText={setNewBeehiveName}
              autoFocus
              onSubmitEditing={handleAddBeehive}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                onPress={() => { setShowAddBeehive(false); setNewBeehiveName(''); }}
              >
                <Text style={styles.dialogCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogSaveButton, !newBeehiveName.trim() && styles.dialogSaveButtonDisabled]}
                onPress={handleAddBeehive}
                disabled={!newBeehiveName.trim()}
              >
                <Text style={styles.dialogSaveText}>{t('common.create')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingVertical: spacing.md,
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
  locationName: {
    ...typography.h2,
    flex: 1,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.card,
    borderRadius: 20,
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
  dialogCancelButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  dialogCancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  dialogSaveButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  dialogSaveButtonDisabled: {
    opacity: 0.5,
  },
  dialogSaveText: {
    ...typography.button,
    color: colors.white,
  },
});
