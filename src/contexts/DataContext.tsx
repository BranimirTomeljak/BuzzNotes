import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { randomUUID } from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location, Beehive, Recording, Priority } from '../models/types';
import { loadLocalData, saveLocalData, STORAGE_FULL } from '../services/sync';
import { exportData, importData } from '../services/exportImport';
import { deletePhotos } from '../services/photoStorage';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const LOCAL_USER_ID_KEY = '@buzznotes/userId';

/**
 * Get or create a local user ID (UUID) stored in AsyncStorage.
 * This is the migration anchor point — when Firebase auth is re-enabled,
 * a migrateLocalDataToUser(firebaseUid) function should update all data
 * where userId === localUuid to userId = firebaseUid.
 */
async function getOrCreateLocalUserId(): Promise<string> {
  let userId = await AsyncStorage.getItem(LOCAL_USER_ID_KEY);
  if (!userId) {
    userId = randomUUID();
    await AsyncStorage.setItem(LOCAL_USER_ID_KEY, userId);
  }
  return userId;
}

function showLoadError() {
  Toast.show({ type: 'error', text1: i18n.t('common.loadError'), visibilityTime: 6000 });
}

interface DataState {
  locations: Location[];
  beehives: Beehive[];
  recordings: Recording[];
  loading: boolean;
  syncing: boolean;
}

type DataAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SYNCING'; syncing: boolean }
  | { type: 'SET_ALL'; locations: Location[]; beehives: Beehive[]; recordings: Recording[] }
  | { type: 'ADD_LOCATION'; location: Location }
  | { type: 'UPDATE_LOCATION'; id: string; data: Partial<Location> }
  | { type: 'DELETE_LOCATION'; id: string }
  | { type: 'ADD_BEEHIVE'; beehive: Beehive }
  | { type: 'UPDATE_BEEHIVE'; id: string; data: Partial<Beehive> }
  | { type: 'DELETE_BEEHIVE'; id: string }
  | { type: 'ADD_RECORDING'; recording: Recording }
  | { type: 'UPDATE_RECORDING'; id: string; data: Partial<Recording> }
  | { type: 'DELETE_RECORDING'; id: string };

export { DataState, DataAction };

// Recording.locationId copies its beehive's; re-derive it and keep unchanged items by reference.
function alignRecordingLocations(beehives: Beehive[], recordings: Recording[]): Recording[] {
  const locationByBeehive = new Map(beehives.map((b) => [b.id, b.locationId]));
  return recordings.map((r) => {
    const locationId = locationByBeehive.get(r.beehiveId);
    return locationId !== undefined && locationId !== r.locationId ? { ...r, locationId } : r;
  });
}

export function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_SYNCING':
      return { ...state, syncing: action.syncing };
    case 'SET_ALL':
      return {
        ...state,
        locations: action.locations,
        beehives: action.beehives,
        recordings: alignRecordingLocations(action.beehives, action.recordings),
        loading: false,
      };
    case 'ADD_LOCATION':
      return { ...state, locations: [...state.locations, action.location] };
    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map((l) => (l.id === action.id ? { ...l, ...action.data } : l)),
      };
    case 'DELETE_LOCATION':
      return {
        ...state,
        locations: state.locations.filter((l) => l.id !== action.id),
        beehives: state.beehives.filter((b) => b.locationId !== action.id),
        recordings: state.recordings.filter((r) => r.locationId !== action.id),
      };
    case 'ADD_BEEHIVE':
      return { ...state, beehives: [...state.beehives, action.beehive] };
    case 'UPDATE_BEEHIVE': {
      const { locationId } = action.data;
      return {
        ...state,
        beehives: state.beehives.map((b) => (b.id === action.id ? { ...b, ...action.data } : b)),
        // Keep updatedAt, so a move never beats newer edits from another device in a merge.
        recordings:
          locationId === undefined
            ? state.recordings
            : state.recordings.map((r) =>
                r.beehiveId === action.id && r.locationId !== locationId ? { ...r, locationId } : r,
              ),
      };
    }
    case 'DELETE_BEEHIVE':
      return {
        ...state,
        beehives: state.beehives.filter((b) => b.id !== action.id),
        recordings: state.recordings.filter((r) => r.beehiveId !== action.id),
      };
    case 'ADD_RECORDING':
      return { ...state, recordings: [...state.recordings, action.recording] };
    case 'UPDATE_RECORDING':
      return {
        ...state,
        recordings: state.recordings.map((r) =>
          r.id === action.id ? { ...r, ...action.data } : r,
        ),
      };
    case 'DELETE_RECORDING':
      return {
        ...state,
        recordings: state.recordings.filter((r) => r.id !== action.id),
      };
    default:
      return state;
  }
}

