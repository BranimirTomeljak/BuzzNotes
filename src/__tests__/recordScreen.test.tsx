import React, { act } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import RecordScreen from '../../app/record';
import PriorityPicker from '../components/PriorityPicker';
import { Priority } from '../models/types';

type MockStatus = { isFinished: boolean; hasError: boolean };
const mockListeners = new Set<(status: MockStatus) => void>();

// Android posts the finished event on its own, so it reaches JS after stop() resolves.
function mockFinish(hasError: boolean) {
  const listeners = [...mockListeners];
  setTimeout(() => listeners.forEach((listener) => listener({ isFinished: true, hasError })), 0);
}

// Mirrors expo-audio 58: currentTime counts seconds and stop() resets it; preparing twice throws.
const mockRecorder = {
  uri: 'file:///data/user/0/app/cache/Audio/recording-1.m4a',
  currentTime: 0,
  isRecording: false,
  isPrepared: false,
  prepareToRecordAsync: jest.fn(async () => {
    if (mockRecorder.isPrepared || mockRecorder.isRecording) throw new Error('Already prepared');
    mockRecorder.isPrepared = true;
  }),
  record: jest.fn(() => {
    mockRecorder.isRecording = true;
  }),
  addListener: jest.fn((_event: string, listener: (status: MockStatus) => void) => {
    mockListeners.add(listener);
    return { remove: () => mockListeners.delete(listener) };
  }),
  stop: jest.fn(async () => {
    mockStop();
    mockFinish(false);
  }),
};

function mockStop() {
  mockRecorder.isRecording = false;
  mockRecorder.isPrepared = false;
  mockRecorder.currentTime = 0;
}
const mockAddRecording = jest.fn(async (_params: { duration: number }) => {});
const mockRequestPermissions = jest.fn(async () => true);

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
  requestPermissions: () => mockRequestPermissions(),
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
  mockRecorder.isPrepared = false;
  mockListeners.clear();
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
    expect(mockRecorder.record).toHaveBeenCalledTimes(1);
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(texts()).toEqual([
      'recordings.add',
      expect.stringMatching(/^\d\d:\d\d$/),
      'recordings.tapToStart',
    ]);
  });

  it('accepts a one-second recording', async () => {
    await recordFor(1);

    expect(Toast.show).not.toHaveBeenCalled();
    expect(texts()).toContain('recordings.duration: 00:01');
  });

  it('ignores a second stop tap while the first is still stopping', async () => {
    await act(async () => {
      renderer = create(<RecordScreen />);
    });
    await press(recordButton());
    mockRecorder.currentTime = 7.4;
    let finishStop: () => void = () => {};
    mockRecorder.stop.mockImplementationOnce(() => {
      mockStop();
      return new Promise<void>((resolve) => {
        finishStop = () => {
          resolve();
          mockFinish(false);
        };
      });
    });

    const stop = recordButton().props.onPress;
    await act(async () => {
      const first = stop?.();
      const second = stop?.();
      finishStop();
      await Promise.all([first, second]);
    });

    expect(Toast.show).not.toHaveBeenCalled();
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(texts()).toContain('recordings.duration: 00:07');
  });

  it('ignores a stop tap that lands after the first stop but before the re-render', async () => {
    await act(async () => {
      renderer = create(<RecordScreen />);
    });
    await press(recordButton());
    mockRecorder.currentTime = 7.4;

    const stop = recordButton().props.onPress;
    await act(async () => {
      await stop?.();
      await stop?.();
    });

    expect(Toast.show).not.toHaveBeenCalled();
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(texts()).toContain('recordings.duration: 00:07');
  });

  it('still stops the next recording after a too-short one', async () => {
    await recordFor(0.4);
    await press(recordButton());
    mockRecorder.currentTime = 3;
    await press(recordButton());

    expect(mockRecorder.stop).toHaveBeenCalledTimes(2);
    expect(texts()).toContain('recordings.duration: 00:03');
  });

  it('treats a stop the recorder reports as failed like a too-short one', async () => {
    mockRecorder.stop.mockImplementationOnce(async () => {
      mockStop();
      mockFinish(true);
    });
    await recordFor(20);

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: 'common.error' }),
    );
    expect(texts()).toEqual([
      'recordings.add',
      expect.stringMatching(/^\d\d:\d\d$/),
      'recordings.tapToStart',
    ]);
  });

  it('goes on when the recorder sends no finished event', async () => {
    mockRecorder.stop.mockImplementationOnce(async () => mockStop());
    await recordFor(5);

    expect(Toast.show).not.toHaveBeenCalled();
    expect(texts()).toContain('recordings.duration: 00:05');
  });
});

describe('RecordScreen start', () => {
  async function render() {
    await act(async () => {
      renderer = create(<RecordScreen />);
    });
  }

  it('ignores a second start tap while the first is still starting', async () => {
    await render();

    const start = recordButton().props.onPress;
    await act(async () => {
      await Promise.all([start?.(), start?.()]);
    });

    expect(Toast.show).not.toHaveBeenCalled();
    expect(mockRecorder.prepareToRecordAsync).toHaveBeenCalledTimes(1);
    expect(texts()).toContain('recordings.tapToStop');
  });

  it('ignores a start tap that lands after the first start but before the re-render', async () => {
    await render();

    const start = recordButton().props.onPress;
    await act(async () => {
      await start?.();
      await start?.();
    });

    expect(Toast.show).not.toHaveBeenCalled();
    expect(mockRecorder.prepareToRecordAsync).toHaveBeenCalledTimes(1);
    expect(texts()).toContain('recordings.tapToStop');
  });

  it('starts on the next tap after the microphone permission was denied', async () => {
    await render();
    mockRequestPermissions.mockResolvedValueOnce(false);

    await press(recordButton());
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'recordings.micPermission' }),
    );
    await press(recordButton());

    expect(mockRecorder.record).toHaveBeenCalledTimes(1);
    expect(texts()).toContain('recordings.tapToStop');
  });

  it('starts on the next tap after a start failed', async () => {
    await render();
    mockRecorder.prepareToRecordAsync.mockRejectedValueOnce(new Error('Microphone busy'));

    await press(recordButton());
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text1: 'common.error' }));
    await press(recordButton());

    expect(mockRecorder.record).toHaveBeenCalledTimes(1);
    expect(texts()).toContain('recordings.tapToStop');
  });

  it('starts on the next tap after record() failed on a prepared recorder', async () => {
    await render();
    mockRecorder.record.mockImplementationOnce(() => {
      throw new Error('start failed');
    });

    await press(recordButton());
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text1: 'common.error' }));
    await press(recordButton());

    expect(Toast.show).toHaveBeenCalledTimes(1);
    expect(mockRecorder.record).toHaveBeenCalledTimes(2);
    expect(texts()).toContain('recordings.tapToStop');
  });

  it('still reports a failed start when resetting the recorder fails too', async () => {
    await render();
    mockRecorder.record.mockImplementationOnce(() => {
      throw new Error('start failed');
    });
    mockRecorder.stop.mockRejectedValueOnce(new Error('stop failed'));

    await press(recordButton());

    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text1: 'common.error' }));
  });
});
