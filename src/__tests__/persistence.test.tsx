import React, { act, useLayoutEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { DataProvider, useData } from '../contexts/DataContext';
import { exportData, importData } from '../services/exportImport';
import { Beehive, Location, Priority, Recording } from '../models/types';

const { create } = require('react-test-renderer') as {
  create: (el: React.ReactElement) => {
    unmount: () => void;
    update: (el: React.ReactElement) => void;
  };
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
const storageFullToast = { type: 'error', text1: 'common.storageFull', visibilityTime: 6000 };

let data: ReturnType<typeof useData>;
let renderer: ReturnType<typeof create> | undefined;

// Hands useData() to a prop; assigning a module variable in render breaks react-hooks/globals.
function Probe({ onData }: { onData: (value: ReturnType<typeof useData>) => void }) {
  onData(useData());
  return null;
}

// Like a screen's add handler on Fabric: the tap's dispatch commits at once, then it shows a toast.
function AddLocationLikeScreen() {
  const { addLocation } = useData();
  useLayoutEffect(() => {
    (async () => {
      await addLocation('Novo');
      Toast.show({ type: 'success', text1: 'common.success' });
    })();
  }, [addLocation]);
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
        <Probe onData={(value) => (data = value)} />
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

  it("while stuck, the warning lands after a screen's own success toast", async () => {
    failRead('@buzznotes/beehives');
    await renderProvider();

    await act(async () => {
      renderer!.update(
        <DataProvider>
          <Probe onData={(value) => (data = value)} />
          <AddLocationLikeScreen />
        </DataProvider>,
      );
    });
    await settle();

    expect(data.locations.map((l) => l.name)).toEqual(['Novo']);
    expect(toasts().at(-1)).toEqual(loadErrorToast);
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

  it('export while stuck is blocked, so no empty backup is made', async () => {
    failRead('@buzznotes/beehives');
    await renderProvider();

    await run(() => data.exportAllData());

    expect(exportData).not.toHaveBeenCalled();
    expect(data.syncing).toBe(false);
    expect(toasts()).toEqual([loadErrorToast, loadErrorToast]);
  });

  it('after a recovered load, export runs with the loaded data', async () => {
    failRead('@buzznotes/beehives');
    await renderProvider();
    storage.getItem.mockImplementation(realGetItem);
    await run(() => data.refreshData());

    await run(() => data.exportAllData());

    expect(exportData).toHaveBeenCalledWith([loc], [hive], [rec]);
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

  it('a refresh that fails to read the user id again stays stuck and writes nothing', async () => {
    failRead(USER_ID_KEY);
    await renderProvider();

    await run(() => data.refreshData());

    expect(data.loading).toBe(true);
    expect(toasts()).toEqual([loadErrorToast, loadErrorToast]);
    await expectNothingWritten();
  });

  it('a refresh during the first load does not read the user id a second time', async () => {
    let release!: () => void;
    const userIdRead = new Promise<void>((resolve) => {
      release = resolve;
    });
    storage.getItem.mockImplementation(async (k: string) => {
      if (k === USER_ID_KEY) await userIdRead;
      return realGetItem(k);
    });
    await renderProvider();

    let refresh!: Promise<void>;
    await act(async () => {
      refresh = data.refreshData();
    });
    release();
    await run(() => refresh);

    expect(storage.getItem.mock.calls.filter(([key]) => key === USER_ID_KEY)).toHaveLength(1);
    expect(data.loading).toBe(false);
    expect(Toast.show).not.toHaveBeenCalled();
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

  it('notes of 1,000,000 č characters are rejected, say storage is full and write nothing', async () => {
    await renderProvider();
    const before = await stored();
    jest.clearAllMocks();

    await run(() => data.updateRecording('rec1', { notes: 'č'.repeat(1_000_000) }));

    expect(toasts()).toEqual([storageFullToast]);
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
