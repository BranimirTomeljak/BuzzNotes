import { Paths, File, Directory } from 'expo-file-system';
import { Platform } from 'react-native';

function getPhotosDir(): Directory {
  return new Directory(Paths.document, 'photos');
}

export function ensurePhotosDir(): Directory {
  const dir = getPhotosDir();
  if (!dir.exists) dir.create();
  return dir;
}

export function savePhoto(sourceUri: string, recordingId: string, index: number): string {
  if (Platform.OS === 'web') return sourceUri;
  const dir = ensurePhotosDir();
  const destFile = new File(dir, `${recordingId}_${index}.jpg`);
  const sourceFile = new File(sourceUri);
  sourceFile.copy(destFile);
  return destFile.uri;
}

export function deletePhotos(recordingId: string): void {
  if (Platform.OS === 'web') return;
  const dir = getPhotosDir();
  if (!dir.exists) return;
  const files = dir.list();
  for (const item of files) {
    if (item instanceof File && item.name?.startsWith(`${recordingId}_`)) {
      item.delete();
    }
  }
}

export function deletePhoto(photoPath: string): void {
  if (Platform.OS === 'web') return;
  try {
    const file = new File(photoPath);
    if (file.exists) file.delete();
  } catch {
    // Ignore if file doesn't exist
  }
}
