import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase設定が有効かどうかを確認する
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.apiKey !== 'undefined' &&
    firebaseConfig.projectId !== 'undefined'
  );
}

// 二重初期化を防ぐシングルトンパターン
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// FCM Messaging インスタンス（ブラウザサポートチェック後に初期化）
let messaging: ReturnType<typeof getMessaging> | null = null;

isSupported()
  .then(supported => {
    if (supported) {
      messaging = getMessaging(app);
    }
  })
  .catch(() => {
    // Service Worker外環境では無視
  });

export { app, auth, db, messaging };
