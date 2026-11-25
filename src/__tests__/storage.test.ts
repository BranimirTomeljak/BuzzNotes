import { saveRecordingLocally } from '../services/storage';
import { fakeFs } from '../testUtils/fakeFileSystem';

jest.mock('expo-file-system', () => require('../testUtils/fakeFileSystem'));

const RECORDED = 'file:///data/user/0/app/cache/Audio/recording-1.m4a';

beforeEach(() => {
  fakeFs.reset();
});

describe('saveRecordingLocally', () => {
  it('has copied the recording into documents/recordings when it resolves', async () => {
    fakeFs.seed(RECORDED, 'AUDIO');

    const uri = await saveRecordingLocally(RECORDED, 'rec_1700000000000');

    expect(uri).toBe('file:///data/user/0/app/files/recordings/rec_1700000000000.m4a');
    expect(fakeFs.read(uri)).toBe('AUDIO');
  });
});
