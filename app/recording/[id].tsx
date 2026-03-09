import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../../src/contexts/DataContext';
import { savePhoto, deletePhoto } from '../../src/services/photoStorage';
import AudioPlayer from '../../src/components/AudioPlayer';
import PriorityBadge from '../../src/components/PriorityBadge';
import { confirmDelete } from '../../src/utils/confirmDelete';
import { hapticLight, hapticSuccess, hapticWarning } from '../../src/utils/haptics';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { formatDateTime, formatDuration } from '../../src/utils/formatting';
import { Priority } from '../../src/models/types';

const PRIORITY_CYCLE: Priority[] = [Priority.HIGH, Priority.MEDIUM, Priority.LOW];
const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - spacing.xl * 2 - spacing.sm) / 2;

export default function RecordingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { getRecordingById, getBeehiveById, getLocationById, updateRecording, deleteRecording } =
    useData();

  const recording = getRecordingById(id);
  const beehive = recording ? getBeehiveById(recording.beehiveId) : undefined;
  const location = recording ? getLocationById(recording.locationId) : undefined;

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(recording?.notes || '');
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);
  const photoListRef = useRef<FlatList>(null);

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

  const handleSaveNotes = useCallback(() => {
    updateRecording(id, { notes: notesText.trim() });
    setEditingNotes(false);
  }, [id, notesText, updateRecording]);

  const handleTakePhoto = useCallback(async () => {
    if (!recording) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const photos = recording.photos || [];
      const newPath = savePhoto(result.assets[0].uri, id, photos.length);
      updateRecording(id, { photos: [...photos, newPath] });
    }
  }, [recording, id, updateRecording]);

  const handlePickPhoto = useCallback(async () => {
    if (!recording) return;
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
  }, [recording, id, updateRecording]);

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

      <ScrollView contentContainerStyle={styles.content}>
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
            <Text style={styles.sectionTitle}>{t('recordings.notes')}</Text>
            <TouchableOpacity
              onPress={() => {
                if (editingNotes) {
                  handleSaveNotes();
                } else {
                  setNotesText(recording.notes || '');
                  setEditingNotes(true);
                }
              }}
              style={styles.editBtn}
            >
              <Ionicons
                name={editingNotes ? 'checkmark' : 'create-outline'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          {editingNotes ? (
            <TextInput
              style={styles.notesInput}
              value={notesText}
              onChangeText={setNotesText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder={t('recordings.notesPlaceholder')}
              placeholderTextColor={colors.textLight}
              autoFocus
            />
          ) : recording.notes?.trim() ? (
            <Text style={styles.notesText}>{recording.notes}</Text>
          ) : (
            <Text style={styles.notesEmpty}>{t('recordings.noNotes')}</Text>
          )}
        </View>

        {/* Photos section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images-outline" size={18} color={colors.text} />
            <Text style={styles.sectionTitle}>{t('recordings.photos')}</Text>
          </View>

          {/* Add photo buttons */}
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

          {/* Photo grid */}
          {hasPhotos && (
            <View style={styles.photoGrid}>
              {recording.photos!.map((uri, index) => (
                <View key={uri + index} style={styles.photoContainer}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setViewingPhotoIndex(index)}>
                    <Image source={{ uri }} style={styles.photo} />
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
                  length: SCREEN_WIDTH,
                  offset: SCREEN_WIDTH * index,
                  index,
                })}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setViewingPhotoIndex(idx);
                }}
                keyExtractor={(item, i) => item + i}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.photoViewerPage}
                    onPress={() => setViewingPhotoIndex(null)}
                  >
                    <Image
                      source={{ uri: item }}
                      style={styles.photoViewerImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                )}
              />
              <Text style={styles.photoCounter}>
                {viewingPhotoIndex + 1} / {recording.photos.length}
              </Text>
            </>
          )}
        </View>
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
    borderRadius: borderRadius.lg,
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
    borderRadius: borderRadius.lg,
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
    fontSize: 18,
    flex: 1,
  },
  editBtn: {
    padding: spacing.sm,
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
  notesText: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
  },
  notesEmpty: {
    ...typography.bodySmall,
    fontStyle: 'italic',
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: borderRadius.md,
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
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerImage: {
    width: SCREEN_WIDTH,
    height: Dimensions.get('window').height * 0.8,
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
