import { Paths, File, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Location, Beehive, Recording } from '../models/types';

interface ExportData {
  version: 1;
  exportedAt: number;
  locations: Location[];
  beehives: Beehive[];
  recordings: (Recording & { audioBase64?: string })[];
}

function getRecordingsDir(): Directory {
  return new Directory(Paths.document, 'recordings');
}

export async function exportData(
  locations: Location[],
  beehives: Beehive[],
  recordings: Recording[]
): Promise<void> {
  // Read audio files as base64
  const recordingsWithAudio = await Promise.all(
    recordings.map(async (rec) => {
      let audioBase64: string | undefined;
      if (Platform.OS !== 'web' && rec.localPath) {
        try {
          const file = new File(rec.localPath);
          if (file.exists) {
            audioBase64 = await file.base64();
          }
        } catch {
          // Skip audio if file can't be read
        }
      }
      return { ...rec, audioBase64 };
    })
  );

  const exportPayload: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    locations,
    beehives,
    recordings: recordingsWithAudio,
  };

  const json = JSON.stringify(exportPayload);

  // Write to cache dir
  const cacheDir = new Directory(Paths.cache, 'exports');
  if (!cacheDir.exists) {
    cacheDir.create();
  }
  const exportFile = new File(cacheDir, 'buzznotes-export.buzznotes.json');
  exportFile.write(json);

  // Share the file
  await Sharing.shareAsync(exportFile.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export BuzzNotes',
  });
}

export async function importData(): Promise<{
  locations: Location[];
  beehives: Beehive[];
  recordings: Recording[];
} | null> {
  // Pick a file
  const picked = await File.pickFileAsync(undefined, 'application/json');
  if (!picked) return null;

  const file = Array.isArray(picked) ? picked[0] : picked;
  if (!file) return null;

  const json = await file.text();
  const data: ExportData = JSON.parse(json);

  if (data.version !== 1) {
    throw new Error('Unsupported export format version');
  }

  // Restore audio files
  if (Platform.OS !== 'web') {
    const recordingsDir = getRecordingsDir();
    if (!recordingsDir.exists) {
      recordingsDir.create();
    }

    for (const rec of data.recordings) {
      if (rec.audioBase64) {
        const destFile = new File(recordingsDir, `${rec.id}.m4a`);
        destFile.write(rec.audioBase64, { encoding: 'base64' });
      }
    }
  }

  // Strip audioBase64 from recordings before returning
  const cleanRecordings: Recording[] = data.recordings.map(
    ({ audioBase64, ...rec }) => rec
  );

  return {
    locations: data.locations,
    beehives: data.beehives,
    recordings: cleanRecordings,
  };
}
