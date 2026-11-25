import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  PinchGestureHandlerStateChangeEvent,
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useData } from '../../src/contexts/DataContext';
import { savePhoto, deletePhoto } from '../../src/services/photoStorage';
import AudioPlayer from '../../src/components/AudioPlayer';
import PriorityBadge from '../../src/components/PriorityBadge';
import { confirmDelete } from '../../src/utils/confirmDelete';
import { hapticLight, hapticSuccess, hapticWarning } from '../../src/utils/haptics';
import { useResponsive } from '../../src/hooks/useResponsive';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { formatDateTime, formatDuration } from '../../src/utils/formatting';
import { Priority } from '../../src/models/types';

const PRIORITY_CYCLE: Priority[] = [Priority.HIGH, Priority.MEDIUM, Priority.LOW];

function ZoomableImage({
  uri,
  width,
  height,
  pageIndex,
  activeIndex,
}: {
  uri: string;
  width: number;
  height: number;
  pageIndex: number;
  activeIndex: number;
}) {
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const savedScaleRef = useRef(1);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const doubleTapRef = useRef<TapGestureHandler>(null);

  // Reset zoom when swiping to a different photo
  useEffect(() => {
    if (pageIndex !== activeIndex) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      savedScaleRef.current = 1;
    }
  }, [activeIndex, pageIndex, scaleAnim]);

  const onPinchEvent = Animated.event<PinchGestureHandlerGestureEvent>(
    [{ nativeEvent: { scale: scaleAnim } }],
    { useNativeDriver: true },
  );

  const onPinchStateChange = useCallback(
    (event: PinchGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const newScale = savedScaleRef.current * event.nativeEvent.scale;
        const clamped = Math.min(Math.max(newScale, 1), 5);
        savedScaleRef.current = clamped;
        scaleAnim.setValue(clamped);
      }
    },
    [scaleAnim],
  );

  const onDoubleTap = useCallback(
    (event: TapGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.ACTIVE) {
        const target = savedScaleRef.current > 1 ? 1 : 2;
        savedScaleRef.current = target;
        Animated.spring(scaleAnim, {
          toValue: target,
          useNativeDriver: true,
        }).start();
      }
    },
    [scaleAnim],
  );

  return (
    <TapGestureHandler ref={doubleTapRef} numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
      <Animated.View>
        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={onPinchEvent}
          onHandlerStateChange={onPinchStateChange}
        >
          <Animated.Image
            source={{ uri }}
            style={[{ width, height: height * 0.8 }, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />
        </PinchGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  );
}

export default function RecordingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { getRecordingById, getBeehiveById, getLocationById, updateRecording, deleteRecording } =
    useData();

  const recording = getRecordingById(id);
  const beehive = recording ? getBeehiveById(recording.beehiveId) : undefined;
  const location = recording ? getLocationById(recording.locationId) : undefined;

  const [notesText, setNotesText] = useState(recording?.notes || '');
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);
  const photoListRef = useRef<FlatList>(null);
  const notesRef = useRef(notesText);
  useLayoutEffect(() => {
    notesRef.current = notesText;
  }, [notesText]);

  const savedNotesRef = useRef(recording?.notes || '');

  const { contentMaxWidth, photoColumns, scale, isTablet } = useResponsive();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const contentWidth = contentMaxWidth ? Math.min(screenWidth, contentMaxWidth) : screenWidth;
  const photoSize =
    (contentWidth - spacing.xl * 2 - spacing.sm * (photoColumns - 1)) / photoColumns;

  useEffect(() => {
    return () => {
      const trimmed = notesRef.current.trim();
      if (trimmed !== savedNotesRef.current) {
        updateRecording(id, { notes: trimmed });
      }
    };
  }, [id, updateRecording]);

  const audioUri = recording?.localPath || recording?.audioUrl;

  const cyclePriority = useCallback(() => {
    if (!recording) return;
    hapticLight();
    const idx = PRIORITY_CYCLE.indexOf(recording.priority);
    const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
    updateRecording(id, { priority: next });
  }, [recording, id, updateRecording]);

  const handleToggleSolved = useCallback(() => {
    if (!recording) return;
    hapticSuccess();
    updateRecording(id, { solved: !recording.solved });
  }, [recording, id, updateRecording]);

  const handleDelete = useCallback(() => {
    hapticWarning();
    confirmDelete(
      t('recordings.delete'),
      t('recordings.deleteConfirm'),
      () => {
        deleteRecording(id);
        router.back();
      },
      t('common.cancel'),
      t('common.delete'),
    );
  }, [id, deleteRecording, router, t]);

  const handleNotesBlur = useCallback(() => {
    const trimmed = notesText.trim();
    if (trimmed !== savedNotesRef.current) {
      updateRecording(id, { notes: trimmed });
      savedNotesRef.current = trimmed;
    }
  }, [id, notesText, updateRecording]);

  const handleTakePhoto = useCallback(async () => {
    if (!recording) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const photos = recording.photos || [];
        const newPath = savePhoto(result.assets[0].uri, id, photos.length);
        updateRecording(id, { photos: [...photos, newPath] });
      }
    } catch {
      Toast.show({ type: 'error', text1: t('common.error'), visibilityTime: 1500 });
    }
  }, [recording, id, updateRecording, t]);

  const handlePickPhoto = useCallback(async () => {
    if (!recording) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });
      if (!result.canceled) {
        const photos = recording.photos || [];
        const newPaths = result.assets.map((a, i) => savePhoto(a.uri, id, photos.length + i));
        updateRecording(id, { photos: [...photos, ...newPaths] });
      }
    } catch {
      Toast.show({ type: 'error', text1: t('common.error'), visibilityTime: 1500 });
    }
  }, [recording, id, updateRecording, t]);

  const handleRemovePhoto = useCallback(
    (index: number) => {
      if (!recording?.photos) return;
      const photoPath = recording.photos[index];
      deletePhoto(photoPath);
      const updated = recording.photos.filter((_, i) => i !== index);
      updateRecording(id, { photos: updated });
    },
    [recording, id, updateRecording],
  );

  if (!recording) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: '' }} />
        <Text style={styles.notFound}>{t('common.error')}</Text>
      </View>
    );
  }

  const priorityTint =
    recording.priority === Priority.HIGH
      ? colors.priorityHighTint
      : recording.priority === Priority.MEDIUM
        ? colors.priorityMediumTint
        : colors.priorityLowTint;

  const hasPhotos = !!recording.photos?.length;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: formatDateTime(recording.createdAt),
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
              <Ionicons name="trash-outline" size={22} color={colors.white} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          contentMaxWidth != null && {
            maxWidth: contentMaxWidth,
            alignSelf: 'center' as const,
            width: '100%' as const,
          },
        ]}
      >
        {/* Meta info */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="archive-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{beehive?.name || '?'}</Text>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{location?.name || '?'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{t('recordings.duration')}:</Text>
            <Text style={styles.metaText}>{formatDuration(recording.duration)}</Text>
          </View>
        </View>

        {/* Priority + Solved row */}
        <View style={styles.statusRow}>
          <PriorityBadge priority={recording.priority} onPress={cyclePriority} />
          <TouchableOpacity
            style={[styles.solvedChip, recording.solved && styles.solvedChipActive]}
            onPress={handleToggleSolved}
            activeOpacity={0.7}
          >
            <Ionicons
              name={recording.solved ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={20}
              color={recording.solved ? colors.solved : colors.textLight}
            />
            <Text style={[styles.solvedChipText, recording.solved && styles.solvedChipTextActive]}>
              {recording.solved ? t('recordings.solved') : t('recordings.unsolved')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Audio player */}
        <View
          style={[
            styles.audioCard,
            { backgroundColor: recording.solved ? colors.surface : priorityTint },
          ]}
        >
          {audioUri ? (
            <AudioPlayer
              uri={audioUri}
              duration={recording.duration}
              onPlay={() => updateRecording(id, { lastListenedAt: Date.now() })}
              muted={recording.solved}
            />
          ) : (
            <Text style={styles.noAudio}>{formatDuration(recording.duration)}</Text>
          )}
        </View>

        {/* Notes section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={colors.text} />
            <Text style={[styles.sectionTitle, { fontSize: 22 * scale }]}>
              {t('recordings.notes')}
            </Text>
          </View>
          <TextInput
            style={[styles.notesInput, { fontSize: 16 * scale, minHeight: isTablet ? 150 : 120 }]}
            value={notesText}
            onChangeText={setNotesText}
            onBlur={handleNotesBlur}
            multiline
            textAlignVertical="top"
            placeholder={t('recordings.notesPlaceholder')}
            placeholderTextColor={colors.textLight}
          />
        </View>

        {/* Photos section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images-outline" size={18} color={colors.text} />
            <Text style={[styles.sectionTitle, { fontSize: 22 * scale }]}>
              {t('recordings.photos')}
            </Text>
          </View>

          {/* Add photo buttons; web picker URIs are blob: URLs that die on reload */}
          {Platform.OS === 'web' ? (
            <Text style={styles.webNote}>{t('common.webUnavailable')}</Text>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={styles.photoButtonText}>{t('recordings.takePhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
                <Ionicons name="image-outline" size={20} color={colors.primary} />
                <Text style={styles.photoButtonText}>{t('recordings.chooseFromGallery')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Photo grid */}
          {hasPhotos && (
            <View style={styles.photoGrid}>
              {recording.photos!.map((uri, index) => (
                <View key={uri + index} style={styles.photoContainer}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setViewingPhotoIndex(index)}>
                    <Image
                      source={{ uri }}
                      style={{ width: photoSize, height: photoSize, borderRadius: borderRadius.md }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fullscreen photo viewer with swipe */}
      <Modal visible={viewingPhotoIndex !== null} transparent animationType="fade">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.photoViewerOverlay}>
            <TouchableOpacity
              style={styles.photoViewerClose}
              onPress={() => setViewingPhotoIndex(null)}
            >
              <Ionicons name="close" size={28} color={colors.white} />
            </TouchableOpacity>
            {viewingPhotoIndex !== null && recording.photos && (
              <>
                <FlatList
                  ref={photoListRef}
                  data={recording.photos}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  initialScrollIndex={viewingPhotoIndex}
                  getItemLayout={(_, index) => ({
                    length: screenWidth,
                    offset: screenWidth * index,
                    index,
                  })}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                    setViewingPhotoIndex(idx);
                  }}
                  keyExtractor={(item, i) => item + i}
                  renderItem={({ item, index }) => (
                    <View style={[styles.photoViewerPage, { width: screenWidth }]}>
                      <ZoomableImage
                        uri={item}
                        width={screenWidth}
                        height={screenHeight}
                        pageIndex={index}
                        activeIndex={viewingPhotoIndex!}
                      />
                    </View>
                  )}
                />
                <Text style={styles.photoCounter}>
                  {viewingPhotoIndex + 1} / {recording.photos.length}
                </Text>
              </>
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    ...typography.h2,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  headerBtn: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  metaCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  metaText: {
    ...typography.bodySmall,
    marginRight: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  solvedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  solvedChipActive: {
    backgroundColor: colors.solvedBg,
  },
  solvedChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  solvedChipTextActive: {
    color: colors.solved,
  },
  audioCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.card,
  },
  noAudio: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  photoButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  webNote: {
    ...typography.bodySmall,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    position: 'relative',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  photoViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: spacing.sm,
  },
  photoViewerPage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCounter: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
