import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { IOSOutputFormat, AudioQuality } from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';
import { Platform } from 'react-native';

export const VOICE_NOTE_PRESET: RecordingOptions = {
  isMeteringEnabled: true,
  extension: '.m4a',
  sampleRate: 22050,
  numberOfChannels: 1,
  bitRate: 64000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

export async function configureRecordingMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
  });
}

export async function configurePlaybackMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
  });
}
