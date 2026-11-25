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
  sourceFile.copySync(destFile);
  return destFile.uri;
}
