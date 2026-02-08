import React, { useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { colors, borderRadius } from '../theme';

interface SliderProps {
  value: number;
  maximumValue: number;
  onValueChange: (value: number) => void;
  tintColor?: string;
}

export default function Slider({ value, maximumValue, onValueChange, tintColor }: SliderProps) {
  const widthRef = useRef(0);
  const leftRef = useRef(0);
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;
  const maximumValueRef = useRef(maximumValue);
  maximumValueRef.current = maximumValue;

  const getValueFromPageX = useCallback((pageX: number) => {
    const w = widthRef.current;
    if (w <= 0) return 0;
    const x = pageX - leftRef.current;
    const ratio = Math.max(0, Math.min(1, x / w));
    return ratio * maximumValueRef.current;
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          onValueChangeRef.current(getValueFromPageX(evt.nativeEvent.pageX));
        },
        onPanResponderMove: (evt) => {
          onValueChangeRef.current(getValueFromPageX(evt.nativeEvent.pageX));
        },
      }),
    [getValueFromPageX]
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    // Measure absolute position for pageX calculations
    (e.target as any).measureInWindow?.((x: number) => {
      leftRef.current = x;
    });
  }, []);

  const progress = maximumValue > 0 ? (value / maximumValue) * 100 : 0;

  return (
    <View
      style={styles.container}
      onLayout={onLayout}
      {...panResponder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }, tintColor && { backgroundColor: tintColor }]} />
      </View>
      <View style={[styles.thumb, { left: `${progress}%` }, tintColor && { backgroundColor: tintColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    marginLeft: -8,
    top: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
