import React, { act } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { DataProvider, useData } from '../contexts/DataContext';
import { Directory, File, fakeFs } from '../testUtils/fakeFileSystem';
import { Beehive, Location, Priority, Recording } from '../models/types';

const { create } = require('react-test-renderer') as {
  create: (el: React.ReactElement) => { unmount: () => void };
};

jest.mock('expo-file-system', () => require('../testUtils/fakeFileSystem'));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: jest.fn() } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `uuid-${++n}` };
});

const DOC = 'file:///data/user/0/app/files';
const PICKED = 'file:///data/user/0/app/cache/DocumentPicker/backup.buzznotes.json';
const KEYS = {
  locations: '@buzznotes/locations',
  beehives: '@buzznotes/beehives',
  recordings: '@buzznotes/recordings',
} as const;

type Stored = Record<keyof typeof KEYS, unknown[]>;

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

function recording(id: string, localPath: string, photos: string[]): Recording {
  return {
    id,
    beehiveId: 'bh1',
    locationId: 'loc1',
    userId: 'u1',
    audioUrl: '',
    localPath,
    duration: 30,
    priority: Priority.MEDIUM,
    solved: false,
    lastListenedAt: null,
    notes: '',
    photos,
    createdAt: 1000,
    updatedAt: 1000,
  };
}

const recA = recording('rec-a', `${DOC}/recordings/rec_1700000005000.m4a`, [
  `${DOC}/photos/rec_1700000005000_0.jpg`,
  `${DOC}/photos/rec-a_1.jpg`,
]);
const recB = recording('rec-b', `${DOC}/recordings/rec_1700000009000.m4a`, [
  `${DOC}/photos/rec_1700000009000_0.jpg`,
  `${DOC}/photos/rec-b_1.jpg`,
]);

const loc2: Location = { ...loc, id: 'loc2', name: 'Grobnik' };
const hive2: Beehive = { ...hive, id: 'bh2', name: 'Hive 2' };
const hive3: Beehive = { ...hive, id: 'bh3', name: 'Hive 3', locationId: 'loc2' };
const recC: Recording = {
  ...recording('rec-c', `${DOC}/recordings/rec_1700000011000.m4a`, [
    `${DOC}/photos/rec-c_1700000011100_0.jpg`,
  ]),
  beehiveId: 'bh2',
};
const recD: Recording = {
  ...recording('rec-d', `${DOC}/recordings/rec-d.m4a`, [`${DOC}/photos/rec-d_0.jpg`]),
  beehiveId: 'bh3',
  locationId: 'loc2',
};
// Its beehive is gone, as older builds left after a move; only its own locationId ties it to loc1.
const orphan: Recording = {
  ...recording('rec-o', `${DOC}/recordings/rec_1700000013000.m4a`, [
    `${DOC}/photos/rec_1700000013000_0.jpg`,
  ]),
  beehiveId: 'bh-gone',
};
const filesOf = (r: Recording) => [r.localPath, ...(r.photos ?? [])];

function backup(recordings: object[]): string {
  return JSON.stringify({
    version: 1,
    exportedAt: 1,
    locations: [loc],
    beehives: [hive],
    recordings,
  });
}

let data: ReturnType<typeof useData>;
let renderer: { unmount: () => void } | undefined;

// Hands useData() to a prop; assigning a module variable in render breaks react-hooks/globals.
function Probe({ onData }: { onData: (value: ReturnType<typeof useData>) => void }) {
  onData(useData());
  return null;
}

