import React, { act } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { DataProvider, useData } from '../contexts/DataContext';
import { importData } from '../services/exportImport';
import { Beehive, Location, Priority, Recording } from '../models/types';

const { create } = require('react-test-renderer') as {
  create: (el: React.ReactElement) => { unmount: () => void };
};

jest.mock('../i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('../services/exportImport');
jest.mock('../services/photoStorage');
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: jest.fn() } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `uuid-${++n}` };
});

const USER_ID_KEY = '@buzznotes/userId';
const KEYS = ['@buzznotes/locations', '@buzznotes/beehives', '@buzznotes/recordings'];
const storage = jest.mocked(AsyncStorage);
const realGetItem = storage.getItem.getMockImplementation()!;
const realMultiSet = storage.multiSet.getMockImplementation()!;

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
  id: 'rec1',
  beehiveId: 'bh1',
  locationId: 'loc1',
  userId: 'u1',
  audioUrl: '',
  localPath: 'file:///data/user/0/app/files/recordings/rec1.m4a',
  duration: 30,
  priority: Priority.MEDIUM,
  solved: false,
  lastListenedAt: null,
  createdAt: 1000,
  updatedAt: 1000,
};

// Pretty-printed, so a compact value read back later proves the provider rewrote it.
const SEEDED = [[loc], [hive], [rec]].map((slice) => JSON.stringify(slice, null, 2));

const loadErrorToast = { type: 'error', text1: 'common.loadError', visibilityTime: 6000 };
const saveErrorToast = { type: 'error', text1: 'common.saveError', visibilityTime: 3000 };

let data: ReturnType<typeof useData>;
let renderer: { unmount: () => void } | undefined;

function Probe() {
  data = useData();
  return null;
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function renderProvider() {
  await act(async () => {
    renderer = create(
      <DataProvider>
        <Probe />
      </DataProvider>,
    );
  });
  await settle();
}

async function run(call: () => Promise<unknown>) {
  await act(async () => {
    await call();
  });
  await settle();
}

async function seedData() {
  await AsyncStorage.multiSet(KEYS.map((key, i): [string, string] => [key, SEEDED[i]]));
}

function failRead(key: string) {
  storage.getItem.mockImplementation(async (k: string) => {
    if (k === key) throw new Error('read failed');
    return realGetItem(k);
  });
}

async function stored(): Promise<(string | null)[]> {
  return (await AsyncStorage.multiGet(KEYS)).map(([, value]) => value);
}

async function expectNothingWritten(expected: (string | null)[] = SEEDED) {
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(storage.multiSet).not.toHaveBeenCalled();
  expect(await stored()).toEqual(expected);
}

const toasts = () => jest.mocked(Toast.show).mock.calls.map(([options]) => options);

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(USER_ID_KEY, 'u1');
  await seedData();
  jest.clearAllMocks();
});

afterEach(() => {
  act(() => renderer?.unmount());
  renderer = undefined;
  storage.getItem.mockImplementation(realGetItem);
  storage.multiSet.mockImplementation(realMultiSet);
});

