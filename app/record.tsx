import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioRecorder } from 'expo-audio';
import type { AudioRecorder, RecordingStatus } from 'expo-audio';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../src/contexts/DataContext';
import { savePhoto } from '../src/services/photoStorage';
import PriorityPicker from '../src/components/PriorityPicker';
import { colors, spacing, borderRadius, typography } from '../src/theme';
import { Priority, Location, Beehive } from '../src/models/types';
import {
  VOICE_NOTE_PRESET,
  requestPermissions,
  configureRecordingMode,
  configurePlaybackMode,
} from '../src/services/audio';
import { saveRecordingLocally } from '../src/services/storage';
import { formatDuration } from '../src/utils/formatting';
import { hapticMedium, hapticSuccess } from '../src/utils/haptics';

type Step = 'select' | 'record' | 'priority';

const MIN_RECORDING_SECONDS = 1;
const FINISH_WAIT_MS = 1000;

// Resolves with the recorder's next finished status, or null if none comes within the wait.
function nextFinish(recorder: AudioRecorder): Promise<RecordingStatus | null> {
  let settle: (status: RecordingStatus | null) => void = () => {};
  const done = new Promise<RecordingStatus | null>((resolve) => {
    settle = resolve;
  });
  const subscription = recorder.addListener('recordingStatusUpdate', (status) => {
    if (status.isFinished) settle(status);
  });
  const timer = setTimeout(() => settle(null), FINISH_WAIT_MS);
  return done.finally(() => {
    clearTimeout(timer);
    subscription.remove();
  });
}

