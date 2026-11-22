import React, { act } from 'react';
import { Text } from 'react-native';
import LocationCard from '../components/LocationCard';
import { Location } from '../models/types';

// Icons render as glyph Text nodes and load fonts asynchronously; the stats are what matter here.
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));

const { create } = require('react-test-renderer') as {
  create: (el: React.ReactElement) => {
    root: { findAllByType: (type: unknown) => { props: { children?: unknown } }[] };
    unmount: () => void;
  };
};

let i18n: typeof import('../i18n').default;
let renderer: ReturnType<typeof create> | undefined;

beforeAll(() => {
  const info = jest.spyOn(console, 'info').mockImplementation(() => {});
  i18n = require('../i18n').default;
  info.mockRestore();
});

afterEach(() => {
  act(() => renderer?.unmount());
  renderer = undefined;
});

const location: Location = {
  id: 'loc-1',
  name: 'Pčelinjak',
  userId: 'user-1',
  createdAt: 0,
  updatedAt: 0,
};

async function statTexts(lng: string, beehiveCount: number, recordingCount: number) {
  await act(() => i18n.changeLanguage(lng));
  act(() => {
    renderer = create(
      <LocationCard
        location={location}
        beehiveCount={beehiveCount}
        recordingCount={recordingCount}
        index={0}
        onPress={() => {}}
      />,
    );
  });
  return renderer!.root
    .findAllByType(Text)
    .map((node) => node.props.children)
    .filter((child) => child !== location.name);
}

describe('LocationCard stats', () => {
  it('names each count with the Croatian form for that number', async () => {
    expect(await statTexts('hr', 1, 5)).toEqual([1, 'košnica', 5, 'snimki']);
    act(() => renderer?.unmount());
    expect(await statTexts('hr', 2, 21)).toEqual([2, 'košnice', 21, 'snimka']);
  });

  it('names each count with the English form for that number', async () => {
    expect(await statTexts('en', 1, 2)).toEqual([1, 'beehive', 2, 'recordings']);
  });
});
