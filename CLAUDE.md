# BuzzNotes - Beekeeper Voice Notes App

## Project Overview
React Native (Expo) app for beekeepers to manage voice recordings organized by location and beehive. Targets Android + Web.

**Important**: Keep this CLAUDE.md updated after every noteworthy change (new features, architectural decisions, convention changes, pitfalls discovered). This file is the source of truth for the project.

## Tech Stack
- **Framework**: Expo SDK 54 + TypeScript
- **Navigation**: Expo Router v6 (file-based routing in `app/` directory)
- **Backend**: Offline-first (AsyncStorage). Firebase code kept for future cloud sync.
- **Audio**: expo-audio (migrated from deprecated expo-av)
- **Icons**: @expo/vector-icons (Ionicons + MaterialCommunityIcons) — no emojis in UI
- **State**: React Context + useReducer
- **i18n**: i18next (Croatian default, English)
- **Export/Import**: expo-sharing + expo-file-system

## Commands
- `npm start` / `npx expo start` - Start dev server
- `npm run web` - Start for web
- `npm run android` - Start for Android
- `npx tsc --noEmit` - TypeScript type check
- `npx expo export --platform web` - Verify web build

### EAS Build (Android APK/AAB)

`eas.json` has two profiles:
- **`preview`** — builds an APK (directly installable on Android)
- **`production`** — builds AAB (for Play Store upload)

Login first: `npx eas-cli login`

Build APK: `npx eas-cli build --platform android --profile preview`

This runs in the cloud on EAS servers (free tier: 30 builds/month). It will:
1. Upload the project
2. Build the APK (~5-10 min)
3. Return a download link for the `.apk`

Expo account required — sign up free at https://expo.dev/signup

### GitHub Auto-Build

EAS Workflows auto-build on every push to `master`. Config: `.eas/workflows/build-android-preview.yml`.

**Setup (one-time):**
1. Link GitHub repo in Expo dashboard → Project Settings → GitHub
2. Run at least one CLI build first (`npx eas-cli build --platform android --profile preview`)

After that, every push to `master` triggers an APK build in the cloud. Download link appears in Expo dashboard → Builds.

**Skip a build:** Include `[skip eas]` in the commit message.

## Project Structure
- `app/` - Expo Router screens (tabs, location/[id], beehive/[id], record, settings)
- `src/components/` - Reusable UI components
- `src/contexts/` - React Contexts (Data). AuthContext kept for future use.
- `src/services/` - Audio, sync, storage, export/import services
- `src/models/` - TypeScript interfaces and enums
- `src/theme/` - Design system (colors, spacing, typography, shadows)
- `src/i18n/` - Internationalization files (hr, en)
- `src/hooks/` - Custom hooks (useDetailTabBar)
- `src/utils/` - Utility functions (sorting, formatting, confirmDelete)
- `src/screens/` - Screens not currently routed (auth.tsx parked here)

