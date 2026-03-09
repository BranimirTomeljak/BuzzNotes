import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioRecorder } from 'expo-audio';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useData } from '../src/contexts/DataContext';
import PriorityPicker from '../src/components/PriorityPicker';
import { colors, spacing, borderRadius, typography } from '../src/theme';
import { Priority, Location, Beehive } from '../src/models/types';
import { VOICE_NOTE_PRESET, requestPermissions, configureRecordingMode, configurePlaybackMode } from '../src/services/audio';
import { saveRecordingLocally } from '../src/services/storage';
import { formatDuration } from '../src/utils/formatting';

type Step = 'select' | 'record' | 'priority';

export default function RecordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ beehiveId?: string; locationId?: string }>();
  const {
    locations,
    addRecording,
    getBeehivesForLocation,
  } = useData();

  const recorder = useAudioRecorder(VOICE_NOTE_PRESET);

  const [step, setStep] = useState<Step>(
    params.beehiveId && params.locationId ? 'record' : 'select'
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    params.locationId || null
  );
  const [selectedBeehiveId, setSelectedBeehiveId] = useState<string | null>(
    params.beehiveId || null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [saving, setSaving] = useState(false);

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current);
      if (recorder.isRecording) recorder.stop();
    };
  }, [recorder]);

  const availableBeehives = selectedLocationId
    ? getBeehivesForLocation(selectedLocationId)
    : [];

  const handleStartRecording = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Toast.show({ type: 'error', text1: 'Microphone permission required', visibilityTime: 2000 });
      return;
    }

    try {
      await configureRecordingMode();
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setRecordingDuration(0);
      durationInterval.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      Toast.show({ type: 'error', text1: t('common.error'), visibilityTime: 1500 });
    }
  }, [recorder, t]);

  const handleStopRecording = useCallback(async () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    try {
      await recorder.stop();
      await configurePlaybackMode();
      const uri = recorder.uri;
      const duration = Math.round(recorder.currentTime);
      setIsRecording(false);
      setRecordingUri(uri);
      setRecordedDuration(duration);
      setStep('priority');
    } catch {
      setIsRecording(false);
      Toast.show({ type: 'error', text1: t('common.error'), visibilityTime: 1500 });
    }
  }, [recorder, t]);

  const handleSave = useCallback(async () => {
    if (!selectedBeehiveId || !selectedLocationId || !recordingUri || !selectedPriority) return;

    setSaving(true);
    try {
      const tempId = `rec_${Date.now()}`;
      const localPath = await saveRecordingLocally(recordingUri, tempId);

      await addRecording({
        beehiveId: selectedBeehiveId,
        locationId: selectedLocationId,
        localPath,
        duration: recordedDuration,
        priority: selectedPriority,
      });

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
    addRecording,
    router,
    t,
  ]);

  const proceedToRecord = useCallback(() => {
    if (selectedBeehiveId && selectedLocationId) {
      setStep('record');
    }
  }, [selectedBeehiveId, selectedLocationId]);

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
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={48}
                  color={colors.white}
                />
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
});
