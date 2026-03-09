# Deduplication Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate ~490 lines of copy-paste duplication across 3 screen files by extracting 4 shared pieces: RecordingListScene, EditableNameRow, confirmDelete, useDetailTabBar.

**Architecture:** Bottom-up extraction — create the shared utilities/components first, then update each consumer file one at a time. Each consumer update is independently verifiable via `npx tsc --noEmit`.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, react-native-tab-view v4.2.2, i18next

---

### Task 1: Extract `confirmDelete` utility

**Files:**
- Create: `src/utils/confirmDelete.ts`

**Step 1: Create the utility**

```typescript
import { Alert, Platform } from 'react-native';

export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => void,
  cancelText: string,
  deleteText: string,
) {
  if (Platform.OS === 'web') {
    if (confirm(message)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel' },
      { text: deleteText, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors (new file, no consumers yet)

**Step 3: Commit**

```bash
git add src/utils/confirmDelete.ts
git commit -m "refactor: extract confirmDelete utility"
```

---

### Task 2: Extract `useDetailTabBar` hook

**Files:**
- Create: `src/hooks/useDetailTabBar.ts`

Note: Create `src/hooks/` directory first — it doesn't exist yet.

**Step 1: Create the hook**

The identical code lives in `app/location/[id].tsx:278-301` and `app/beehive/[id].tsx:163-186`. Extract it:

```typescript
import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { TabBar, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { colors } from '../theme';

type Route = { key: string; title: string };

export function useDetailTabBar(routes: Route[]) {
  const tabOptions = useMemo(
    () =>
      Object.fromEntries(
        routes.map((route) => [
          route.key,
          { labelStyle: detailTabStyles.tabLabel },
        ])
      ),
    [routes]
  );

  const renderTabBar = useCallback(
    (props: SceneRendererProps & { navigationState: NavigationState<Route> }) => (
      <TabBar
        {...props}
        style={detailTabStyles.tabBar}
        indicatorStyle={detailTabStyles.tabIndicator}
        activeColor={colors.primary}
        inactiveColor={colors.textLight}
        options={tabOptions}
      />
    ),
    [tabOptions]
  );

  return { tabOptions, renderTabBar };
}

export const detailTabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  tabIndicator: {
    backgroundColor: colors.primary,
    height: 2,
  },
  tabLabel: {
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'none',
  },
});
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/hooks/useDetailTabBar.ts
git commit -m "refactor: extract useDetailTabBar hook"
```

---

### Task 3: Extract `EditableNameRow` component

**Files:**
- Create: `src/components/EditableNameRow.tsx`

**Step 1: Create the component**

The identical JSX is in `app/location/[id].tsx:356-390` (icon: `Ionicons location-outline`) and `app/beehive/[id].tsx:243-277` (icon: `MaterialCommunityIcons archive-outline`).

```tsx
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

  const IconComponent = icon === 'archive-outline' ? MaterialCommunityIcons : Ionicons;

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
              <IconComponent name={icon} size={22} color={colors.primary} />
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
```

**Important detail:** `location/[id].tsx` uses `paddingVertical: spacing.md` on nameRow, while `beehive/[id].tsx` uses `paddingTop: spacing.md` (no bottom padding because locationRow follows). To handle this, the component uses `paddingVertical: spacing.md` (the location style). The beehive screen can adjust externally with a wrapper View or we accept the minor spacing difference (it's 12px of bottom padding).

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/EditableNameRow.tsx
git commit -m "refactor: extract EditableNameRow component"
```

---

### Task 4: Extract `RecordingListScene` component

**Files:**
- Create: `src/components/RecordingListScene.tsx`

**Step 1: Create the component**

This replaces 6 near-identical scene components. The differences between them:

| Variant | Data source | Sort | beehiveName? | locationName? | Empty icon |
|---------|-------------|------|-------------|---------------|------------|
| tabs/RecentScene | all recordings | sortByRecent | yes (via getBeehiveById) | yes (via getLocationById) | time-outline |
| tabs/PriorityScene | all recordings | sortByPriority | yes | yes | flag-outline |
| location/RecentScene | getRecordingsForLocation(id) | sortByRecent | yes (via getBeehiveById) | no | time-outline |
| location/PriorityScene | getRecordingsForLocation(id) | sortByPriority | yes | no | flag-outline |
| beehive/RecentScene | getRecordingsForBeehive(id) | sortByRecent | no | no | mic-outline |
| beehive/PriorityScene | getRecordingsForBeehive(id) | sortByPriority | no | no | mic-outline |