async function renderProvider() {
  await act(async () => {
    renderer = create(
      <DataProvider>
        <Probe onData={(value) => (data = value)} />
      </DataProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function renderCascade() {
  const all = [recA, recB, recC, recD, orphan];
  for (const uri of all.flatMap(filesOf)) fakeFs.seed(uri, uri);
  await seedStorage({ locations: [loc, loc2], beehives: [hive, hive2, hive3], recordings: all });
  await renderProvider();
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

// Seeds pretty-printed JSON, so a compact value read back later proves the provider wrote it.
async function seedStorage(stored: Stored) {
  await AsyncStorage.multiSet(
    (Object.keys(KEYS) as (keyof typeof KEYS)[]).map((name) => [
      KEYS[name],
      JSON.stringify(stored[name], null, 2),
    ]),
  );
}

async function expectStored(stored: Stored) {
  for (const name of Object.keys(KEYS) as (keyof typeof KEYS)[]) {
    expect(await AsyncStorage.getItem(KEYS[name])).toBe(JSON.stringify(stored[name]));
  }
}

beforeEach(async () => {
  fakeFs.reset();
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@buzznotes/userId', 'u1');
});

afterEach(() => {
  act(() => renderer?.unmount());
  renderer = undefined;
  jest.restoreAllMocks();
});

describe('DataProvider', () => {
  it('loads stored data and writes it back unchanged', async () => {
    const stored = { locations: [loc], beehives: [hive], recordings: [recA, recB] };
    await seedStorage(stored);

    await renderProvider();

    expect(data.loading).toBe(false);
    expect(data.locations).toEqual(stored.locations);
    expect(data.beehives).toEqual(stored.beehives);
    expect(data.recordings).toEqual(stored.recordings);
    await expectStored(stored);
  });

  it('round-trips old-shape records without adding or dropping fields', async () => {
    const oldRecording = {
      id: 'r0',
      beehiveId: 'bh1',
      locationId: 'loc1',
      userId: 'u1',
      audioUrl: '',
      localPath: `${DOC}/recordings/rec_1770500000000.m4a`,
      date: '08.02.2026',
      duration: 7,
      priority: 'LOW',
      solved: false,
      lastListenedAt: null,
      createdAt: 1770500000000,
      updatedAt: 1770500000000,
    };
    const stored = { locations: [loc], beehives: [hive], recordings: [oldRecording] };
    await seedStorage(stored);

    await renderProvider();

    expect(data.recordings).toStrictEqual([oldRecording]);
    await expectStored(stored);
  });

  it("deleting one recording leaves other recordings' files alone", async () => {
    const otherFiles = [recB.localPath, ...recB.photos!];
    for (const uri of [recA.localPath, ...recA.photos!, ...otherFiles]) fakeFs.seed(uri, uri);
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [recA, recB] });
    await renderProvider();

    await act(async () => {
      await data.deleteRecording('rec-a');
    });

    expect(data.recordings.map((r) => r.id)).toEqual(['rec-b']);
    for (const uri of otherFiles) expect(fakeFs.read(uri)).toBe(uri);
  });

  it('on web, deleteRecording makes no file-system calls', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const webA = recording('rec-a', 'blob:http://localhost:8081/a1', [
      'blob:http://localhost:8081/a2',
    ]);
    const webB = recording('rec-b', 'blob:http://localhost:8081/b1', []);
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [webA, webB] });
    await renderProvider();
    const spies = [
      jest.spyOn(File.prototype, 'validatePath'),
      jest.spyOn(Directory.prototype, 'validatePath'),
    ];

    await act(async () => {
      await data.deleteRecording('rec-a');
    });

    expect(data.recordings.map((r) => r.id)).toEqual(['rec-b']);
    spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it('deleting a record-flow recording removes its rec_<ts> audio and photos', async () => {
    const recFlow = recording(
      '6f1c2a4e-9b3d-4c7a-8e21-5d0f3b9a7c11',
      `${DOC}/recordings/rec_1700000007000.m4a`,
      [
        `${DOC}/photos/rec_1700000007000_1700000007100_0.jpg`,
        `${DOC}/photos/rec_1700000007000_1700000007100_1.jpg`,
      ],
    );
    const files = [recFlow.localPath, ...recFlow.photos!];
    const otherFiles = [recB.localPath, ...recB.photos!];
    for (const uri of [...files, ...otherFiles]) fakeFs.seed(uri, uri);
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [recFlow, recB] });
    await renderProvider();

    await act(async () => {
      await data.deleteRecording(recFlow.id);
    });

    for (const uri of files) expect(fakeFs.read(uri)).toBeUndefined();
    for (const uri of otherFiles) expect(fakeFs.read(uri)).toBe(uri);
  });

  it('a record with mixed naming schemes is fully deleted', async () => {
    const mixed = { ...recA, photos: [...recA.photos!, `${DOC}/photos/rec-a_1700000008000_2.jpg`] };
    for (const uri of [mixed.localPath, ...mixed.photos]) fakeFs.seed(uri, uri);
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [mixed] });
    await renderProvider();

    await act(async () => {
      await data.deleteRecording('rec-a');
    });

    expect(fakeFs.list()).toEqual([]);
  });

  it('files that are already missing do not cause a throw', async () => {
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [recA] });
    await renderProvider();

    await act(async () => {
      await data.deleteRecording('rec-a');
    });

    expect(data.recordings).toEqual([]);
  });

  it('a legacy record without photos is deleted cleanly', async () => {
    const legacy = {
      id: 'r0',
      beehiveId: 'bh1',
      locationId: 'loc1',
      userId: 'u1',
      audioUrl: '',
      localPath: `${DOC}/recordings/rec_1770500000000.m4a`,
      date: '08.02.2026',
      duration: 7,
      priority: 'LOW',
      solved: false,
      lastListenedAt: null,
      createdAt: 1770500000000,
      updatedAt: 1770500000000,
    };
    fakeFs.seed(legacy.localPath, 'AUDIO');
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [legacy] });
    await renderProvider();

    await act(async () => {
      await data.deleteRecording('r0');
    });

    expect(data.recordings).toEqual([]);
    expect(fakeFs.list()).toEqual([]);
  });

  it('an empty or undefined localPath causes no throw', async () => {
    const empty = recording('rec-e', '', []);
    const missing = { ...recording('rec-u', '', []), localPath: undefined };
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [empty, missing] });
    await renderProvider();

    await act(async () => {
      await data.deleteRecording('rec-e');
      await data.deleteRecording('rec-u');
    });

    expect(data.recordings).toEqual([]);
  });

  it('an unknown id makes no file calls', async () => {
    for (const uri of [recA.localPath, ...recA.photos!]) fakeFs.seed(uri, uri);
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [recA] });
    await renderProvider();
    const spies = [
      jest.spyOn(File.prototype, 'validatePath'),
      jest.spyOn(Directory.prototype, 'validatePath'),
    ];

    await act(async () => {
      await data.deleteRecording('nope');
    });

    spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    expect(data.recordings).toEqual([recA]);
  });

  it('a delete captured before a photo was added still deletes that photo', async () => {
    for (const uri of [recA.localPath, ...recA.photos!]) fakeFs.seed(uri, uri);
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [recA] });
    await renderProvider();
    const capturedDelete = data.deleteRecording;
    const added = `${DOC}/photos/rec-a_1700000009000_2.jpg`;
    fakeFs.seed(added, added);

    await act(async () => {
      await data.updateRecording('rec-a', { photos: [...recA.photos!, added] });
    });
    await act(async () => {
      await capturedDelete('rec-a');
    });

    expect(data.deleteRecording).toBe(capturedDelete);
    expect(fakeFs.list()).toEqual([]);
  });

  it('an import keeps the media of a newer local record', async () => {
    const local = { ...recA, updatedAt: 3000 };
    const localFiles = [local.localPath, ...local.photos!];
    for (const uri of localFiles) fakeFs.seed(uri, uri);
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [local] });
    await renderProvider();
    const older = { ...recA, audioBase64: 'QVVESU8=', photosBase64: ['UEhPVE8=', 'UEhPVE8='] };
    fakeFs.seed(PICKED, backup([older]));
    File.pickFileAsync.mockResolvedValueOnce(new File(PICKED));

    await act(async () => {
      await data.importAllData();
    });

    expect(data.recordings).toEqual([local]);
    expect(fakeFs.list(DOC)).toEqual([...localFiles].sort());
    for (const uri of localFiles) expect(fakeFs.read(uri)).toBe(uri);
  });

  it('after an import, deleting the record leaves no file', async () => {
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [] });
    await renderProvider();
    const incoming = { ...recB, audioBase64: 'QVVESU8=', photosBase64: ['UEhPVE8=', 'UEhPVE8='] };
    fakeFs.seed(PICKED, backup([incoming]));
    File.pickFileAsync.mockResolvedValueOnce(new File(PICKED));

    await act(async () => {
      await data.importAllData();
    });
    expect(fakeFs.list(DOC)).toHaveLength(3);
    await act(async () => {
      await data.deleteRecording('rec-b');
    });

    expect(fakeFs.list(DOC)).toEqual([]);
  });

  it('cancelling the import picker shows no toast and resets syncing', async () => {
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [recA] });
    await renderProvider();
    jest.mocked(Toast.show).mockClear();
    File.pickFileAsync.mockRejectedValueOnce(
      Object.assign(new Error('The file picker was cancelled by the user'), {
        code: 'ERR_PICKER_CANCELLED',
      }),
    );

    await act(async () => {
      await data.importAllData();
    });

    expect(Toast.show).not.toHaveBeenCalled();
    expect(data.syncing).toBe(false);
    expect(data.recordings).toEqual([recA]);
  });

  it('any other picker rejection still shows importError', async () => {
    await seedStorage({ locations: [loc], beehives: [hive], recordings: [recA] });
    await renderProvider();
    jest.mocked(Toast.show).mockClear();
    File.pickFileAsync.mockRejectedValueOnce(
      Object.assign(new Error('No activity'), { code: 'ERR_MISSING_ACTIVITY' }),
    );

    await act(async () => {
      await data.importAllData();
    });

    expect(jest.mocked(Toast.show).mock.calls.map(([options]) => options.text1)).toEqual([
      'common.importError',
    ]);
    expect(data.syncing).toBe(false);
  });

  it('a cascade deletes exactly the files of the recordings the reducer drops', async () => {
    await renderCascade();

    await act(async () => {
      await data.deleteBeehive('bh2');
    });
    expect(data.recordings.map((r) => r.id)).toEqual(['rec-a', 'rec-b', 'rec-d', 'rec-o']);
    expect(fakeFs.list(DOC)).toEqual(data.recordings.flatMap(filesOf).sort());

    await act(async () => {
      await data.deleteLocation('loc1');
    });
    expect(data.recordings.map((r) => r.id)).toEqual(['rec-d']);
    expect(fakeFs.list(DOC)).toEqual(data.recordings.flatMap(filesOf).sort());
  });

  it("deleting a location leaves another location's files", async () => {
    await renderCascade();

    await act(async () => {
      await data.deleteLocation('loc1');
    });

    for (const uri of filesOf(recD)) expect(fakeFs.read(uri)).toBe(uri);
  });

  it("after a move, deleting the old location keeps the moved beehive's files", async () => {
    await renderCascade();

    await act(async () => {
      await data.updateBeehive('bh1', { locationId: 'loc2' });
    });
    await act(async () => {
      await data.deleteLocation('loc1');
    });

    expect(fakeFs.list(DOC)).toEqual([recA, recB, recD].flatMap(filesOf).sort());
  });

  it('deleting a location with no recordings makes no file calls', async () => {
    const empty: Location = { ...loc, id: 'loc3', name: 'Prazna' };
    await seedStorage({ locations: [loc, empty], beehives: [hive], recordings: [recA] });
    await renderProvider();
    const spies = [
      jest.spyOn(File.prototype, 'validatePath'),
      jest.spyOn(Directory.prototype, 'validatePath'),
    ];

    await act(async () => {
      await data.deleteLocation('loc3');
    });

    spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it('one bad path does not stop the rest of a cascade', async () => {
    await renderCascade();
    const failing = recA.photos![0];
    const realDelete = File.prototype.delete;
    jest.spyOn(File.prototype, 'delete').mockImplementation(function (this: File) {
      if (this.uri === failing) throw new Error('EIO');
      realDelete.call(this);
    });

    await act(async () => {
      await data.deleteBeehive('bh1');
    });

    expect(fakeFs.list(DOC)).toEqual([failing, ...[recC, recD, orphan].flatMap(filesOf)].sort());
  });

  it("a moved beehive's recordings are saved aligned", async () => {
    const loc2: Location = { ...loc, id: 'loc2', name: 'Grobnik' };
    await seedStorage({ locations: [loc, loc2], beehives: [hive], recordings: [recA, recB] });
    await renderProvider();

    await act(async () => {
      await data.updateBeehive('bh1', { locationId: 'loc2' });
    });
    await settle();

    const saved: Recording[] = JSON.parse((await AsyncStorage.getItem(KEYS.recordings))!);
    expect(saved).toEqual([recA, recB].map((r) => ({ ...r, locationId: 'loc2' })));
  });

  it('stale stored data is repaired on load and written back', async () => {
    const loc2: Location = { ...loc, id: 'loc2', name: 'Grobnik' };
    const movedHive: Beehive = { ...hive, locationId: 'loc2' };
    await seedStorage({ locations: [loc, loc2], beehives: [movedHive], recordings: [recA, recB] });

    await renderProvider();

    const repaired = [recA, recB].map((r) => ({ ...r, locationId: 'loc2' }));
    expect(data.recordings).toEqual(repaired);
    expect(await AsyncStorage.getItem(KEYS.recordings)).toBe(JSON.stringify(repaired));
  });
});