export default function RecordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ beehiveId?: string; locationId?: string }>();
  const { locations, addRecording, getBeehivesForLocation } = useData();

  const recorder = useAudioRecorder(VOICE_NOTE_PRESET);

  const [step, setStep] = useState<Step>(
    params.beehiveId && params.locationId ? 'record' : 'select',
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    params.locationId || null,
  );
  const [selectedBeehiveId, setSelectedBeehiveId] = useState<string | null>(
    params.beehiveId || null,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startingRef = useRef(false);
  const stoppingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current);
      try {
        if (recorder.isRecording) recorder.stop();
      } catch {
        /* already released */
      }
    };
  }, [recorder]);

  const availableBeehives = selectedLocationId ? getBeehivesForLocation(selectedLocationId) : [];

  const handleStartRecording = useCallback(async () => {
    // Ignore start taps until a start or stop fails; preparing the recorder twice throws.
    if (startingRef.current) return;
    startingRef.current = true;
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      startingRef.current = false;
      Toast.show({ type: 'error', text1: t('recordings.micPermission'), visibilityTime: 2000 });
      return;
    }

    try {
      await configureRecordingMode();
      await recorder.prepareToRecordAsync();
      recorder.record();
      hapticMedium();
      stoppingRef.current = false;
      setIsRecording(true);
      setRecordingDuration(0);
      durationInterval.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      startingRef.current = false;
      Toast.show({ type: 'error', text1: t('common.error'), visibilityTime: 1500 });
    }
  }, [recorder, t]);

  const handleStopRecording = useCallback(async () => {
    // A second tap before the re-render would read the reset time and fail a good recording.
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    try {
      // The recorder resets currentTime to 0 when it stops, so read the length first.
      const seconds = recorder.currentTime;
      const finished = nextFinish(recorder);
      await recorder.stop();
      // Android has no audio this early, and stop() no longer rejects for it, so fail like it used to.
      if (seconds < MIN_RECORDING_SECONDS) throw new Error('Recording too short');
      // A later failure also resolves stop(); the finished event, sometimes after it, reports it.
      if ((await finished)?.hasError) throw new Error('Recording failed');
      hapticMedium();
      await configurePlaybackMode();
      const uri = recorder.uri;
      setIsRecording(false);
      setRecordingUri(uri);
      setRecordedDuration(Math.round(seconds));
      setStep('priority');
    } catch {
      startingRef.current = false;
      setIsRecording(false);
      Toast.show({ type: 'error', text1: t('common.error'), visibilityTime: 1500 });
    }
  }, [recorder, t]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUris((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      Toast.show({ type: 'error', text1: t('common.error'), visibilityTime: 1500 });
    }
  }, [t]);

  const handlePickPhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });
      if (!result.canceled) {
        setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
      }
    } catch {
      Toast.show({ type: 'error', text1: t('common.error'), visibilityTime: 1500 });
    }
  }, [t]);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedBeehiveId || !selectedLocationId || !recordingUri || !selectedPriority) return;

    setSaving(true);
    try {
      const tempId = `rec_${Date.now()}`;
      const localPath = await saveRecordingLocally(recordingUri, tempId);

      // Save photos to permanent storage
      const savedPhotoPaths: string[] = [];
      for (let i = 0; i < photoUris.length; i++) {
        const path = savePhoto(photoUris[i], tempId, i);
        savedPhotoPaths.push(path);
      }

      await addRecording({
        beehiveId: selectedBeehiveId,
        locationId: selectedLocationId,
        localPath,
        duration: recordedDuration,
        priority: selectedPriority,
        notes: notes.trim(),
        photos: savedPhotoPaths,
      });

      hapticSuccess();
      Toast.show({ type: 'success', text1: t('recordings.saved'), visibilityTime: 1500 });
      router.replace(`/beehive/${selectedBeehiveId}`);
    } catch {
      Toast.show({ type: 'error', text1: t('common.error'), visibilityTime: 1500 });
    } finally {
      setSaving(false);
    }
  }, [
    selectedBeehiveId,
    selectedLocationId,
    recordingUri,
    selectedPriority,
    recordedDuration,
    notes,
    photoUris,
    addRecording,
    router,
    t,
  ]);

  const proceedToRecord = useCallback(() => {
    if (selectedBeehiveId && selectedLocationId) {
      setStep('record');
    }
  }, [selectedBeehiveId, selectedLocationId]);

  // Web recorder URIs are blob: URLs that die on reload, so the web preview cannot record.
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('recordings.add')}</Text>
          <View style={styles.closeButton} />
        </View>
        <Text style={styles.webNote}>{t('common.webUnavailable')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('recordings.add')}</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Step 1: Select location & beehive */}
        {step === 'select' && (
          <View style={styles.selectContainer}>
            {/* Location selection */}
            <Text style={styles.sectionTitle}>{t('recordings.selectLocation')}</Text>
            {locations.map((loc: Location) => (
              <TouchableOpacity
                key={loc.id}
                style={[
                  styles.selectOption,
                  selectedLocationId === loc.id && styles.selectOptionActive,
                ]}
                onPress={() => {
                  setSelectedLocationId(loc.id);
                  setSelectedBeehiveId(null);
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={selectedLocationId === loc.id ? colors.primary : colors.textSecondary}
                  style={styles.selectOptionIcon}
                />
                <Text
                  style={[
                    styles.selectOptionText,
                    selectedLocationId === loc.id && styles.selectOptionTextActive,
                  ]}
                >
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Beehive selection */}
            {selectedLocationId && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
                  {t('recordings.selectBeehive')}
                </Text>
                {availableBeehives.map((bh: Beehive) => (
                  <TouchableOpacity
                    key={bh.id}
                    style={[
                      styles.selectOption,
                      selectedBeehiveId === bh.id && styles.selectOptionActive,
                    ]}
                    onPress={() => setSelectedBeehiveId(bh.id)}
                  >
                    <MaterialCommunityIcons
                      name="archive-outline"
                      size={18}
                      color={selectedBeehiveId === bh.id ? colors.primary : colors.textSecondary}
                      style={styles.selectOptionIcon}
                    />
                    <Text
                      style={[
                        styles.selectOptionText,
                        selectedBeehiveId === bh.id && styles.selectOptionTextActive,
                      ]}
                    >
                      {bh.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Proceed button */}
            {selectedBeehiveId && (
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={proceedToRecord}
                activeOpacity={0.7}
              >
                <Ionicons name="mic" size={22} color={colors.white} style={styles.proceedIcon} />
                <Text style={styles.proceedText}>{t('recordings.tapToStart')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 2: Recording */}
        {step === 'record' && (
          <View style={styles.recordContainer}>
            <View style={styles.recordVisual}>
              {isRecording && <View style={styles.recordPulse} />}
              <TouchableOpacity
                style={[styles.recordCircle, isRecording && styles.recordCircleActive]}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
                activeOpacity={0.7}
              >
                <Ionicons name={isRecording ? 'stop' : 'mic'} size={48} color={colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
            <Text style={styles.recordHint}>
              {isRecording ? t('recordings.tapToStop') : t('recordings.tapToStart')}
            </Text>
          </View>
        )}

        {/* Step 3: Priority */}
        {step === 'priority' && (
          <View style={styles.priorityContainer}>
            <Text style={styles.durationResult}>
              {t('recordings.duration')}: {formatDuration(recordedDuration)}
            </Text>
            <PriorityPicker selected={selectedPriority} onSelect={setSelectedPriority} />

            {/* Notes */}
            <TextInput
              style={styles.notesInput}
              placeholder={t('recordings.notesPlaceholder')}
              placeholderTextColor={colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Photos */}
            <View style={styles.photoSection}>
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
              {photoUris.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photoPreviewRow}
                >
                  {photoUris.map((uri, index) => (
                    <View key={uri + index} style={styles.photoPreviewContainer}>
                      <Image source={{ uri }} style={styles.photoPreview} />
                      <TouchableOpacity
                        style={styles.photoRemoveBtn}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {selectedPriority && (
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.saveText}>
                  {saving ? t('recordings.saving') : t('common.save')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  webNote: {
    ...typography.bodySmall,
    padding: spacing.xl,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  selectContainer: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  selectOptionActive: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectOptionIcon: {
    marginRight: spacing.md,
  },
  selectOptionText: {
    ...typography.body,
    flex: 1,
  },
  selectOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  proceedButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.fab,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  proceedIcon: {
    marginRight: spacing.sm,
  },
  proceedText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  recordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    minHeight: 400,
  },
  recordVisual: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordPulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.danger,
    opacity: 0.2,
  },
  recordCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordCircleActive: {
    backgroundColor: colors.text,
  },
  durationText: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
  },
  recordHint: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  priorityContainer: {
    gap: spacing.xl,
  },
  durationResult: {
    ...typography.h3,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    ...typography.button,
    color: colors.white,
    fontSize: 20,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoSection: {
    gap: spacing.md,
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
  photoPreviewRow: {
    flexDirection: 'row',
  },
  photoPreviewContainer: {
    marginRight: spacing.sm,
    position: 'relative',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 11,
  },
});