```tsx
import React, { useMemo, useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import RecordingCard from './RecordingCard';
import EmptyState from './EmptyState';
import { Recording, Priority } from '../models/types';
import { spacing } from '../theme';

interface RecordingListSceneProps {
  recordings: Recording[];
  sortFn: (recordings: Recording[]) => Recording[];
  emptyIcon: React.ReactNode;
  getBeehiveName?: (beehiveId: string) => string | undefined;
  getLocationName?: (locationId: string) => string | undefined;
}

export default function RecordingListScene({
  recordings,
  sortFn,
  emptyIcon,
  getBeehiveName,
  getLocationName,
}: RecordingListSceneProps) {
  const { t } = useTranslation();
  const { updateRecording, deleteRecording } = useData();

  const sorted = useMemo(() => sortFn(recordings), [recordings, sortFn]);

  const firstSolvedId = useMemo(
    () => sorted.find((r) => r.solved)?.id ?? null,
    [sorted]
  );

  const renderItem = useCallback(
    ({ item }: { item: Recording }) => (
      <RecordingCard
        recording={item}
        beehiveName={getBeehiveName?.(item.beehiveId)}
        locationName={getLocationName?.(item.locationId)}
        showSolvedDivider={item.id === firstSolvedId}
        onUpdatePriority={(priority: Priority) => updateRecording(item.id, { priority })}
        onToggleSolved={() => updateRecording(item.id, { solved: !item.solved })}
        onDelete={() => deleteRecording(item.id)}
        onPlay={() => updateRecording(item.id, { lastListenedAt: Date.now() })}
      />
    ),
    [getBeehiveName, getLocationName, firstSolvedId, updateRecording, deleteRecording]
  );

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <EmptyState
          icon={emptyIcon}
          title={t('recordings.empty')}
          description={t('recordings.emptyDesc')}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
    paddingBottom: 100,
  },
});
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/RecordingListScene.tsx
git commit -m "refactor: extract RecordingListScene component"
```

---

### Task 5: Update `src/components/RecordingCard.tsx` — use `confirmDelete`

**Files:**
- Modify: `src/components/RecordingCard.tsx:1-9` (imports), `src/components/RecordingCard.tsx:42-53` (handleDelete)

**Step 1: Replace the confirm pattern**

Add import at top:
```typescript
import { confirmDelete } from '../utils/confirmDelete';
```

Remove `Alert` and `Platform` from react-native import (line 2). `Alert` and `Platform` are no longer needed in this file.

Replace `handleDelete` (lines 42-53):
```typescript
// BEFORE:
const handleDelete = useCallback(() => {
    if (Platform.OS === 'web') {
      if (confirm(t('recordings.deleteConfirm'))) {
        onDelete();
      }
    } else {
      Alert.alert(t('recordings.delete'), t('recordings.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: onDelete },
      ]);
    }
  }, [onDelete, t]);

// AFTER:
const handleDelete = useCallback(() => {
    confirmDelete(
      t('recordings.delete'),
      t('recordings.deleteConfirm'),
      onDelete,
      t('common.cancel'),
      t('common.delete'),
    );
  }, [onDelete, t]);
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/RecordingCard.tsx src/utils/confirmDelete.ts
git commit -m "refactor: RecordingCard uses confirmDelete utility"
```

---

### Task 6: Update `app/(tabs)/index.tsx` — use `RecordingListScene`

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Step 1: Replace RecentScene and PriorityScene**

Replace the `RecentScene` function (lines 85-143) with:

```tsx
function RecentScene() {
  const { recordings, getBeehiveById, getLocationById } = useData();

  const getBeehiveName = useCallback(
    (beehiveId: string) => getBeehiveById(beehiveId)?.name,
    [getBeehiveById]
  );
  const getLocationName = useCallback(
    (locationId: string) => getLocationById(locationId)?.name,
    [getLocationById]
  );

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByRecent}
      emptyIcon={<Ionicons name="time-outline" size={40} color={colors.textLight} />}
      getBeehiveName={getBeehiveName}
      getLocationName={getLocationName}
    />
  );
}
```

Replace the `PriorityScene` function (lines 145-203) with:

