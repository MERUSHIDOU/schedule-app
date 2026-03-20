import { deleteField, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { Messaging } from 'firebase/messaging';
import { getToken } from 'firebase/messaging';
import { db } from './firebase';

const DEVICE_ID_KEY = 'fcm-device-id';

// PWAとして動作しているか判定（スタンドアロンモード）
export function isPWA(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(display-mode: standalone)').matches;
}

// iOS Safari かどうかを判定
export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  // Chrome や CriOS（Chrome on iOS）を除外
  const isNotChrome = !/CriOS/.test(ua);
  // Safari の WebKit ベースかつ Mobile
  const isSafariUA = /Safari/.test(ua) && !/Chrome/.test(ua);
  return isIOS && isNotChrome && isSafariUA;
}

// デバイスIDを取得または新規生成して localStorage に保存する
export function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const newId = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

// Notification API の権限をリクエストする
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

// FCM トークンを取得する
export async function getFCMToken(
  messaging: Messaging,
  vapidKey: string,
  swRegistration?: ServiceWorkerRegistration
): Promise<string> {
  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: swRegistration,
  });
}

// Firestore にFCMトークンを保存する
export async function saveFCMTokenToFirestore(userId: string, token: string): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      fcmTokens: {
        [deviceId]: {
          token,
          userAgent: navigator.userAgent,
          updatedAt: serverTimestamp(),
        },
      },
    },
    { merge: true }
  );
}

// Firestore からFCMトークンを削除する
export async function removeFCMTokenFromFirestore(userId: string, deviceId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    [`fcmTokens.${deviceId}`]: deleteField(),
  });
}
