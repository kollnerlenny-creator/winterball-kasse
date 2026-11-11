import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";

// Die vom Nutzer übergebene Firebase Konfiguration
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBAAjMFYg-qwQMAUXw5cMde-2tDwVCKs54",
  authDomain: "kasse-2b24a.firebaseapp.com",
  projectId: "kasse-2b24a",
  storageBucket: "kasse-2b24a.firebasestorage.app",
  messagingSenderId: "504824682975",
  appId: "1:504824682975:web:d8eb739ba678c498184c6a"
};

// Falls im Browser temporär eine andere Konfiguration hinterlegt wurde
export function getActiveFirebaseConfig() {
  try {
    const saved = localStorage.getItem('winterball_custom_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not load custom firebase config:", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export const activeConfig = getActiveFirebaseConfig();

export const app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
export const auth = getAuth(app);

// Use experimentalAutoDetectLongPolling to prevent iframe WebChannel stream transport errors
export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
})();

// Globale App-ID & Pfad im Firestore
export const APP_ID = 'winter-kasse-pro';
export const PATH = `artifacts/${APP_ID}/public/data`;
