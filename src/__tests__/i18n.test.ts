const nativePluralRules = Intl.PluralRules;
let i18n: typeof import('../i18n').default;

beforeAll(() => {
  // Hermes on Android has no Intl.PluralRules, so load the app's i18n without it, as on the phone.
  delete (Intl as { PluralRules?: unknown }).PluralRules;
  const info = jest.spyOn(console, 'info').mockImplementation(() => {});
  i18n = require('../i18n').default;
  info.mockRestore();
});

afterAll(() => {
  (Intl as { PluralRules?: unknown }).PluralRules = nativePluralRules;
});

const recordingCount = (lng: string, count: number) =>
  i18n.t('beehives.recordingCount', { lng, count });

describe('beehive recording count without a native Intl.PluralRules', () => {
  it.each([
    [1, '1 snimka'],
    [21, '21 snimka'],
    [2, '2 snimke'],
    [4, '4 snimke'],
    [22, '22 snimke'],
    [0, '0 snimki'],
    [5, '5 snimki'],
    [11, '11 snimki'],
    [12, '12 snimki'],
    [25, '25 snimki'],
  ])('uses the Croatian form for %i', (count, text) => {
    expect(recordingCount('hr', count)).toBe(text);
  });

  it.each([
    [0, '0 recordings'],
    [1, '1 recording'],
    [2, '2 recordings'],
  ])('uses the English form for %i', (count, text) => {
    expect(recordingCount('en', count)).toBe(text);
  });
});

describe('location card labels without a native Intl.PluralRules', () => {
  const labels = (lng: string, count: number) => [
    i18n.t('common.beehiveLabel', { lng, count }),
    i18n.t('common.recordingLabel', { lng, count }),
  ];

  it.each([
    [0, 'košnica', 'snimki'],
    [1, 'košnica', 'snimka'],
    [2, 'košnice', 'snimke'],
    [4, 'košnice', 'snimke'],
    [5, 'košnica', 'snimki'],
    [11, 'košnica', 'snimki'],
    [12, 'košnica', 'snimki'],
    [21, 'košnica', 'snimka'],
    [22, 'košnice', 'snimke'],
  ])('uses the Croatian forms for %i', (count, beehives, recordings) => {
    expect(labels('hr', count)).toEqual([beehives, recordings]);
  });

  it.each([
    [0, 'beehives', 'recordings'],
    [1, 'beehive', 'recording'],
    [2, 'beehives', 'recordings'],
  ])('uses the English forms for %i', (count, beehives, recordings) => {
    expect(labels('en', count)).toEqual([beehives, recordings]);
  });
});