describe('DataProvider persistence', () => {
  it('a rejected getItem writes nothing and shows loadError', async () => {
    failRead('@buzznotes/beehives');

    await renderProvider();

    expect(data.loading).toBe(true);
    expect(toasts()).toEqual([loadErrorToast]);
    await expectNothingWritten();
  });

  it('corrupt JSON in one key overwrites nothing', async () => {
    await AsyncStorage.setItem('@buzznotes/recordings', '[{"id":"rec1",');
    jest.clearAllMocks();

    await renderProvider();

    expect(data.loading).toBe(true);
    expect(toasts()).toEqual([loadErrorToast]);
    await expectNothingWritten([SEEDED[0], SEEDED[1], '[{"id":"rec1",']);
  });

  it('a rejected user-id read writes nothing and shows loadError', async () => {
    failRead(USER_ID_KEY);

    await renderProvider();

    expect(data.loading).toBe(true);
    expect(toasts()).toEqual([loadErrorToast]);
    await expectNothingWritten();
  });

  it('an edit while stuck writes nothing and shows the toast again', async () => {
    failRead('@buzznotes/beehives');
    await renderProvider();

    await run(() => data.addLocation('Novo'));

    expect(toasts()).toEqual([loadErrorToast, loadErrorToast]);
    await expectNothingWritten();
  });

  it('import while stuck is blocked and storage is unchanged', async () => {
    failRead('@buzznotes/beehives');
    await renderProvider();

    await run(() => data.importAllData());

    expect(importData).not.toHaveBeenCalled();
    expect(data.syncing).toBe(false);
    expect(toasts()).toEqual([loadErrorToast, loadErrorToast]);
    await expectNothingWritten();
  });

  it('a failed refresh keeps state, writes nothing and shows one toast', async () => {
    await renderProvider();
    jest.clearAllMocks();
    failRead('@buzznotes/beehives');

    await run(() => data.refreshData());

    expect(data.locations).toEqual([loc]);
    expect(data.beehives).toEqual([hive]);
    expect(data.recordings).toEqual([rec]);
    expect(data.syncing).toBe(false);
    expect(toasts()).toEqual([loadErrorToast]);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.multiSet).not.toHaveBeenCalled();
  });

  it('a later successful refresh recovers, and the next edit writes', async () => {
    failRead('@buzznotes/beehives');
    await renderProvider();
    storage.getItem.mockImplementation(realGetItem);

    await run(() => data.refreshData());

    expect(data.loading).toBe(false);
    expect(data.beehives).toEqual([hive]);

    await run(() => data.addLocation('Novo'));

    const [locations, beehives, recordings] = await stored();
    expect(JSON.parse(locations!).map((l: Location) => l.name)).toEqual(['Kuljani', 'Novo']);
    expect(beehives).toBe(JSON.stringify([hive]));
    expect(recordings).toBe(JSON.stringify([rec]));
    expect(toasts()).toEqual([loadErrorToast]);
  });

  it('a refresh after a failed user-id read also restores the user id', async () => {
    failRead(USER_ID_KEY);
    await renderProvider();
    storage.getItem.mockImplementation(realGetItem);

    await run(() => data.refreshData());
    await run(() => data.addLocation('Novo'));

    expect(data.loading).toBe(false);
    expect(data.locations.find((l) => l.name === 'Novo')?.userId).toBe('u1');
  });

  // jest-circus fails a test that leaves an unhandled rejection, so passing proves there is none.
  it('a rejected multiSet shows saveError once with no unhandled rejection', async () => {
    await renderProvider();
    jest.clearAllMocks();
    storage.multiSet.mockImplementation(async () => {
      throw new Error('disk full');
    });

    await run(() => data.updateLocation('loc1', { name: 'Kuljani 2' }));

    expect(toasts()).toEqual([saveErrorToast]);
  });

  it('an edit writes all three keys in one multiSet call', async () => {
    await renderProvider();
    jest.clearAllMocks();

    await run(() => data.updateLocation('loc1', { name: 'Kuljani 2' }));

    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.multiSet).toHaveBeenCalledTimes(1);
    expect(storage.multiSet.mock.calls[0][0].map(([key]) => key)).toEqual(KEYS);
  });

  it('notes of 1,000,000 č characters are rejected, show saveError and write nothing', async () => {
    await renderProvider();
    const before = await stored();
    jest.clearAllMocks();

    await run(() => data.updateRecording('rec1', { notes: 'č'.repeat(1_000_000) }));

    expect(toasts()).toEqual([saveErrorToast]);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.multiSet).not.toHaveBeenCalled();
    expect(await stored()).toEqual(before);
  });

  it('notes of 1,000,000 ASCII characters are saved', async () => {
    await renderProvider();
    jest.clearAllMocks();

    await run(() => data.updateRecording('rec1', { notes: 'a'.repeat(1_000_000) }));

    const [, , recordings] = await stored();
    expect(JSON.parse(recordings!)[0].notes).toHaveLength(1_000_000);
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('a normal edit writes all keys and shows no toast', async () => {
    await renderProvider();
    await seedData();
    jest.clearAllMocks();

    await run(() => data.updateLocation('loc1', { name: 'Kuljani 2' }));

    const [locations, beehives, recordings] = await stored();
    expect(JSON.parse(locations!)).toEqual([
      { ...loc, name: 'Kuljani 2', updatedAt: expect.any(Number) },
    ]);
    expect(beehives).toBe(JSON.stringify([hive]));
    expect(recordings).toBe(JSON.stringify([rec]));
    expect(Toast.show).not.toHaveBeenCalled();
  });
});
