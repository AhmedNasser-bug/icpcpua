import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDI9zgWc5_f_9z2-aRixG4MCr9gxBBY8BA',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'icpc-pua.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'icpc-pua',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'icpc-pua.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '610084876739',
  appId: env.VITE_FIREBASE_APP_ID || '1:610084876739:web:b2020d1317a7fcb2858d76',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-VP3J196SB4',
};

export const ADMIN_EMAILS = new Set(
  String(env.VITE_ADMIN_EMAILS || 'enjoyplayax@gmail.com,admin@icpcpua.com')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
);

let cachedApp = null;
let cachedAuth = null;
let cachedDb = null;

export function getFirebaseClients() {
  if (!cachedApp) {
    cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    cachedAuth = getAuth(cachedApp);
    cachedDb = getFirestore(cachedApp);
  }
  return { app: cachedApp, auth: cachedAuth, db: cachedDb };
}

export async function signInWithOAuthProvider(providerName) {
  const { auth } = getFirebaseClients();
  const provider =
    providerName === 'github' ? new GithubAuthProvider() : new GoogleAuthProvider();
  if (providerName === 'github') {
    provider.addScope('read:user');
    provider.addScope('user:email');
  } else {
    provider.setCustomParameters({ prompt: 'select_account' });
  }
  const credential = await signInWithPopup(auth, provider);
  const idToken = await credential.user.getIdToken();
  return {
    uid: credential.user.uid,
    email: (credential.user.email || `${credential.user.uid}@users.icpcpua.local`).toLowerCase(),
    name:
      credential.user.displayName ||
      credential.user.email?.split('@')[0] ||
      'ICPC Member',
    pictureUrl: credential.user.photoURL || '',
    providerId: providerName,
    idToken,
  };
}

export async function signOutFirebase() {
  try {
    const { auth } = getFirebaseClients();
    await firebaseSignOut(auth);
  } catch {
    // Ignore when running in offline/local storage mode.
  }
}
