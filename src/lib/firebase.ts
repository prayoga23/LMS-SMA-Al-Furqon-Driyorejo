import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'lms-sma-al-furqon.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lms-sma-al-furqon',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'lms-sma-al-furqon.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!firebaseConfig.apiKey) {
    return null;
  }
  return !getApps().length ? initializeApp(firebaseConfig) : getApp();
};

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.apiKey) return null;
  try {
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    const app = getFirebaseApp();
    if (!app) return null;
    return getMessaging(app);
  } catch (err) {
    console.warn('[Firebase] Messaging initialization skipped:', err);
    return null;
  }
};
