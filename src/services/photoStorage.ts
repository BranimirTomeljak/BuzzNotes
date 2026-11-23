import { Paths, File, Directory } from 'expo-file-system';
import { Platform } from 'react-native';
import { Recording } from '../models/types';

const MEDIA_NAME = /^[\w-]+\.(m4a|jpg)$/;

function getPhotosDir(): Directory {
  return new Directory(Paths.document, 'photos');
}

// True only for a file directly in documents/recordings or documents/photos; crafted paths fail.
export function isAppMediaPath(uri: string): boolean {
  if (typeof uri !== 'string') return false;
  return [new Directory(Paths.document, 'recordings').uri, getPhotosDir().uri].some(
    (dir) => uri.startsWith(dir) && MEDIA_NAME.test(uri.slice(dir.length)),
  );
}

export function ensurePhotosDir(): Directory {
  const dir = getPhotosDir();
  if (!dir.exists) dir.create();
  return dir;
}

export function savePhoto(sourceUri: string, recordingId: string, index: number): string {
  if (Platform.OS === 'web') return sourceUri;
  const dir = ensurePhotosDir();
  // The timestamp keeps names unique after a removal; Android File.copy throws if the target exists.
  const destFile = new File(dir, `${recordingId}_${Date.now()}_${index}.jpg`);
  const sourceFile = new File(sourceUri);
  sourceFile.copySync(destFile);
  return destFile.uri;
}

export function deleteRecordingFiles(recording: Recording): void {
  const photos = Array.isArray(recording.photos) ? recording.photos : [];
  [recording.localPath, ...photos].forEach((path) => deletePhoto(path));
}

export function deletePhoto(photoPath: string): void {
  if (Platform.OS === 'web') return;
  try {
    if (!isAppMediaPath(photoPath)) return;
    const file = new File(photoPath);
    if (file.exists) file.delete();
  } catch {
    // Ignore if file doesn't exist
  }
}
