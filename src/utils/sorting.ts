import { Priority, Recording } from '../models/types';

/**
 * Natural numeric sort comparator.
 * Sorts "1", "2", "10" correctly instead of "1", "10", "2".
 */
export function naturalSort(a: string, b: string): number {
  const regex = /(\d+)|(\D+)/g;
  const aParts = a.match(regex) || [];
  const bParts = b.match(regex) || [];

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || '';
    const bPart = bParts[i] || '';

    const aNum = parseInt(aPart, 10);
    const bNum = parseInt(bPart, 10);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
    } else {
      const cmp = aPart.localeCompare(bPart);
      if (cmp !== 0) return cmp;
    }
  }

  return 0;
}

const PRIORITY_ORDER: Record<Priority, number> = {
  [Priority.HIGH]: 0,
  [Priority.MEDIUM]: 1,
  [Priority.LOW]: 2,
};

/**
 * Sort recordings for the Priority tab:
 * - Unsolved first, then solved
 * - Within each group: HIGH → MEDIUM → LOW
 * - Within same priority: oldest first (by createdAt)
 */
export function sortByPriority(recordings: Recording[]): Recording[] {
  return [...recordings].sort((a, b) => {
    // Unsolved first
    if (a.solved !== b.solved) {
      return a.solved ? 1 : -1;
    }
    // Then by priority
    const priDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priDiff !== 0) return priDiff;
    // Then by date (oldest first for priority view)
    return a.createdAt - b.createdAt;
  });
}

/**
 * Sort recordings by date, newest first.
 */
export function sortByRecent(recordings: Recording[]): Recording[] {
  return [...recordings].sort((a, b) => {
    // Unsolved first
    if (a.solved !== b.solved) {
      return a.solved ? 1 : -1;
    }
    return b.createdAt - a.createdAt;
  });
}