## Conventions
- Voice note dates displayed as `dd.mm.yyyy HH:mm` (24h, using `createdAt` timestamp)
- Croatian is the default language
- Colors follow honey/amber theme (primary: #B8860B, bg: #FAFAF7, surface: #F3F1EC)
- Large touch targets and font sizes for accessibility
- Priority system: HIGH (red #EF5350), MEDIUM (yellow #F9A825), LOW (blue #5C9CE6)
- Priority colors are consistent everywhere — badge, picker, and card tint all use the same scheme
- Priority badge always shows actual priority color, even on solved items (no green override)
- Natural numeric sorting for names (1, 2, 10 not 1, 10, 2)
- No Unicode emojis in UI — all icons use @expo/vector-icons

## UI Design

### Icons
- Locations: `Ionicons: location-outline`
- Beehives: `MaterialCommunityIcons: archive-outline` (represents LR/Langstroth hive box)
- Recordings: `Ionicons: mic` / `mic-outline`
- Priority: `Ionicons: alert-circle` (high), `warning-outline` (medium), `information-circle-outline` (low)
- Navigation: `Ionicons: location-outline` (locations tab), `time-outline` (recent), `flag-outline` (priority)

### Cards & Layout
- Cards: white background with light shadow, `borderRadius.lg` (16px)
- Tabs: underline-style (borderBottom) not filled pills
- Inputs: surface-colored (#F3F1EC) with no border
- Dialogs: borderRadius 20
- FABs: 56x56, bottom: 100, `fab` color (#D4A530)
- Tab bar: white, height 72, paddingBottom 24 (clears gesture bar)

### Voice Note Cards
- **Unsolved**: full card with priority-based background tint (HIGH: #FFECEC, MEDIUM: #FFF8E0, LOW: #ECF2FF)
- **Solved**: compact card, surface background, greyed-out audio player (muted prop)
- **Checkbox toggle**: top-right of both card types, same position
  - Unsolved: `checkmark-circle-outline` (light grey) — tap to mark solved
  - Solved: `checkmark-circle` (green) — tap to unresolve
- Solved items sorted to bottom of lists, separated by a "SOLVED" divider line
- `showSolvedDivider` prop on RecordingCard controls the divider (set on first solved item in list)

### Audio Player
- Play/pause button (44x44 circle), slider with draggable thumb (16px), time display
- Stops after playing once (no auto-restart) — uses `finishedRef` pattern
- `muted` prop: grey play button, grey slider, lighter time text (used on solved cards)
- Slider uses `pageX` + `measureInWindow` for reliable drag (not `locationX`)
- Slider accepts optional `tintColor` prop to override fill/thumb color

## Shared Components & Hooks

Recording list scenes, editable name rows, tab bar config, and delete confirmations are deduplicated into shared pieces:

- **`RecordingListScene`** (`src/components/`) — Sorted FlatList of RecordingCards with solved divider. Used by all Recent/Priority scenes across tabs, location detail, and beehive detail. Props: `recordings`, `sortFn`, `emptyIcon`, optional `getBeehiveName`/`getLocationName` resolvers.
- **`EditableNameRow`** (`src/components/`) — Editable name with icon + delete button. Used by location and beehive detail screens. Props: `name`, `icon` (`'location-outline'` | `'archive-outline'`), `onSave`, `onDelete`.
- **`useDetailTabBar`** (`src/hooks/`) — Shared TabBar config (underline style, primary indicator) for detail screens. Returns `{ renderTabBar }`.
- **`confirmDelete`** (`src/utils/`) — Platform-aware delete confirmation (web `confirm()` / native `Alert.alert`). Used by RecordingCard, location detail, beehive detail.

## Architecture: Offline-First with Local User ID

The app runs fully offline with no Firebase dependency at runtime. A local UUID is generated on first launch and stored in AsyncStorage as `@buzznotes/userId`. This ID is written to the `userId` field on all locations, beehives, and recordings.

### Export/Import
- Export creates a `.buzznotes.json` file with all data + audio files encoded as base64
- Uses `expo-sharing` to share via email, Drive, Bluetooth, etc.
- Import uses `File.pickFileAsync()` from expo-file-system to select a file
- Merge strategy: imported items with same ID update existing (by updatedAt); new items are added

### Files Kept for Future Firebase Integration
- `firebaseConfig.ts` - Firebase config placeholder (initializes Firebase at import time — do NOT import at top level)
- `src/services/firebase.ts` - Firestore CRUD operations (static import of firebaseConfig)
- `src/services/sync.ts` - Bidirectional sync logic (local save functions used actively, no firebase imports)
- `src/contexts/AuthContext.tsx` - Auth context with Firebase Auth (static import of firebaseConfig)
- `src/screens/auth.tsx` - Login/register screen (moved OUT of `app/` to prevent Expo Router from auto-loading it and triggering Firebase initialization)

### Why auth.tsx is in src/screens/ (not app/)
Expo Router auto-discovers and evaluates all files in `app/`. The `auth.tsx` screen imports `AuthContext.tsx` which statically imports `firebaseConfig.ts`, which calls `initializeApp()` and `getAuth()` at module load time. This caused a Firebase Auth warning at startup even though auth isn't used yet. Moving it to `src/screens/` prevents this. Move it back to `app/auth.tsx` when re-enabling Firebase.

## Firebase Collections (future)
- `locations` - Apiary locations
- `beehives` - Beehives within locations
- `recordings` - Voice recordings for beehives

## Future Firebase Migration Procedure

### Phase 1: Firebase Setup
1. Create Firebase project, fill in `firebaseConfig.ts` with real values
2. Enable Email/Password + Google auth in Firebase Console
3. Enable Firestore in test mode
4. Enable Firebase Storage

### Phase 2: Re-enable Auth
1. Move `src/screens/auth.tsx` back to `app/auth.tsx` (fix import paths back to `../src/...`)
2. In `app/_layout.tsx`: Re-add `AuthProvider` wrapping `DataProvider`, re-add `AuthGuard`
3. In `app/_layout.tsx`: Re-add `auth` screen to Stack
4. In `src/contexts/DataContext.tsx`: Add a `migrateLocalDataToUser(firebaseUid)` function that:
   - Reads `@buzznotes/userId` (local UUID)
   - Updates all locations/beehives/recordings where `userId === localUuid` to `userId = firebaseUid`
   - Saves updated data to AsyncStorage
   - Optionally deletes the local UUID key
5. In DataContext: Re-integrate `useAuth()` — if user is logged in, use `user.uid`; if not, fall back to local UUID

### Phase 3: Enable Sync
1. In DataContext: Re-enable `syncData()` which calls `syncWithFirestore()`
2. On first sync after migration, all local data gets pushed to Firestore
3. Subsequent app opens pull/merge from Firestore
4. Export/Import stays available as backup mechanism

### Migration Anchor Points in Code
- `DataContext.tsx`: `getOrCreateLocalUserId()` stores the UUID — this is the key function
- All data models keep `userId` field populated — no data has empty userId
- `sync.ts`: `mergeArrays()` handles merging by ID + updatedAt — works for migration

## Known Pitfalls
- **uuid package**: `crypto.getRandomValues()` not supported on React Native/Hermes. Use `expo-crypto` `randomUUID()` instead.
- **Firebase lazy loading**: `firebaseConfig.ts` initializes Firebase at import time. Any file that imports it will trigger initialization. Use dynamic `import()` for firebase in runtime code, or keep static imports only in files that aren't auto-loaded.
- **expo-av deprecated in SDK 54**: Use `expo-audio` package instead. Hooks: `useAudioPlayer`, `useAudioPlayerStatus`, `useAudioRecorder`.
- **Slider drag**: Must use `pageX` (absolute coordinates) with `measureInWindow`, not `locationX` (relative to element). Store callbacks in refs to avoid stale PanResponder closures.
- **Expo Router auto-evaluation**: All files in `app/` are discovered and evaluated as routes, even if not rendered. Keep files with heavy imports (Firebase) out of `app/` until needed.
- **Import localPath**: When importing recordings, `localPath` must be updated to the new device's file URI after writing the audio file. The original path from the exporting device is invalid.
- **Recorder cleanup**: Always stop the recorder in useEffect cleanup to prevent microphone staying active after screen unmount.
- **Router dismiss+push race**: Use `router.replace()` instead of `router.dismiss()` followed by `router.push()` — they race on Android.