interface DataContextType {
  locations: Location[];
  beehives: Beehive[];
  recordings: Recording[];
  loading: boolean;
  syncing: boolean;

  addLocation: (name: string) => Promise<Location>;
  updateLocation: (id: string, data: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  addBeehive: (name: string, locationId: string) => Promise<Beehive>;
  updateBeehive: (id: string, data: Partial<Beehive>) => Promise<void>;
  deleteBeehive: (id: string) => Promise<void>;

  addRecording: (params: {
    beehiveId: string;
    locationId: string;
    localPath: string;
    duration: number;
    priority: Priority;
    notes?: string;
    photos?: string[];
  }) => Promise<Recording>;
  updateRecording: (id: string, data: Partial<Recording>) => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;

  refreshData: () => Promise<void>;
  exportAllData: () => Promise<void>;
  importAllData: () => Promise<void>;
  getBeehivesForLocation: (locationId: string) => Beehive[];
  getRecordingsForBeehive: (beehiveId: string) => Recording[];
  getRecordingsForLocation: (locationId: string) => Recording[];
  getLocationById: (id: string) => Location | undefined;
  getBeehiveById: (id: string) => Beehive | undefined;
  getRecordingById: (id: string) => Recording | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const userIdRef = useRef<string>('');
  const loadFailedRef = useRef(false);
  const [state, dispatch] = useReducer(dataReducer, {
    locations: [],
    beehives: [],
    recordings: [],
    loading: true,
    syncing: false,
  });

  // Load local data on mount
  useEffect(() => {
    (async () => {
      dispatch({ type: 'SET_LOADING', loading: true });
      try {
        userIdRef.current = await getOrCreateLocalUserId();
        const data = await loadLocalData();
        dispatch({
          type: 'SET_ALL',
          locations: data.locations,
          beehives: data.beehives,
          recordings: data.recordings,
        });
      } catch {
        loadFailedRef.current = true;
        showLoadError();
      }
    })();
  }, []);

  // Persist to AsyncStorage whenever data changes
  useEffect(() => {
    // Never save before a successful load, or the in-memory state would overwrite stored data.
    if (state.loading) {
      // Deferred so it replaces, not precedes, a screen's own toast for the same tap.
      if (loadFailedRef.current) setTimeout(showLoadError, 0);
      return;
    }
    saveLocalData(state.locations, state.beehives, state.recordings).catch(
      (e: { code?: string }) => {
        const full = e?.code === STORAGE_FULL;
        Toast.show({
          type: 'error',
          text1: i18n.t(full ? 'common.storageFull' : 'common.saveError'),
          visibilityTime: full ? 6000 : 3000,
        });
      },
    );
  }, [state.locations, state.beehives, state.recordings, state.loading]);

  const addLocation = useCallback(async (name: string): Promise<Location> => {
    const now = Date.now();
    const location: Location = {
      id: randomUUID(),
      name,
      userId: userIdRef.current,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_LOCATION', location });
    return location;
  }, []);

  const updateLocation = useCallback(async (id: string, data: Partial<Location>) => {
    dispatch({ type: 'UPDATE_LOCATION', id, data: { ...data, updatedAt: Date.now() } });
  }, []);

  const deleteLocation = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_LOCATION', id });
  }, []);

