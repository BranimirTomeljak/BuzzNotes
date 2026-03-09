import { Paths, File, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Location, Beehive, Recording } from '../models/types';
import { ensurePhotosDir } from './photoStorage';

interface ExportRecording extends Recording {
  audioBase64?: string;
  photosBase64?: string[];
}

interface ExportData {
  version: 1;
  exportedAt: number;
  locations: Location[];
  beehives: Beehive[];
  recordings: ExportRecording[];
}

function getRecordingsDir(): Directory {
  return new Directory(Paths.document, 'recordings');
}

export async function exportData(
  locations: Location[],
  beehives: Beehive[],
  recordings: Recording[]
): Promise<void> {
  // Read audio files and photos as base64
  const recordingsWithAudio = await Promise.all(
    recordings.map(async (rec) => {
      let audioBase64: string | undefined;
      let photosBase64: string[] | undefined;

      if (Platform.OS !== 'web') {
        if (rec.localPath) {
          try {
            const file = new File(rec.localPath);
            if (file.exists) {
              audioBase64 = await file.base64();
            }
          } catch {
            // Skip audio if file can't be read
          }
        }

        if (rec.photos?.length) {
          photosBase64 = [];
          for (const photoPath of rec.photos) {
            try {
              const file = new File(photoPath);
              if (file.exists) {
                photosBase64.push(await file.base64());
              }
            } catch {
              // Skip photo if file can't be read
            }
          }
        }
      }

      return { ...rec, audioBase64, photosBase64 };
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

  // Restore audio files and photos
  let recordingsDir: Directory | null = null;
  if (Platform.OS !== 'web') {
    recordingsDir = getRecordingsDir();
    if (!recordingsDir.exists) {
      recordingsDir.create();
    }

    const photosDir = ensurePhotosDir();

    for (const rec of data.recordings) {
      if (rec.audioBase64) {
        const destFile = new File(recordingsDir, `${rec.id}.m4a`);
        destFile.write(rec.audioBase64, { encoding: 'base64' });
      }
      if (rec.photosBase64?.length) {
        for (let i = 0; i < rec.photosBase64.length; i++) {
          const destFile = new File(photosDir, `${rec.id}_${i}.jpg`);
          destFile.write(rec.photosBase64[i], { encoding: 'base64' });
        }
      }
    }
  }

  // Strip base64 data and update paths to new device location
  const cleanRecordings: Recording[] = data.recordings.map(
    ({ audioBase64, photosBase64, ...rec }) => {
      const result = { ...rec };
      if (audioBase64 && recordingsDir) {
        const destFile = new File(recordingsDir, `${rec.id}.m4a`);
        result.localPath = destFile.uri;
      }
      if (photosBase64?.length) {
        const photosDir = ensurePhotosDir();
        result.photos = photosBase64.map((_, i) => {
          const destFile = new File(photosDir, `${rec.id}_${i}.jpg`);
          return destFile.uri;
        });
      }
      return result;
    }
  );

  return {
    locations: data.locations,
    beehives: data.beehives,
    recordings: cleanRecordings,
  };
}
