import { dataReducer, DataState, DataAction } from '../contexts/DataContext';
import { Priority, Location, Beehive, Recording } from '../models/types';

jest.mock('../i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

const emptyState: DataState = {
  locations: [],
  beehives: [],
  recordings: [],
  loading: false,
  syncing: false,
};

const loc1: Location = {
  id: 'loc1',
  name: 'Apiary 1',
  userId: 'u1',
  createdAt: 1000,
  updatedAt: 1000,
};

const bh1: Beehive = {
  id: 'bh1',
  name: 'Hive 1',
  locationId: 'loc1',
  userId: 'u1',
  createdAt: 1000,
  updatedAt: 1000,
};

const rec1: Recording = {
  id: 'rec1',
  beehiveId: 'bh1',
  locationId: 'loc1',
  userId: 'u1',
  audioUrl: '',
  localPath: '/path/rec1.m4a',
  duration: 60,
  priority: Priority.MEDIUM,
  solved: false,
  lastListenedAt: null,
  createdAt: 1000,
  updatedAt: 1000,
};

describe('dataReducer', () => {
  it('SET_LOADING', () => {
    const state = dataReducer(emptyState, { type: 'SET_LOADING', loading: true });
    expect(state.loading).toBe(true);
  });

  it('SET_SYNCING', () => {
    const state = dataReducer(emptyState, { type: 'SET_SYNCING', syncing: true });
    expect(state.syncing).toBe(true);
  });

  it('SET_ALL replaces data and sets loading false', () => {
    const loadingState = { ...emptyState, loading: true };
    const state = dataReducer(loadingState, {
      type: 'SET_ALL',
      locations: [loc1],
      beehives: [bh1],
      recordings: [rec1],
    });
    expect(state.locations).toEqual([loc1]);
    expect(state.beehives).toEqual([bh1]);
    expect(state.recordings).toEqual([rec1]);
    expect(state.loading).toBe(false);
  });

  // --- Locations ---
  it('ADD_LOCATION appends', () => {
    const state = dataReducer(emptyState, { type: 'ADD_LOCATION', location: loc1 });
    expect(state.locations).toHaveLength(1);
    expect(state.locations[0]).toBe(loc1);
  });

  it('UPDATE_LOCATION merges partial data', () => {
    const initial = { ...emptyState, locations: [loc1] };
    const state = dataReducer(initial, {
      type: 'UPDATE_LOCATION',
      id: 'loc1',
      data: { name: 'Renamed' },
    });
    expect(state.locations[0].name).toBe('Renamed');
    expect(state.locations[0].id).toBe('loc1');
  });

  it('DELETE_LOCATION cascades to beehives and recordings', () => {
    const initial: DataState = {
      ...emptyState,
      locations: [loc1],
      beehives: [bh1],
      recordings: [rec1],
    };
    const state = dataReducer(initial, { type: 'DELETE_LOCATION', id: 'loc1' });
    expect(state.locations).toHaveLength(0);
    expect(state.beehives).toHaveLength(0);
    expect(state.recordings).toHaveLength(0);
  });

  it('DELETE_LOCATION does not remove unrelated items', () => {
    const otherBh: Beehive = { ...bh1, id: 'bh2', locationId: 'loc2' };
    const otherRec: Recording = { ...rec1, id: 'rec2', locationId: 'loc2' };
    const initial: DataState = {
      ...emptyState,
      locations: [loc1],
      beehives: [bh1, otherBh],
      recordings: [rec1, otherRec],
    };
    const state = dataReducer(initial, { type: 'DELETE_LOCATION', id: 'loc1' });
    expect(state.beehives).toEqual([otherBh]);
    expect(state.recordings).toEqual([otherRec]);
  });

  // --- Beehives ---
  it('ADD_BEEHIVE appends', () => {
    const state = dataReducer(emptyState, { type: 'ADD_BEEHIVE', beehive: bh1 });
    expect(state.beehives).toHaveLength(1);
  });

  it('UPDATE_BEEHIVE merges partial data', () => {
    const initial = { ...emptyState, beehives: [bh1] };
    const state = dataReducer(initial, {
      type: 'UPDATE_BEEHIVE',
      id: 'bh1',
      data: { name: 'Renamed Hive' },
    });
    expect(state.beehives[0].name).toBe('Renamed Hive');
  });

  it('DELETE_BEEHIVE cascades to recordings', () => {
    const initial: DataState = {
      ...emptyState,
      beehives: [bh1],
      recordings: [rec1],
    };
    const state = dataReducer(initial, { type: 'DELETE_BEEHIVE', id: 'bh1' });
    expect(state.beehives).toHaveLength(0);
    expect(state.recordings).toHaveLength(0);
  });

  // --- Recordings ---
  it('ADD_RECORDING appends', () => {
    const state = dataReducer(emptyState, { type: 'ADD_RECORDING', recording: rec1 });
    expect(state.recordings).toHaveLength(1);
  });

  it('UPDATE_RECORDING merges partial data', () => {
    const initial = { ...emptyState, recordings: [rec1] };
    const state = dataReducer(initial, {
      type: 'UPDATE_RECORDING',
      id: 'rec1',
      data: { solved: true, notes: 'Queen spotted' },
    });
    expect(state.recordings[0].solved).toBe(true);
    expect(state.recordings[0].notes).toBe('Queen spotted');
    expect(state.recordings[0].duration).toBe(60); // unchanged
  });

  it('DELETE_RECORDING removes only the target', () => {
    const rec2 = { ...rec1, id: 'rec2' };
    const initial = { ...emptyState, recordings: [rec1, rec2] };
    const state = dataReducer(initial, { type: 'DELETE_RECORDING', id: 'rec1' });
    expect(state.recordings).toEqual([rec2]);
  });

  it('unknown action returns same state', () => {
    const state = dataReducer(emptyState, { type: 'UNKNOWN' } as unknown as DataAction);
    expect(state).toBe(emptyState);
  });
});

describe('dataReducer: beehive moves and location repair', () => {
  const loc2: Location = { ...loc1, id: 'loc2', name: 'Apiary 2' };
  const bh2: Beehive = { ...bh1, id: 'bh2', name: 'Hive 2' };
  const recA: Recording = { ...rec1, id: 'recA' };
  const recSolved: Recording = { ...rec1, id: 'recSolved', solved: true };
  const recOther: Recording = { ...rec1, id: 'recOther', beehiveId: 'bh2' };
  const state: DataState = {
    ...emptyState,
    locations: [loc1, loc2],
    beehives: [bh1, bh2],
    recordings: [recA, recSolved, recOther],
  };
  const move = (s: DataState) =>
    dataReducer(s, {
      type: 'UPDATE_BEEHIVE',
      id: 'bh1',
      data: { locationId: 'loc2', updatedAt: 5000 },
    });

  it("a move carries only that beehive's recordings, solved ones included, with updatedAt unchanged", () => {
    const moved = move(state);

    expect(moved.beehives[0]).toEqual({ ...bh1, locationId: 'loc2', updatedAt: 5000 });
    expect(moved.recordings).toEqual([
      { ...recA, locationId: 'loc2' },
      { ...recSolved, locationId: 'loc2' },
      recOther,
    ]);
    expect(moved.recordings[2]).toBe(recOther);
  });

  it('a rename keeps the recordings by reference', () => {
    const renamed = dataReducer(state, {
      type: 'UPDATE_BEEHIVE',
      id: 'bh1',
      data: { name: 'Renamed', updatedAt: 5000 },
    });

    expect(renamed.recordings).toBe(state.recordings);
  });

  it('after a move, deleting the old location keeps the beehive and its recordings, and deleting the new one removes both', () => {
    const moved = move(state);

    const oldDeleted = dataReducer(moved, { type: 'DELETE_LOCATION', id: 'loc1' });
    expect(oldDeleted.beehives.map((b) => b.id)).toEqual(['bh1']);
    expect(oldDeleted.recordings.map((r) => r.id)).toEqual(['recA', 'recSolved']);

    const newDeleted = dataReducer(moved, { type: 'DELETE_LOCATION', id: 'loc2' });
    expect(newDeleted.beehives.map((b) => b.id)).toEqual(['bh2']);
    expect(newDeleted.recordings.map((r) => r.id)).toEqual(['recOther']);
  });

  it('SET_ALL realigns a stale recording, keeps aligned and orphan recordings by reference, keeps their order and is idempotent', () => {
    const movedHive: Beehive = { ...bh1, locationId: 'loc2' };
    const stale: Recording = { ...rec1, id: 'stale' };
    const aligned: Recording = { ...rec1, id: 'aligned', beehiveId: 'bh2' };
    const orphan: Recording = { ...rec1, id: 'orphan', beehiveId: 'gone' };
    const setAll = (recordings: Recording[]) =>
      dataReducer(emptyState, {
        type: 'SET_ALL',
        locations: [loc1, loc2],
        beehives: [movedHive, bh2],
        recordings,
      });

    const once = setAll([orphan, stale, aligned]);
    expect(once.recordings).toEqual([orphan, { ...stale, locationId: 'loc2' }, aligned]);
    expect(once.recordings[0]).toBe(orphan);
    expect(once.recordings[2]).toBe(aligned);

    const twice = setAll(once.recordings);
    twice.recordings.forEach((r, i) => expect(r).toBe(once.recordings[i]));
  });

  it('the repair followed by deleting the old location keeps the recordings', () => {
    const movedHive: Beehive = { ...bh1, locationId: 'loc2' };
    const repaired = dataReducer(emptyState, {
      type: 'SET_ALL',
      locations: [loc1, loc2],
      beehives: [movedHive],
      recordings: [rec1],
    });

    const deleted = dataReducer(repaired, { type: 'DELETE_LOCATION', id: 'loc1' });

    expect(deleted.beehives).toEqual([movedHive]);
    expect(deleted.recordings).toEqual([{ ...rec1, locationId: 'loc2' }]);
  });
});
