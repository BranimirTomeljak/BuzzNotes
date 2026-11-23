import { Paths, File, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Location, Beehive, Recording } from '../models/types';
import { ensurePhotosDir, isAppMediaPath } from './photoStorage';

// Recording ids become media file names, so only plain names may be imported.
const SAFE_ID = /^[\w-]+$/;

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
  recordings: Recording[],
): Promise<void> {
  // Read media one file at a time; parallel native reads can exhaust Android's Java heap.
  const recordingsWithAudio: ExportRecording[] = [];
  for (const rec of recordings) {
    let audioBase64: string | undefined;
    let photosBase64: string[] | undefined;

    if (Platform.OS !== 'web') {
      if (rec.localPath && isAppMediaPath(rec.localPath)) {
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
          if (!isAppMediaPath(photoPath)) continue;
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

    recordingsWithAudio.push({ ...rec, audioBase64, photosBase64 });
  }

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
  exportFile.writeSync(json);

  // Share the file
  await Sharing.shareAsync(exportFile.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export BuzzNotes',
  });
}

export async function importData(existing: Recording[] = []): Promise<{
  locations: Location[];
  beehives: Beehive[];
  recordings: Recording[];
} | null> {
  // Pick a file; a cancelled pick rejects with ERR_PICKER_CANCELLED instead of resolving to nothing.
  const picked = await File.pickFileAsync(undefined, 'application/json').catch(
    (e: { code?: string }) => {
      if (e?.code === 'ERR_PICKER_CANCELLED') return null;
      throw e;
    },
  );
  if (!picked) return null;

  const file = Array.isArray(picked) ? picked[0] : picked;
  if (!file) return null;

  const json = await file.text();
  const data: ExportData = JSON.parse(json);

  if (data.version !== 1) {
    throw new Error('Unsupported export format version');
  }
  if (data.recordings.some((rec) => typeof rec.id !== 'string' || !SAFE_ID.test(rec.id))) {
    throw new Error('Unsupported recording id');
  }

  // Restore audio files and photos
  let recordingsDir: Directory | null = null;
  if (Platform.OS !== 'web') {
    recordingsDir = getRecordingsDir();
    if (!recordingsDir.exists) {
      recordingsDir.create();
    }

    const photosDir = ensurePhotosDir();
    const localById = new Map(existing.map((r) => [r.id, r]));

    for (const rec of data.recordings) {
      const local = localById.get(rec.id);
      // importAllData's merge keeps a newer local record (incoming wins on >=); keep its media too.
      if (local && local.updatedAt > rec.updatedAt) continue;
      if (rec.audioBase64) {
        const destFile = new File(recordingsDir, `${rec.id}.m4a`);
        destFile.writeSync(rec.audioBase64, { encoding: 'base64' });
      }
      if (rec.photosBase64?.length) {
        for (let i = 0; i < rec.photosBase64.length; i++) {
          const destFile = new File(photosDir, `${rec.id}_${i}.jpg`);
          destFile.writeSync(rec.photosBase64[i], { encoding: 'base64' });
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
    },
  );

  return {
    locations: data.locations,
    beehives: data.beehives,
    recordings: cleanRecordings,
  };
}
