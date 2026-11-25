import React, { useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { formatDuration } from '../utils/formatting';
import Slider from './Slider';

interface AudioPlayerProps {
  uri: string;
  duration: number;
  onPlay?: () => void;
  muted?: boolean;
}

export default function AudioPlayer({ uri, duration, onPlay, muted }: AudioPlayerProps) {
  const player = useAudioPlayer(uri, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const finishedRef = useRef(false);

  // Mark as finished when playback ends — don't auto-restart
  useEffect(() => {
    if (status.didJustFinish) {
      finishedRef.current = true;
    }
  }, [status.didJustFinish]);

  const togglePlayPause = useCallback(() => {
    if (!uri) return;
    if (status.playing) {
      player.pause();
    } else {
      // If finished, seek to start before replaying
      if (finishedRef.current) {
        player.seekTo(0);
        finishedRef.current = false;
      }
      player.play();
      onPlay?.();
    }
  }, [uri, status.playing, player, onPlay]);

  const onSliderChange = useCallback(
    (value: number) => {
      player.seekTo(value);
    },
    [player],
  );

  const currentSec = Math.floor(status.currentTime);
  const totalSec = status.duration > 0 ? Math.floor(status.duration) : duration;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={togglePlayPause}
        style={[styles.playButton, muted && styles.playButtonMuted]}
        activeOpacity={0.7}
      >
        <Ionicons name={status.playing ? 'pause' : 'play'} size={20} color={colors.white} />
      </TouchableOpacity>
      <View style={styles.sliderContainer}>
        <Slider
          value={status.currentTime}
          maximumValue={status.duration > 0 ? status.duration : duration}
          onValueChange={onSliderChange}
          tintColor={muted ? colors.textLight : undefined}
        />
      </View>
      <Text style={[styles.time, muted && styles.timeMuted]}>
        {formatDuration(currentSec)}/{formatDuration(totalSec)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonMuted: {
    backgroundColor: colors.textLight,
  },
  sliderContainer: {
    flex: 1,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
    minWidth: 80,
    textAlign: 'right',
  },
  timeMuted: {
    color: colors.textLight,
  },
});
