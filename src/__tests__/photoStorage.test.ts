import { Platform } from 'react-native';
import { deletePhoto, savePhoto } from '../services/photoStorage';
import { Directory, File, fakeFs } from '../testUtils/fakeFileSystem';

jest.mock('expo-file-system', () => require('../testUtils/fakeFileSystem'));

const PHOTOS = 'file:///data/user/0/app/files/photos/';
const PICKED = 'file:///data/user/0/app/cache/ImagePicker/IMG_0001.jpg';

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
