import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth - use getAuth for both web and native
// For native persistence, Firebase JS SDK v12 uses AsyncStorage automatically
// when @react-native-async-storage/async-storage is installed
const auth = getAuth(app);

const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence for Firestore (web only - native has it by default)
if (Platform.OS === 'web') {
  enableIndexedDbPersistence(db).catch(() => {
    // Persistence may fail if multiple tabs are open
  });
}

export { app, auth, db, storage };
