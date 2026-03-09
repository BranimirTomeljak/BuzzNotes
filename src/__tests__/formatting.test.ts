import { formatDate, formatDateTime, formatDuration } from '../utils/formatting';

describe('formatDate', () => {
  it('formats timestamp to dd.mm.yyyy', () => {
    // 2024-01-15 in UTC
    const ts = new Date(2024, 0, 15).getTime();
    expect(formatDate(ts)).toBe('15.01.2024');
  });

  it('pads single-digit day and month', () => {
    const ts = new Date(2024, 2, 5).getTime();
    expect(formatDate(ts)).toBe('05.03.2024');
  });
});

describe('formatDateTime', () => {
  it('formats timestamp to dd.mm.yyyy HH:mm', () => {
    const ts = new Date(2024, 0, 15, 14, 30).getTime();
    expect(formatDateTime(ts)).toBe('15.01.2024 14:30');
  });

  it('pads hours and minutes', () => {
    const ts = new Date(2024, 0, 1, 9, 5).getTime();
    expect(formatDateTime(ts)).toBe('01.01.2024 09:05');
  });

  it('handles midnight', () => {
    const ts = new Date(2024, 11, 31, 0, 0).getTime();
    expect(formatDateTime(ts)).toBe('31.12.2024 00:00');
  });
});

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('00:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('02:05');
  });

  it('formats large durations', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('truncates fractional seconds', () => {
    expect(formatDuration(10.7)).toBe('00:10');
  });
});
