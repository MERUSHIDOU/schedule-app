import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getFCMToken,
  getOrCreateDeviceId,
  requestPushPermission,
  saveFCMTokenToFirestore,
} from '../utils/fcm';
import { isFirebaseConfigured, messaging } from '../utils/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export interface UseFCMResult {
  isRegistered: boolean;
  isLoading: boolean;
  error: Error | null;
  requestPermissionAndRegister: () => Promise<void>;
}

// FCM トークン取得・Firestore保存を管理するカスタムフック
export function useFCM(userId?: string | null): UseFCMResult {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const didAutoRegister = useRef(false);

  // トークン取得・Firestore保存の共通処理
  const registerToken = useCallback(
    async (swRegistration?: ServiceWorkerRegistration): Promise<boolean> => {
      if (!isFirebaseConfigured() || !messaging) {
        return false;
      }

      try {
        const token = await getFCMToken(messaging, VAPID_KEY ?? '', swRegistration);
        if (userId) {
          await saveFCMTokenToFirestore(userId, token);
        }
        setIsRegistered(true);
        setError(null);
        return true;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return false;
      }
    },
    [userId]
  );

  // マウント時: 既存の permission が granted なら自動でトークン取得
  useEffect(() => {
    if (!isFirebaseConfigured() || !userId || didAutoRegister.current) {
      return;
    }
    if (typeof Notification === 'undefined') {
      return;
    }
    if (Notification.permission !== 'granted') {
      return;
    }

    didAutoRegister.current = true;

    const autoRegister = async () => {
      let swReg: ServiceWorkerRegistration | undefined;
      if (navigator.serviceWorker) {
        try {
          swReg = await navigator.serviceWorker.ready;
        } catch {
          // Service Worker が利用不可の場合は続行
        }
      }
      await registerToken(swReg);
    };

    autoRegister();
  }, [userId, registerToken]);

  // 権限リクエスト → トークン取得 → Firestore保存
  const requestPermissionAndRegister = useCallback(async (): Promise<void> => {
    if (!isFirebaseConfigured()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await requestPushPermission();
      if (permission !== 'granted') {
        return;
      }

      let swReg: ServiceWorkerRegistration | undefined;
      if (navigator.serviceWorker) {
        try {
          swReg = await navigator.serviceWorker.ready;
        } catch {
          // Service Worker が利用不可の場合は続行
        }
      }

      await registerToken(swReg);
    } finally {
      setIsLoading(false);
    }
  }, [registerToken]);

  // デバイスIDを事前に確保
  if (isFirebaseConfigured()) {
    getOrCreateDeviceId();
  }

  return { isRegistered, isLoading, error, requestPermissionAndRegister };
}
