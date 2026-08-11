import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
// @ts-expect-error - The function exists in the React Native bundle but is missing from Firebase's generic TS definitions.
import { getReactNativePersistence } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const hasFirebaseConfig = missingFirebaseKeys.length === 0;

let firebaseApp = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (hasFirebaseConfig) {
  // Check if Firebase is already initialized to prevent errors during Expo Fast Refresh
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    if (Platform.OS === 'web') {
      auth = initializeAuth(firebaseApp);
    } else {
      auth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });
    }
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
  }
  
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
}

export { auth, db, storage, firebaseApp, hasFirebaseConfig };

export const getFirebaseConfigError = () =>
  hasFirebaseConfig
    ? null
    : `Firebase is not configured. Add these Expo env vars: ${missingFirebaseKeys.join(", ")}`;