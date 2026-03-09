import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Location, Beehive, Recording } from '../models/types';

// Locations
export async function fetchLocations(userId: string): Promise<Location[]> {
  const q = query(collection(db, 'locations'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Location);
}

export async function saveLocation(location: Location): Promise<void> {
  await setDoc(doc(db, 'locations', location.id), location);
}

export async function updateLocation(id: string, data: Partial<Location>): Promise<void> {
  await updateDoc(doc(db, 'locations', id), data);
}

export async function deleteLocation(id: string): Promise<void> {
  await deleteDoc(doc(db, 'locations', id));
}

// Beehives
export async function fetchBeehives(userId: string): Promise<Beehive[]> {
  const q = query(collection(db, 'beehives'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Beehive);
}

export async function saveBeehive(beehive: Beehive): Promise<void> {
  await setDoc(doc(db, 'beehives', beehive.id), beehive);
}

export async function updateBeehive(id: string, data: Partial<Beehive>): Promise<void> {
  await updateDoc(doc(db, 'beehives', id), data);
}

export async function deleteBeehive(id: string): Promise<void> {
  await deleteDoc(doc(db, 'beehives', id));
}

// Recordings
export async function fetchRecordings(userId: string): Promise<Recording[]> {
  const q = query(collection(db, 'recordings'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Recording);
}

export async function saveRecording(recording: Recording): Promise<void> {
  await setDoc(doc(db, 'recordings', recording.id), recording);
}

export async function updateRecording(id: string, data: Partial<Recording>): Promise<void> {
  await updateDoc(doc(db, 'recordings', id), data);
}

export async function deleteRecording(id: string): Promise<void> {
  await deleteDoc(doc(db, 'recordings', id));
}

// Batch operations for sync
export async function pushAllData(
  userId: string,
  locations: Location[],
  beehives: Beehive[],
  recordings: Recording[],
): Promise<void> {
  const promises: Promise<void>[] = [];
  locations.forEach((l) => promises.push(saveLocation(l)));
  beehives.forEach((b) => promises.push(saveBeehive(b)));
  recordings.forEach((r) => promises.push(saveRecording(r)));
  await Promise.all(promises);
}
