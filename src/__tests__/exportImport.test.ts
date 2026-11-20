import * as Sharing from 'expo-sharing';
import { exportData, importData } from '../services/exportImport';
import { File, fakeFs } from '../testUtils/fakeFileSystem';
import { Beehive, Location, Priority, Recording } from '../models/types';

jest.mock('expo-file-system', () => require('../testUtils/fakeFileSystem'));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));

const DOC = 'file:///data/user/0/app/files';
const EXPORT_URI = 'file:///data/user/0/app/cache/exports/buzznotes-export.buzznotes.json';
const PICKED_URI = 'file:///data/user/0/app/cache/DocumentPicker/backup.buzznotes.json';

const loc: Location = {
  id: 'loc1',
  name: 'Kuljani',
  userId: 'u1',
  createdAt: 1000,
  updatedAt: 1000,
};

const hive: Beehive = {
  id: 'bh1',
  name: 'Hive 1',
  locationId: 'loc1',
  userId: 'u1',
  createdAt: 1000,
  updatedAt: 1000,
};

const rec: Recording = {
  id: 'r1',
  beehiveId: 'bh1',
  locationId: 'loc1',
  userId: 'u1',
  audioUrl: '',
  localPath: `${DOC}/recordings/rec_1700000000000.m4a`,
  duration: 42,
  priority: Priority.HIGH,
  solved: false,
  lastListenedAt: null,
  notes: 'Queen seen',
  photos: [`${DOC}/photos/rec_1700000000000_0.jpg`, `${DOC}/photos/r1_1.jpg`],
  createdAt: 1000,
  updatedAt: 2000,
};

async function importFile(json: string) {
  fakeFs.seed(PICKED_URI, json);
  File.pickFileAsync.mockResolvedValueOnce(new File(PICKED_URI));
  return importData();
}

