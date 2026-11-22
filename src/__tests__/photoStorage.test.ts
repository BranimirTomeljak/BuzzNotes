import { Platform } from 'react-native';
import {
  deletePhoto,
  deleteRecordingFiles,
  isAppMediaPath,
  savePhoto,
} from '../services/photoStorage';
import { Directory, File, fakeFs } from '../testUtils/fakeFileSystem';
import { Priority, Recording } from '../models/types';

jest.mock('expo-file-system', () => require('../testUtils/fakeFileSystem'));

const DOC = 'file:///data/user/0/app/files';
const PHOTOS = `${DOC}/photos/`;
const RECORDINGS = `${DOC}/recordings/`;
const PICKED = 'file:///data/user/0/app/cache/ImagePicker/IMG_0001.jpg';
const DATABASE = 'file:///data/user/0/app/databases/RKStorage';
const UUID = '6f1c2a4e-9b3d-4c7a-8e21-5d0f3b9a7c11';

function pick(n: number): string {
  const uri = `file:///data/user/0/app/cache/ImagePicker/IMG_${n}.jpg`;
  fakeFs.seed(uri, `IMG-${n}`);
  return uri;
}

beforeEach(() => {
  fakeFs.reset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('photoStorage', () => {
  it('savePhoto copies the picked image into documents/photos', () => {
    fakeFs.seed(PICKED, 'IMG-1');

    const uri = savePhoto(PICKED, 'r1', 0);

    expect(uri.startsWith(PHOTOS)).toBe(true);
    expect(uri.slice(PHOTOS.length)).toMatch(/^[^/]+\.jpg$/);
    expect(fakeFs.read(uri)).toBe('IMG-1');
    expect(fakeFs.read(PICKED)).toBe('IMG-1');
  });

  it('removing a non-last photo and then adding one does not throw, gives a new name and leaves the other files unchanged', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const photos = [0, 1, 2].map((i) => savePhoto(pick(i), 'r1', i));
    deletePhoto(photos[0]);
    const kept = photos.slice(1);
    now.mockReturnValue(1_700_000_060_000);

    const added = savePhoto(pick(3), 'r1', kept.length);

    expect(kept).not.toContain(added);
    expect(fakeFs.read(added)).toBe('IMG-3');
    expect(kept.map((uri) => fakeFs.read(uri))).toEqual(['IMG-1', 'IMG-2']);
    expect(fakeFs.list(PHOTOS)).toEqual([...kept, added].sort());
  });

  it('a multi-select batch in one millisecond gets distinct names', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

    const batch = [0, 1, 2].map((i) => savePhoto(pick(i), 'r1', 5 + i));

    expect(new Set(batch).size).toBe(3);
    expect(batch.map((uri) => fakeFs.read(uri))).toEqual(['IMG-0', 'IMG-1', 'IMG-2']);
  });

  it('the same millisecond and the same index throws and never overwrites', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const first = savePhoto(pick(0), 'r1', 0);

    expect(() => savePhoto(pick(1), 'r1', 0)).toThrow();
    expect(fakeFs.read(first)).toBe('IMG-0');
  });

  it('deletePhoto ignores a missing file', () => {
    fakeFs.seed(`${PHOTOS}r1_0.jpg`, 'KEEP');

    expect(() => deletePhoto(`${PHOTOS}r1_1.jpg`)).not.toThrow();
    expect(fakeFs.list()).toEqual([`${PHOTOS}r1_0.jpg`]);
  });

  it('the guard refuses paths outside the two folders, the folders themselves, and crafted names', () => {
    const refused = [
      DATABASE,
      `${DOC}/r1.m4a`,
      `${DOC}/photosx/r1_0.jpg`,
      PICKED,
      PHOTOS,
      RECORDINGS,
      `${DOC}/photos`,
      `${PHOTOS}../recordings/r1.m4a`,
      `${PHOTOS}%2e%2e/recordings/r1.m4a`,
      `${PHOTOS}..%2Frecordings%2Fr1.m4a`,
      `${PHOTOS}%2e%2e%2Frecordings%2Fr1.m4a`,
      `${PHOTOS}%2e%2e%2Fr2.m4a`,
      `${PHOTOS}%2e%2e%2F%2e%2e%2Fcache%2FImagePicker%2FIMG_0001.jpg`,
      `${PHOTOS}r1_0.jpg?x`,
      `${PHOTOS}r1_0.jpg#x`,
      `${PHOTOS}r1_0.jpeg`,
      `${PHOTOS}r1_0.JPG`,
      '',
    ];

    expect(refused.filter((uri) => isAppMediaPath(uri))).toEqual([]);
    expect([undefined, null, 5].map((v) => isAppMediaPath(v as unknown as string))).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('deletePhoto refuses a crafted path that resolves to another app file', () => {
    fakeFs.seed(DATABASE, 'DB');
    fakeFs.seed(`${RECORDINGS}r1.m4a`, 'AUDIO');

    fakeFs.seed(`${DOC}/r2.m4a`, 'R2');
    fakeFs.seed(PICKED, 'CACHED');

    deletePhoto(`${PHOTOS}..%2F..%2Fdatabases%2FRKStorage`);
    deletePhoto(`${PHOTOS}..%2Frecordings%2Fr1.m4a`);
    deletePhoto(DATABASE);
    deletePhoto(`${PHOTOS}%2e%2e%2Frecordings%2Fr1.m4a`);
    deletePhoto(`${PHOTOS}%2e%2e%2Fr2.m4a`);
    deletePhoto(`${PHOTOS}%2e%2e%2F%2e%2e%2Fcache%2FImagePicker%2FIMG_0001.jpg`);

    expect(fakeFs.read(DATABASE)).toBe('DB');
    expect(fakeFs.read(`${RECORDINGS}r1.m4a`)).toBe('AUDIO');
    expect(fakeFs.read(`${DOC}/r2.m4a`)).toBe('R2');
    expect(fakeFs.read(PICKED)).toBe('CACHED');
  });

  it('names from step 7 and the older schemes pass the guard', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const accepted = [
      savePhoto(pick(0), UUID, 0),
      savePhoto(pick(1), 'rec_1700000000000', 1),
      `${RECORDINGS}rec_1700000000000.m4a`,
      `${RECORDINGS}${UUID}.m4a`,
      `${PHOTOS}${UUID}_2.jpg`,
      `${PHOTOS}rec_1700000000000_0.jpg`,
    ];

    expect(accepted.filter((uri) => !isAppMediaPath(uri))).toEqual([]);
  });

  it('on web, deleteRecordingFiles makes no file calls', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const spies = [
      jest.spyOn(File.prototype, 'validatePath'),
      jest.spyOn(Directory.prototype, 'validatePath'),
    ];
    const webRecording: Recording = {
      id: 'r1',
      beehiveId: 'bh1',
      locationId: 'loc1',
      userId: 'u1',
      audioUrl: '',
      localPath: 'blob:http://localhost:8081/a1',
      duration: 1,
      priority: Priority.LOW,
      solved: false,
      lastListenedAt: null,
      photos: ['blob:http://localhost:8081/a2'],
      createdAt: 1,
      updatedAt: 1,
    };

    deleteRecordingFiles(webRecording);

    spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it('on web, savePhoto returns the source URI without touching files', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const spies = [
      jest.spyOn(File.prototype, 'validatePath'),
      jest.spyOn(Directory.prototype, 'validatePath'),
    ];

    expect(savePhoto('blob:http://localhost:8081/1b2c', 'r1', 0)).toBe(
      'blob:http://localhost:8081/1b2c',
    );
    spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    expect(fakeFs.list()).toEqual([]);
  });
});
