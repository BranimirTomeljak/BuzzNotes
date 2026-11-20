import React, { act } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataProvider, useData } from '../contexts/DataContext';
import { Directory, File, fakeFs } from '../testUtils/fakeFileSystem';
import { Beehive, Location, Priority, Recording } from '../models/types';

const { create } = require('react-test-renderer') as {
  create: (el: React.ReactElement) => { unmount: () => void };
};

jest.mock('expo-file-system', () => require('../testUtils/fakeFileSystem'));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: jest.fn() } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `uuid-${++n}` };
});

const DOC = 'file:///data/user/0/app/files';
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

let data: ReturnType<typeof useData>;
let renderer: { unmount: () => void } | undefined;

function Probe() {
  data = useData();
  return null;
}

async function renderProvider() {
  await act(async () => {
    renderer = create(
      <DataProvider>
        <Probe />
      </DataProvider>,
    );
  });
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
});