```tsx
function PriorityScene() {
  const { recordings, getBeehiveById, getLocationById } = useData();

  const getBeehiveName = useCallback(
    (beehiveId: string) => getBeehiveById(beehiveId)?.name,
    [getBeehiveById]
  );
  const getLocationName = useCallback(
    (locationId: string) => getLocationById(locationId)?.name,
    [getLocationById]
  );

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByPriority}
      emptyIcon={<Ionicons name="flag-outline" size={40} color={colors.textLight} />}
      getBeehiveName={getBeehiveName}
      getLocationName={getLocationName}
    />
  );
}
```

Update imports at top:
- Add: `import RecordingListScene from '../../src/components/RecordingListScene';`
- Remove: `import RecordingCard from '../../src/components/RecordingCard';` (no longer used here)
- Remove: `import { Recording, Priority } from '../../src/models/types';` — keep only `Location` if still needed
- Keep: `import { sortByRecent, sortByPriority } from '../../src/utils/sorting';`
- The `useMemo` import can be removed from React if no longer used (check — LocationsScene still uses it, so keep it)
- Remove `RefreshControl` only if unused (check — LocationsScene still uses it, so keep it)

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "refactor: tabs/index uses RecordingListScene"
```

---

### Task 7: Update `app/location/[id].tsx` — use all 4 extractions

**Files:**
- Modify: `app/location/[id].tsx`

**Step 1: Replace RecentScene and PriorityScene**

Replace `RecentScene` (lines 107-152) with:

```tsx
function RecentScene({ locationId }: { locationId: string }) {
  const { getRecordingsForLocation, getBeehiveById } = useData();
  const recordings = getRecordingsForLocation(locationId);
  const getBeehiveName = useCallback(
    (beehiveId: string) => getBeehiveById(beehiveId)?.name,
    [getBeehiveById]
  );

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByRecent}
      emptyIcon={<Ionicons name="time-outline" size={40} color={colors.textLight} />}
      getBeehiveName={getBeehiveName}
    />
  );
}
```

Replace `PriorityScene` (lines 154-199) with:

```tsx
function PriorityScene({ locationId }: { locationId: string }) {
  const { getRecordingsForLocation, getBeehiveById } = useData();
  const recordings = getRecordingsForLocation(locationId);
  const getBeehiveName = useCallback(
    (beehiveId: string) => getBeehiveById(beehiveId)?.name,
    [getBeehiveById]
  );

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByPriority}
      emptyIcon={<Ionicons name="flag-outline" size={40} color={colors.textLight} />}
      getBeehiveName={getBeehiveName}
    />
  );
}
```

**Step 2: Replace editable name JSX with EditableNameRow**

In `LocationDetail` component, replace the nameRow JSX block (lines 356-390) with:

```tsx
<EditableNameRow
  name={location.name}
  icon="location-outline"
  onSave={(newName) => updateLocation(location.id, { name: newName })}
  onDelete={handleDelete}
