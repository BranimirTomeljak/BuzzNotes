import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { useData } from '../contexts/DataContext';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

type DialogType = 'location' | 'beehive' | null;

export default function FloatingActions() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locations, addLocation, addBeehive } = useData();
  const [dialog, setDialog] = useState<DialogType>(null);
  const [name, setName] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const handleAddLocation = async () => {
    if (!name.trim()) return;
    await addLocation(name.trim());
    closeDialog();
    Toast.show({ type: 'success', text1: t('common.success'), visibilityTime: 1500 });
  };

  const handleAddBeehive = async () => {
    if (!name.trim() || !selectedLocationId) return;
    await addBeehive(name.trim(), selectedLocationId);
    closeDialog();
    Toast.show({ type: 'success', text1: t('common.success'), visibilityTime: 1500 });
  };

  const openBeehiveDialog = () => {
    if (locations.length === 0) {
      setDialog('location');
      return;
    }
    setSelectedLocationId(locations[0].id);
    setDialog('beehive');
  };

  const openRecord = () => {
    if (locations.length === 0) {
      setDialog('location');
      return;
    }
    router.push('/record');
  };

  const closeDialog = () => {
    setDialog(null);
    setName('');
    setSelectedLocationId(null);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setDialog('location')}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={openBeehiveDialog}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="archive-outline" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, styles.fabPrimary]}
          onPress={openRecord}
          activeOpacity={0.7}
        >
          <Ionicons name="mic" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Add Location Dialog */}
      <Modal visible={dialog === 'location'} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={closeDialog}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.dialogTitle}>{t('locations.add')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('locations.namePlaceholder')}
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
              autoFocus
              onSubmitEditing={handleAddLocation}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeDialog}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
                onPress={handleAddLocation}
                disabled={!name.trim()}
              >
                <Text style={styles.saveText}>{t('common.create')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Beehive Dialog */}
      <Modal visible={dialog === 'beehive'} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={closeDialog}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.dialogTitle}>{t('beehives.add')}</Text>

            <Text style={styles.fieldLabel}>{t('beehives.selectLocation')}</Text>
            <ScrollView style={styles.locationPicker}>
              {locations.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    styles.locationOption,
                    selectedLocationId === loc.id && styles.locationOptionSelected,
                  ]}
                  onPress={() => setSelectedLocationId(loc.id)}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={selectedLocationId === loc.id ? colors.primary : colors.textSecondary}
                    style={styles.locationOptionIcon}
                  />
                  <Text
                    style={[
                      styles.locationOptionText,
                      selectedLocationId === loc.id && styles.locationOptionTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {loc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder={t('beehives.namePlaceholder')}
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
              onSubmitEditing={handleAddBeehive}
              autoFocus
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeDialog}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!name.trim() || !selectedLocationId) && styles.saveButtonDisabled,
                ]}
                onPress={handleAddBeehive}
                disabled={!name.trim() || !selectedLocationId}
              >
                <Text style={styles.saveText}>{t('common.create')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.fab,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.fab,
  },
  fabPrimary: {},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  fieldLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  locationPicker: {
    marginBottom: spacing.lg,
    maxHeight: 200,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  locationOptionSelected: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  locationOptionIcon: {
    marginRight: spacing.sm,
  },
  locationOptionText: {
    ...typography.body,
    flex: 1,
  },
  locationOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  cancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  saveButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    ...typography.button,
    color: colors.white,
  },
});
