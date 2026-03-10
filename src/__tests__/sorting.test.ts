import { naturalSort, sortByPriority, sortByRecent } from '../utils/sorting';
import { Priority, Recording } from '../models/types';

describe('naturalSort', () => {
  it('sorts pure strings alphabetically', () => {
    const items = ['Banana', 'Apple', 'Cherry'];
    expect(items.sort(naturalSort)).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('sorts numeric strings numerically', () => {
    const items = ['10', '2', '1', '20', '3'];
    expect(items.sort(naturalSort)).toEqual(['1', '2', '3', '10', '20']);
  });

  it('sorts mixed prefix + number correctly', () => {
    const items = ['Beehive 10', 'Beehive 2', 'Beehive 1'];
    expect(items.sort(naturalSort)).toEqual(['Beehive 1', 'Beehive 2', 'Beehive 10']);
  });

  it('handles equal strings', () => {
    expect(naturalSort('abc', 'abc')).toBe(0);
  });

  it('handles empty strings', () => {
    const items = ['b', '', 'a'];
    expect(items.sort(naturalSort)).toEqual(['', 'a', 'b']);
  });
});

function makeRecording(overrides: Partial<Recording>): Recording {
  return {
    id: 'r1',
    beehiveId: 'b1',
    locationId: 'l1',
    userId: 'u1',
    audioUrl: '',
    localPath: '',
    duration: 60,
    priority: Priority.MEDIUM,
    solved: false,
    lastListenedAt: null,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe('sortByPriority', () => {
  it('puts unsolved before solved', () => {
    const recs = [
      makeRecording({ id: 'solved', solved: true }),
      makeRecording({ id: 'unsolved', solved: false }),
    ];
    const sorted = sortByPriority(recs);
    expect(sorted[0].id).toBe('unsolved');
    expect(sorted[1].id).toBe('solved');
  });

  it('sorts by priority within unsolved (HIGH > MEDIUM > LOW)', () => {
    const recs = [
      makeRecording({ id: 'low', priority: Priority.LOW }),
      makeRecording({ id: 'high', priority: Priority.HIGH }),
      makeRecording({ id: 'medium', priority: Priority.MEDIUM }),
    ];
    const sorted = sortByPriority(recs);
    expect(sorted.map((r) => r.id)).toEqual(['high', 'medium', 'low']);
  });

  it('sorts by date (oldest first) within same priority', () => {
    const recs = [
      makeRecording({ id: 'newer', priority: Priority.HIGH, createdAt: 2000 }),
      makeRecording({ id: 'older', priority: Priority.HIGH, createdAt: 1000 }),
    ];
    const sorted = sortByPriority(recs);
    expect(sorted.map((r) => r.id)).toEqual(['older', 'newer']);
  });

  it('does not mutate original array', () => {
    const recs = [makeRecording({ id: 'a' }), makeRecording({ id: 'b' })];
    const original = [...recs];
    sortByPriority(recs);
    expect(recs).toEqual(original);
  });
});

describe('sortByRecent', () => {
  it('puts unsolved before solved', () => {
    const recs = [
      makeRecording({ id: 'solved', solved: true, createdAt: 3000 }),
      makeRecording({ id: 'unsolved', solved: false, createdAt: 1000 }),
    ];
    const sorted = sortByRecent(recs);
    expect(sorted[0].id).toBe('unsolved');
  });

  it('sorts by date newest first within unsolved', () => {
    const recs = [
      makeRecording({ id: 'old', createdAt: 1000 }),
      makeRecording({ id: 'new', createdAt: 3000 }),
      makeRecording({ id: 'mid', createdAt: 2000 }),
    ];
    const sorted = sortByRecent(recs);
    expect(sorted.map((r) => r.id)).toEqual(['new', 'mid', 'old']);
  });

  it('does not mutate original array', () => {
    const recs = [makeRecording({ id: 'a' }), makeRecording({ id: 'b' })];
    const original = [...recs];
    sortByRecent(recs);
    expect(recs).toEqual(original);
  });
});
