import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location, Beehive, Recording } from '../models/types';

const KEYS = {
  locations: '@buzznotes/locations',
  beehives: '@buzznotes/beehives',
  recordings: '@buzznotes/recordings',
};

// Android's CursorWindow cannot read back a value much over 2 MiB, so never write one.
const MAX_RECORDINGS_BYTES = 1_900_000;

// Local storage operations
export async function loadLocalData(): Promise<{
  locations: Location[];
  beehives: Beehive[];
  recordings: Recording[];
}> {
  const [locationsJson, beehivesJson, recordingsJson] = await Promise.all([
    AsyncStorage.getItem(KEYS.locations),
    AsyncStorage.getItem(KEYS.beehives),
    AsyncStorage.getItem(KEYS.recordings),
  ]);

  return {
    locations: locationsJson ? JSON.parse(locationsJson) : [],
    beehives: beehivesJson ? JSON.parse(beehivesJson) : [],
    recordings: recordingsJson ? JSON.parse(recordingsJson) : [],
  };
}

export async function saveLocalData(
  locations: Location[],
  beehives: Beehive[],
  recordings: Recording[],
): Promise<void> {
  const recordingsJson = JSON.stringify(recordings);
  if (new TextEncoder().encode(recordingsJson).length > MAX_RECORDINGS_BYTES) {
    throw new Error('Recordings data is too large to save');
  }
  await AsyncStorage.multiSet([
    [KEYS.locations, JSON.stringify(locations)],
    [KEYS.beehives, JSON.stringify(beehives)],
    [KEYS.recordings, recordingsJson],
  ]);
}

export async function saveLocalLocations(locations: Location[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.locations, JSON.stringify(locations));
}

export async function saveLocalBeehives(beehives: Beehive[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.beehives, JSON.stringify(beehives));
}

export async function saveLocalRecordings(recordings: Recording[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.recordings, JSON.stringify(recordings));
}

/**
 * Merge local and remote data. Remote wins for conflicts (same id, later updatedAt).
 */
function mergeArrays<T extends { id: string; updatedAt: number }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();

  for (const item of local) {
    map.set(item.id, item);
  }

  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}

/**
 * Full bidirectional sync with Firestore.
 * Returns merged data.
 */
export async function syncWithFirestore(
  userId: string,
  localLocations: Location[],
  localBeehives: Beehive[],
  localRecordings: Recording[],
): Promise<{
  locations: Location[];
  beehives: Beehive[];
  recordings: Recording[];
}> {
  // Lazy import to avoid initializing Firebase when not needed
  const firebaseService = await import('./firebase');

  // Pull from Firestore
  const [remoteLocations, remoteBeehives, remoteRecordings] = await Promise.all([
    firebaseService.fetchLocations(userId),
    firebaseService.fetchBeehives(userId),
    firebaseService.fetchRecordings(userId),
  ]);

  // Merge
  const mergedLocations = mergeArrays(localLocations, remoteLocations);
  const mergedBeehives = mergeArrays(localBeehives, remoteBeehives);
  const mergedRecordings = mergeArrays(localRecordings, remoteRecordings);

  // Push merged data back to Firestore
  await firebaseService.pushAllData(userId, mergedLocations, mergedBeehives, mergedRecordings);

  // Save locally
  await Promise.all([
    saveLocalLocations(mergedLocations),
    saveLocalBeehives(mergedBeehives),
    saveLocalRecordings(mergedRecordings),
  ]);

  return {
    locations: mergedLocations,
    beehives: mergedBeehives,
    recordings: mergedRecordings,
  };
}

export async function clearLocalData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.locations),
    AsyncStorage.removeItem(KEYS.beehives),
    AsyncStorage.removeItem(KEYS.recordings),
  ]);
}
