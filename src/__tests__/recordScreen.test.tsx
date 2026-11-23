import React, { act } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import RecordScreen from '../../app/record';
import PriorityPicker from '../components/PriorityPicker';
import { Priority } from '../models/types';

// Mirrors expo-audio 58: currentTime counts seconds while recording, and stop() resets it to 0.
const mockRecorder = {
  uri: 'file:///data/user/0/app/cache/Audio/recording-1.m4a',
  currentTime: 0,
  isRecording: false,
  prepareToRecordAsync: jest.fn(async () => {}),
  record: jest.fn(() => {
    mockRecorder.isRecording = true;
  }),
  stop: jest.fn(async () => {
    mockRecorder.isRecording = false;
    mockRecorder.currentTime = 0;
  }),
};
const mockAddRecording = jest.fn(async (_params: { duration: number }) => {});

jest.mock('expo-audio', () => ({ useAudioRecorder: () => mockRecorder }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ beehiveId: 'bh-1', locationId: 'loc-1' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));
jest.mock('expo-image-picker', () => ({}));
jest.mock('../contexts/DataContext', () => ({
  useData: () => ({
    locations: [],
    addRecording: mockAddRecording,
    getBeehivesForLocation: () => [],
  }),
}));
jest.mock('../services/audio', () => ({
  VOICE_NOTE_PRESET: {},
  requestPermissions: async () => true,
  configureRecordingMode: async () => {},
  configurePlaybackMode: async () => {},
}));
jest.mock('../services/storage', () => ({
  saveRecordingLocally: async () => 'file:///data/user/0/app/files/recordings/rec_1.m4a',
}));
jest.mock('../services/photoStorage', () => ({ savePhoto: jest.fn() }));
jest.mock('../utils/haptics', () => ({
  hapticLight: () => {},
  hapticMedium: () => {},
  hapticWarning: () => {},
  hapticSuccess: () => {},
}));

interface Node {
  type: unknown;
  parent: Node | null;
  props: {
    children?: unknown;
    onPress?: () => unknown;
    onSelect?: (priority: Priority) => void;
  };
}

const { create } = require('react-test-renderer') as {
  create: (el: React.ReactElement) => {
    root: {
      findAllByType: (type: unknown) => Node[];
      findByType: (type: unknown) => Node;
    };
    unmount: () => void;
  };
};

let renderer: ReturnType<typeof create> | undefined;

afterEach(() => {
  act(() => renderer?.unmount());
  renderer = undefined;
  mockRecorder.currentTime = 0;
  mockRecorder.isRecording = false;
  jest.clearAllMocks();
});

const root = () => renderer!.root;

const texts = () =>
  root()
    .findAllByType(Text)
    .map((node) => [node.props.children].flat().join(''));

// On the record step the only buttons are the close button and the record circle.
const recordButton = () => root().findAllByType(TouchableOpacity)[1];

function buttonWith(label: string): Node {
  let node: Node | null =
    root()
      .findAllByType(Text)
      .find((text) => text.props.children === label) ?? null;
  while (node && node.type !== TouchableOpacity) node = node.parent;
  if (!node) throw new Error(`No button with ${label}`);
  return node;
}

async function press(node: Node) {
  await act(async () => {
    await node.props.onPress?.();
  });
}

async function recordFor(seconds: number) {
  await act(async () => {
    renderer = create(<RecordScreen />);
  });
  await press(recordButton());
  mockRecorder.currentTime = seconds;
  await press(recordButton());
}

describe('RecordScreen stop', () => {
  it('keeps the length the recorder reported before stopping', async () => {
    await recordFor(7.4);

    expect(texts()).toContain('recordings.duration: 00:07');

    act(() => root().findByType(PriorityPicker).props.onSelect?.(Priority.HIGH));
    await press(buttonWith('common.save'));

    expect(mockAddRecording).toHaveBeenCalledWith(expect.objectContaining({ duration: 7 }));
  });

  it('treats a stop under one second as failed and stays on the record step', async () => {
    await recordFor(0.4);

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: 'common.error' }),
    );
    expect(texts()).toContain('recordings.tapToStart');
    expect(texts().some((text) => text.startsWith('recordings.duration'))).toBe(false);
  });

  it('accepts a one-second recording', async () => {
    await recordFor(1);

    expect(Toast.show).not.toHaveBeenCalled();
    expect(texts()).toContain('recordings.duration: 00:01');
  });
});
