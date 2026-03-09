import { Paths, File, Directory } from 'expo-file-system';
import { Platform } from 'react-native';

function getRecordingsDir(): Directory {
  return new Directory(Paths.document, 'recordings');
}

function ensureRecordingsDir(): void {
  if (Platform.OS === 'web') return;
  const dir = getRecordingsDir();
  if (!dir.exists) {
    dir.create();
  }
}

export async function saveRecordingLocally(
  sourceUri: string,
  recordingId: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    return sourceUri;
  }

  ensureRecordingsDir();
  const destFile = new File(getRecordingsDir(), `${recordingId}.m4a`);
  const sourceFile = new File(sourceUri);
  sourceFile.copy(destFile);
  return destFile.uri;
}

export async function uploadRecordingToCloud(
  localPath: string,
  userId: string,
  recordingId: string,
): Promise<string> {
  // Lazy import to avoid initializing Firebase when not needed
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const { storage } = await import('../../firebaseConfig');
  const storageRef = ref(storage, `users/${userId}/recordings/${recordingId}.m4a`);

  const response = await fetch(localPath);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);

  return getDownloadURL(storageRef);
}

export async function deleteLocalRecording(recordingId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const file = new File(getRecordingsDir(), `${recordingId}.m4a`);
  if (file.exists) {
    file.delete();
  }
}

export function getLocalPath(recordingId: string): string {
  if (Platform.OS === 'web') return '';
  const file = new File(getRecordingsDir(), `${recordingId}.m4a`);
  return file.uri;
}