  const addBeehive = useCallback(async (name: string, locationId: string): Promise<Beehive> => {
    const now = Date.now();
    const beehive: Beehive = {
      id: randomUUID(),
      name,
      locationId,
      userId: userIdRef.current,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_BEEHIVE', beehive });
    return beehive;
  }, []);

  const updateBeehive = useCallback(async (id: string, data: Partial<Beehive>) => {
    dispatch({ type: 'UPDATE_BEEHIVE', id, data: { ...data, updatedAt: Date.now() } });
  }, []);

  const deleteBeehive = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_BEEHIVE', id });
  }, []);

  const addRecording = useCallback(
    async (params: {
      beehiveId: string;
      locationId: string;
      localPath: string;
      duration: number;
      priority: Priority;
      notes?: string;
      photos?: string[];
    }): Promise<Recording> => {
      const now = Date.now();
      const recording: Recording = {
        id: randomUUID(),
        beehiveId: params.beehiveId,
        locationId: params.locationId,
        userId: userIdRef.current,
        audioUrl: '',
        localPath: params.localPath,
        duration: params.duration,
        priority: params.priority,
        solved: false,
        lastListenedAt: null,
        notes: params.notes || '',
        photos: params.photos || [],
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_RECORDING', recording });
      return recording;
    },
    [],
  );

  const updateRecording = useCallback(async (id: string, data: Partial<Recording>) => {
    dispatch({ type: 'UPDATE_RECORDING', id, data: { ...data, updatedAt: Date.now() } });
  }, []);

  const deleteRecording = useCallback(async (id: string) => {
    deletePhotos(id);
    dispatch({ type: 'DELETE_RECORDING', id });
  }, []);

  const refreshData = useCallback(async () => {
    dispatch({ type: 'SET_SYNCING', syncing: true });
    try {
      // Retry the user id only after a failed first load, so this never races the mount effect.
      if (loadFailedRef.current && !userIdRef.current) {
        userIdRef.current = await getOrCreateLocalUserId();
      }
      const data = await loadLocalData();
      dispatch({
        type: 'SET_ALL',
        locations: data.locations,
        beehives: data.beehives,
        recordings: data.recordings,
      });
    } catch {
      showLoadError();
    } finally {
      dispatch({ type: 'SET_SYNCING', syncing: false });
    }
  }, []);

  const exportAllData = useCallback(async () => {
    if (state.loading) {
      showLoadError();
      return;
    }
    dispatch({ type: 'SET_SYNCING', syncing: true });
    try {
      await exportData(state.locations, state.beehives, state.recordings);
      Toast.show({
        type: 'success',
        text1: t('common.exportSuccess'),
        visibilityTime: 1500,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        visibilityTime: 1500,
      });
    } finally {
      dispatch({ type: 'SET_SYNCING', syncing: false });
    }
  }, [state.locations, state.beehives, state.recordings, state.loading, t]);

  const importAllData = useCallback(async () => {
    if (state.loading) {
      showLoadError();
      return;
    }
    dispatch({ type: 'SET_SYNCING', syncing: true });
    try {
      const imported = await importData();
      if (!imported) {
        dispatch({ type: 'SET_SYNCING', syncing: false });
        return;
      }

      // Merge strategy: imported items with same ID update existing; new items are added
      const mergeById = <T extends { id: string; updatedAt: number }>(
        existing: T[],
        incoming: T[],
      ): T[] => {
        const map = new Map<string, T>();
        for (const item of existing) {
          map.set(item.id, item);
        }
        for (const item of incoming) {
          const current = map.get(item.id);
          if (!current || item.updatedAt >= current.updatedAt) {
            map.set(item.id, item);
          }
        }
        return Array.from(map.values());
      };

      const merged = {
        locations: mergeById(state.locations, imported.locations),
        beehives: mergeById(state.beehives, imported.beehives),
        recordings: mergeById(state.recordings, imported.recordings),
      };

      dispatch({
        type: 'SET_ALL',
        locations: merged.locations,
        beehives: merged.beehives,
        recordings: merged.recordings,
      });

      Toast.show({
        type: 'success',
        text1: t('common.importSuccess'),
        visibilityTime: 1500,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: t('common.importError'),
        visibilityTime: 1500,
      });
    } finally {
      dispatch({ type: 'SET_SYNCING', syncing: false });
    }
  }, [state.locations, state.beehives, state.recordings, state.loading, t]);

  const getBeehivesForLocation = useCallback(
    (locationId: string) => state.beehives.filter((b) => b.locationId === locationId),
    [state.beehives],
  );

  const getRecordingsForBeehive = useCallback(
    (beehiveId: string) => state.recordings.filter((r) => r.beehiveId === beehiveId),
    [state.recordings],
  );

  const getRecordingsForLocation = useCallback(
    (locationId: string) => state.recordings.filter((r) => r.locationId === locationId),
    [state.recordings],
  );

  const getLocationById = useCallback(
    (id: string) => state.locations.find((l) => l.id === id),
    [state.locations],
  );

  const getBeehiveById = useCallback(
    (id: string) => state.beehives.find((b) => b.id === id),
    [state.beehives],
  );

  const getRecordingById = useCallback(
    (id: string) => state.recordings.find((r) => r.id === id),
    [state.recordings],
  );

  const value = useMemo(
    () => ({
      ...state,
      addLocation,
      updateLocation,
      deleteLocation,
      addBeehive,
      updateBeehive,
      deleteBeehive,
      addRecording,
      updateRecording,
      deleteRecording,
      refreshData,
      exportAllData,
      importAllData,
      getBeehivesForLocation,
      getRecordingsForBeehive,
      getRecordingsForLocation,
      getLocationById,
      getBeehiveById,
      getRecordingById,
    }),
    [
      state,
      addLocation,
      updateLocation,
      deleteLocation,
      addBeehive,
      updateBeehive,
      deleteBeehive,
      addRecording,
      updateRecording,
      deleteRecording,
      refreshData,
      exportAllData,
      importAllData,
      getBeehivesForLocation,
      getRecordingsForBeehive,
      getRecordingsForLocation,
      getLocationById,
      getBeehiveById,
      getRecordingById,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
