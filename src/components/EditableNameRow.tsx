import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

interface EditableNameRowProps {
  name: string;
  icon: 'location-outline' | 'archive-outline';
  onSave: (newName: string) => void;
  onDelete: () => void;
}

export default function EditableNameRow({ name, icon, onSave, onDelete }: EditableNameRowProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(name);

  const handleSave = useCallback(() => {
    if (input.trim()) {
      onSave(input.trim());
    }
    setEditing(false);
  }, [input, onSave]);

  const handleEdit = useCallback(() => {
    setInput(name);
    setEditing(true);
  }, [name]);

  const renderIcon = () => {
    if (icon === 'archive-outline') {
      return <MaterialCommunityIcons name="archive-outline" size={22} color={colors.primary} />;
    }
    return <Ionicons name="location-outline" size={22} color={colors.primary} />;
  };

  return (
    <View style={styles.nameRow}>
      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.nameInput}
            value={input}
            onChangeText={setInput}
            autoFocus
            onSubmitEditing={handleSave}
          />
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Ionicons name="checkmark" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.nameAndActions}>
          <TouchableOpacity style={styles.nameButton} onPress={handleEdit}>
            <View style={styles.nameWithIcon}>
              {renderIcon()}
              <Text style={styles.name}>{name}</Text>
              <Ionicons name="create-outline" size={18} color={colors.textLight} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
  },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.h2,
    flex: 1,
  },
  nameAndActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameButton: {
    flex: 1,
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