beforeEach(() => {
  fakeFs.reset();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('exportData + importData', () => {
  it('round-trips data and media and rewrites paths to the new device', async () => {
    fakeFs.seed(rec.localPath, 'AUDIO-1');
    fakeFs.seed(rec.photos![0], 'PHOTO-0');
    fakeFs.seed(rec.photos![1], 'PHOTO-1');

    await exportData([loc], [hive], [rec]);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      EXPORT_URI,
      expect.objectContaining({ mimeType: 'application/json' }),
    );
    const json = fakeFs.read(EXPORT_URI)!;

    fakeFs.reset();
    const result = await importFile(json);

    expect(result).toEqual({
      locations: [loc],
      beehives: [hive],
      recordings: [
        {
          ...rec,
          localPath: `${DOC}/recordings/r1.m4a`,
          photos: [`${DOC}/photos/r1_0.jpg`, `${DOC}/photos/r1_1.jpg`],
        },
      ],
    });
    expect(fakeFs.read(`${DOC}/recordings/r1.m4a`)).toBe('AUDIO-1');
    expect(fakeFs.read(`${DOC}/photos/r1_0.jpg`)).toBe('PHOTO-0');
    expect(fakeFs.read(`${DOC}/photos/r1_1.jpg`)).toBe('PHOTO-1');
  });

  it('drops a photo that is missing at export time', async () => {
    fakeFs.seed(rec.localPath, 'AUDIO-1');
    fakeFs.seed(rec.photos![0], 'PHOTO-0');

    await exportData([loc], [hive], [rec]);
    const json = fakeFs.read(EXPORT_URI)!;
    expect(JSON.parse(json).recordings[0].photosBase64).toHaveLength(1);

    fakeFs.reset();
    const result = await importFile(json);

    expect(result?.recordings[0].photos).toEqual([`${DOC}/photos/r1_0.jpg`]);
    expect(fakeFs.read(`${DOC}/photos/r1_0.jpg`)).toBe('PHOTO-0');
    expect(fakeFs.list(`${DOC}/photos`)).toEqual([`${DOC}/photos/r1_0.jpg`]);
  });

  it('drops a photo whose read fails at export time', async () => {
    fakeFs.seed(rec.localPath, 'AUDIO-1');
    fakeFs.seed(rec.photos![0], 'PHOTO-0');
    fakeFs.seed(rec.photos![1], 'PHOTO-1');
    const base64 = File.prototype.base64;
    jest.spyOn(File.prototype, 'base64').mockImplementation(function (this: File) {
      return this.uri === rec.photos![1] ? Promise.reject(new Error('EIO')) : base64.call(this);
    });

    await exportData([loc], [hive], [rec]);

    const exported = JSON.parse(fakeFs.read(EXPORT_URI)!).recordings[0];
    expect(exported.audioBase64).toBe(btoa('AUDIO-1'));
    expect(exported.photosBase64).toEqual([btoa('PHOTO-0')]);
  });
});

describe('importData', () => {
  it('imports a literal version-1 file', async () => {
    const v1 = `{"version":1,"exportedAt":1763600000000,
      "locations":[{"id":"loc1","name":"Kuljani","userId":"u1","createdAt":1000,"updatedAt":1000}],
      "beehives":[{"id":"bh1","name":"Hive 1","locationId":"loc1","userId":"u1",
        "createdAt":1000,"updatedAt":1000}],
      "recordings":[{"id":"r1","beehiveId":"bh1","locationId":"loc1","userId":"u1","audioUrl":"",
        "localPath":"file:///data/user/0/other/files/recordings/rec_1700000000000.m4a",
        "duration":42,"priority":"HIGH","solved":true,"lastListenedAt":1700000100000,
        "notes":"Queen seen","photos":["file:///data/user/0/other/files/photos/r1_0.jpg"],
        "createdAt":1000,"updatedAt":2000,"audioBase64":"QVVESU8=","photosBase64":["UEhPVE8="]}]}`;

    const result = await importFile(v1);

    expect(result).toStrictEqual({
      locations: [loc],
      beehives: [hive],
      recordings: [
        {
          id: 'r1',
          beehiveId: 'bh1',
          locationId: 'loc1',
          userId: 'u1',
          audioUrl: '',
          localPath: `${DOC}/recordings/r1.m4a`,
          duration: 42,
          priority: Priority.HIGH,
          solved: true,
          lastListenedAt: 1700000100000,
          notes: 'Queen seen',
          photos: [`${DOC}/photos/r1_0.jpg`],
          createdAt: 1000,
          updatedAt: 2000,
        },
      ],
    });
    expect(fakeFs.read(`${DOC}/recordings/r1.m4a`)).toBe('AUDIO');
    expect(fakeFs.read(`${DOC}/photos/r1_0.jpg`)).toBe('PHOTO');
  });

  it('imports a pre-photos version-1 export with a date field and no notes or photos', async () => {
    const old = `{"version":1,"exportedAt":1770500000000,"locations":[],"beehives":[],
      "recordings":[{"id":"r0","beehiveId":"bh1","locationId":"loc1","userId":"u1","audioUrl":"",
        "localPath":"file:///data/user/0/other/files/recordings/rec_1770500000000.m4a",
        "date":"08.02.2026","duration":7,"priority":"LOW","solved":false,"lastListenedAt":null,
        "createdAt":1770500000000,"updatedAt":1770500000000,"audioBase64":"QVVESU8="}]}`;

    const result = await importFile(old);

    expect(result?.recordings).toStrictEqual([
      {
        id: 'r0',
        beehiveId: 'bh1',
        locationId: 'loc1',
        userId: 'u1',
        audioUrl: '',
        localPath: `${DOC}/recordings/r0.m4a`,
        date: '08.02.2026',
        duration: 7,
        priority: Priority.LOW,
        solved: false,
        lastListenedAt: null,
        createdAt: 1770500000000,
        updatedAt: 1770500000000,
      },
    ]);
    expect(fakeFs.read(`${DOC}/recordings/r0.m4a`)).toBe('AUDIO');
    expect(fakeFs.list(`${DOC}/photos`)).toEqual([]);
  });

  it('rejects version 2 and writes nothing', async () => {
    const v2 = JSON.stringify({
      version: 2,
      exportedAt: 1,
      locations: [],
      beehives: [],
      recordings: [{ ...rec, audioBase64: 'QVVESU8=', photosBase64: ['UEhPVE8='] }],
    });

    await expect(importFile(v2)).rejects.toThrow('Unsupported export format version');
    expect(fakeFs.list()).toEqual([PICKED_URI]);
  });
});