/>
```

Remove from state: `editingName`, `nameInput`, `handleSaveName` callback. These are now internal to EditableNameRow.

**Step 3: Replace handleDelete with confirmDelete**

```typescript
// BEFORE (lines 310-324):
const handleDelete = useCallback(() => {
    const doDelete = () => {
      deleteLocation(id);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (confirm(t('locations.deleteConfirm'))) doDelete();
    } else {
      Alert.alert(t('locations.delete'), t('locations.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [id, deleteLocation, router, t]);

// AFTER:
const handleDelete = useCallback(() => {
    confirmDelete(
      t('locations.delete'),
      t('locations.deleteConfirm'),
      () => { deleteLocation(id); router.back(); },
      t('common.cancel'),
      t('common.delete'),
    );
  }, [id, deleteLocation, router, t]);
```

**Step 4: Replace tab bar setup with useDetailTabBar**

Remove: `tabOptions` useMemo (lines 278-287), `renderTabBar` useCallback (lines 289-301), and the 3 tab bar styles (`tabBarTop`, `tabIndicator`, `tabLabelTop`).

Add:
```typescript
const { renderTabBar } = useDetailTabBar(routes);
```

**Step 5: Update imports**

Add:
```typescript
import RecordingListScene from '../../src/components/RecordingListScene';
import EditableNameRow from '../../src/components/EditableNameRow';
import { confirmDelete } from '../../src/utils/confirmDelete';
import { useDetailTabBar } from '../../src/hooks/useDetailTabBar';
```

Remove (no longer used in this file):
- `RecordingCard` import
- `Alert`, `Platform` from react-native import (unless Platform is used elsewhere — check: it's not)
- `TextInput` from react-native import (moved into EditableNameRow)
- `Recording`, `Priority` from models/types import
- `TabBar`, `NavigationState` from react-native-tab-view (only `TabView`, `SceneRendererProps` still needed for renderScene)

Actually `SceneRendererProps` is still needed in `renderScene`. And `NavigationState` is NOT needed (it was only used in renderTabBar type). Keep `TabView` and `SceneRendererProps`.

**Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 7: Commit**

```bash
git add app/location/\[id\].tsx
git commit -m "refactor: location detail uses shared components"
```

---

### Task 8: Update `app/beehive/[id].tsx` — use all 4 extractions

**Files:**
- Modify: `app/beehive/[id].tsx`

**Step 1: Replace RecentScene and PriorityScene**

Replace `RecentScene` (lines 27-68) with:

```tsx
function RecentScene({ beehiveId }: { beehiveId: string }) {
  const { getRecordingsForBeehive } = useData();
  const recordings = getRecordingsForBeehive(beehiveId);

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByRecent}
      emptyIcon={<Ionicons name="mic-outline" size={40} color={colors.textLight} />}
    />
  );
}
```

Replace `PriorityScene` (lines 70-111) with:

```tsx
function PriorityScene({ beehiveId }: { beehiveId: string }) {
  const { getRecordingsForBeehive } = useData();
  const recordings = getRecordingsForBeehive(beehiveId);

  return (
    <RecordingListScene
      recordings={recordings}
      sortFn={sortByPriority}
      emptyIcon={<Ionicons name="mic-outline" size={40} color={colors.textLight} />}
    />
  );
}
```

**Step 2: Replace editable name JSX with EditableNameRow**

Replace the nameRow JSX block (lines 243-277) with:

```tsx
<EditableNameRow
  name={beehive.name}
  icon="archive-outline"
  onSave={(newName) => updateBeehive(beehive.id, { name: newName })}
  onDelete={handleDelete}
/>
```

Remove from state: `editingName`, `nameInput`, `handleSaveName` callback.

**Step 3: Replace handleDelete with confirmDelete**

```typescript
// AFTER:
const handleDelete = useCallback(() => {
    confirmDelete(
      t('beehives.delete'),
      t('beehives.deleteConfirm'),
      () => { deleteBeehive(id); router.back(); },
      t('common.cancel'),
      t('common.delete'),
    );
  }, [id, deleteBeehive, router, t]);
```

**Step 4: Replace tab bar setup with useDetailTabBar**

Remove: `tabOptions` useMemo (lines 163-172), `renderTabBar` useCallback (lines 174-186), and the 3 tab bar styles (`tabBarTop`, `tabIndicator`, `tabLabelTop`).

Add:
```typescript
const { renderTabBar } = useDetailTabBar(routes);
```

**Step 5: Update imports**

Add:
```typescript
import RecordingListScene from '../../src/components/RecordingListScene';
import EditableNameRow from '../../src/components/EditableNameRow';
import { confirmDelete } from '../../src/utils/confirmDelete';
import { useDetailTabBar } from '../../src/hooks/useDetailTabBar';
```

Remove (no longer used):
- `RecordingCard` import
- `Alert`, `Platform`, `TextInput` from react-native import
- `Recording`, `Priority` from models/types
- `TabBar`, `NavigationState` from react-native-tab-view (keep `TabView`, `SceneRendererProps`)
- `sceneStyles` StyleSheet (list style is now in RecordingListScene)

**Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 7: Commit**

```bash
git add app/beehive/\[id\].tsx
git commit -m "refactor: beehive detail uses shared components"
```

---

### Task 9: Final verification

**Step 1: Full type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 2: Web build**

Run: `npx expo export --platform web`
Expected: Bundle succeeds

**Step 3: Verify no unused imports/files**

Check that `RecordingCard` is no longer imported by any screen file (only by `RecordingListScene`):

```bash
grep -r "import RecordingCard" app/ --include="*.tsx"
```
Expected: no matches (all uses go through RecordingListScene now)

**Step 4: Final commit if any cleanup needed**

---

## Summary of new files

| File | Type | Purpose |
|------|------|---------|
| `src/utils/confirmDelete.ts` | Utility | Platform-aware delete confirmation |
| `src/hooks/useDetailTabBar.ts` | Hook | Shared TabBar config for detail screens |
| `src/components/EditableNameRow.tsx` | Component | Editable name + delete row |
| `src/components/RecordingListScene.tsx` | Component | Sorted FlatList of RecordingCards |
