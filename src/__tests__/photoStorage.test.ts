import { Platform } from 'react-native';
import { deletePhoto, savePhoto } from '../services/photoStorage';
import { Directory, File, fakeFs } from '../testUtils/fakeFileSystem';

jest.mock('expo-file-system', () => require('../testUtils/fakeFileSystem'));

const PHOTOS = 'file:///data/user/0/app/files/photos/';
const PICKED = 'file:///data/user/0/app/cache/ImagePicker/IMG_0001.jpg';

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
