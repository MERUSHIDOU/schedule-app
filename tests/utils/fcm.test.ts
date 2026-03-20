import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase messaging モック
vi.mock('firebase/messaging', () => ({
  getToken: vi.fn(),
  deleteToken: vi.fn(),
}));

// firebase.ts のモック（messaging を含む）
vi.mock('../../src/utils/firebase', () => ({
  app: { name: '[DEFAULT]' },
  auth: { currentUser: null },
  db: {},
  isFirebaseConfigured: vi.fn(() => true),
  messaging: { app: { name: '[DEFAULT]' } },
}));

// Firestore モック
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteField: vi.fn(() => ({ type: 'deleteField' })),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  getFirestore: vi.fn(() => ({})),
}));

describe('isPWA', () => {
  it('standaloneモードのとき true を返す', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { isPWA } = await import('../../src/utils/fcm');
    expect(isPWA()).toBe(true);
  });

  it('ブラウザモードのとき false を返す', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { isPWA } = await import('../../src/utils/fcm');
    expect(isPWA()).toBe(false);
  });

  it('matchMediaが利用不可のとき false を返す', async () => {
    const originalMatchMedia = window.matchMedia;
    // @ts-expect-error - テスト用にundefinedを設定
    window.matchMedia = undefined;

    const { isPWA } = await import('../../src/utils/fcm');
    expect(isPWA()).toBe(false);

    window.matchMedia = originalMatchMedia;
  });
});

describe('isIOSSafari', () => {
  const originalNavigator = window.navigator;

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: originalNavigator,
    });
  });

  it('iOS Safari のとき true を返す', async () => {
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: {
        ...originalNavigator,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
      },
    });

    const { isIOSSafari } = await import('../../src/utils/fcm');
    expect(isIOSSafari()).toBe(true);
  });

  it('Android Chrome のとき false を返す', async () => {
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: {
        ...originalNavigator,
        userAgent:
          'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
      },
    });

    const { isIOSSafari } = await import('../../src/utils/fcm');
    expect(isIOSSafari()).toBe(false);
  });

  it('Desktop Chrome のとき false を返す', async () => {
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: {
        ...originalNavigator,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
      },
    });

    const { isIOSSafari } = await import('../../src/utils/fcm');
    expect(isIOSSafari()).toBe(false);
  });

  it('iPad Safari のとき true を返す', async () => {
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: {
        ...originalNavigator,
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
      },
    });

    const { isIOSSafari } = await import('../../src/utils/fcm');
    expect(isIOSSafari()).toBe(true);
  });
});

describe('getOrCreateDeviceId', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('localStorageにデバイスIDがない場合は新規生成して保存する', async () => {
    const mockUuid = 'test-device-uuid-123';
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      writable: true,
      value: { ...originalCrypto, randomUUID: vi.fn(() => mockUuid) },
    });

    const { getOrCreateDeviceId } = await import('../../src/utils/fcm');
    const deviceId = getOrCreateDeviceId();

    expect(deviceId).toBe(mockUuid);
    expect(localStorage.getItem('fcm-device-id')).toBe(mockUuid);

    Object.defineProperty(globalThis, 'crypto', {
      writable: true,
      value: originalCrypto,
    });
  });

  it('localStorageに既存のデバイスIDがある場合はそれを返す', async () => {
    const existingId = 'existing-device-id';
    localStorage.setItem('fcm-device-id', existingId);

    const { getOrCreateDeviceId } = await import('../../src/utils/fcm');
    const deviceId = getOrCreateDeviceId();

    expect(deviceId).toBe(existingId);
  });
});

describe('requestPushPermission', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('権限が granted のとき "granted" を返す', async () => {
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
    });

    const { requestPushPermission } = await import('../../src/utils/fcm');
    const result = await requestPushPermission();
    expect(result).toBe('granted');
  });

  it('権限が denied のとき "denied" を返す', async () => {
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied'),
      },
    });

    const { requestPushPermission } = await import('../../src/utils/fcm');
    const result = await requestPushPermission();
    expect(result).toBe('denied');
  });

  it('Notification APIが利用不可のとき "denied" を返す', async () => {
    const originalNotification = window.Notification;
    // @ts-expect-error - テスト用にundefinedを設定
    window.Notification = undefined;

    const { requestPushPermission } = await import('../../src/utils/fcm');
    const result = await requestPushPermission();
    expect(result).toBe('denied');

    window.Notification = originalNotification;
  });
});

describe('getFCMToken', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('FCMトークンを取得して返す', async () => {
    const { getToken } = await import('firebase/messaging');
    const mockToken = 'mock-fcm-token-abc123';
    vi.mocked(getToken).mockResolvedValue(mockToken);

    const { getFCMToken } = await import('../../src/utils/fcm');
    const mockMessaging = { app: { name: '[DEFAULT]' } } as never;
    const mockSwReg = {} as ServiceWorkerRegistration;
    const token = await getFCMToken(mockMessaging, 'vapid-key', mockSwReg);

    expect(token).toBe(mockToken);
    expect(getToken).toHaveBeenCalledWith(mockMessaging, {
      vapidKey: 'vapid-key',
      serviceWorkerRegistration: mockSwReg,
    });
  });

  it('トークン取得に失敗した場合はエラーをスローする', async () => {
    const { getToken } = await import('firebase/messaging');
    vi.mocked(getToken).mockRejectedValue(new Error('Token fetch failed'));

    const { getFCMToken } = await import('../../src/utils/fcm');
    const mockMessaging = { app: { name: '[DEFAULT]' } } as never;
    const mockSwReg = {} as ServiceWorkerRegistration;

    await expect(getFCMToken(mockMessaging, 'vapid-key', mockSwReg)).rejects.toThrow(
      'Token fetch failed'
    );
  });

  it('serviceWorkerRegistrationなしでも呼び出せる', async () => {
    const { getToken } = await import('firebase/messaging');
    const mockToken = 'mock-token-no-sw';
    vi.mocked(getToken).mockResolvedValue(mockToken);

    const { getFCMToken } = await import('../../src/utils/fcm');
    const mockMessaging = { app: { name: '[DEFAULT]' } } as never;
    const token = await getFCMToken(mockMessaging, 'vapid-key');

    expect(token).toBe(mockToken);
    expect(getToken).toHaveBeenCalledWith(mockMessaging, {
      vapidKey: 'vapid-key',
      serviceWorkerRegistration: undefined,
    });
  });
});

describe('saveFCMTokenToFirestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.resetModules();
  });

  it('Firestoreにトークンを保存する', async () => {
    const { setDoc, doc } = await import('firebase/firestore');
    const mockDocRef = { path: 'users/test-user' };
    vi.mocked(doc).mockReturnValue(mockDocRef as never);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    localStorage.setItem('fcm-device-id', 'test-device-id');

    const { saveFCMTokenToFirestore } = await import('../../src/utils/fcm');
    await saveFCMTokenToFirestore('test-user', 'test-fcm-token');

    expect(setDoc).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({
        fcmTokens: expect.objectContaining({
          'test-device-id': expect.objectContaining({
            token: 'test-fcm-token',
            userAgent: expect.any(String),
          }),
        }),
      }),
      { merge: true }
    );
  });

  it('Firestore保存に失敗した場合はエラーをスローする', async () => {
    const { setDoc, doc } = await import('firebase/firestore');
    vi.mocked(doc).mockReturnValue({} as never);
    vi.mocked(setDoc).mockRejectedValue(new Error('Firestore error'));

    const { saveFCMTokenToFirestore } = await import('../../src/utils/fcm');
    await expect(saveFCMTokenToFirestore('user-id', 'token')).rejects.toThrow('Firestore error');
  });
});

describe('removeFCMTokenFromFirestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('指定したデバイスIDのトークンをFirestoreから削除する', async () => {
    const { updateDoc, doc } = await import('firebase/firestore');
    const mockDocRef = { path: 'users/test-user' };
    vi.mocked(doc).mockReturnValue(mockDocRef as never);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    const { removeFCMTokenFromFirestore } = await import('../../src/utils/fcm');
    await removeFCMTokenFromFirestore('test-user', 'device-id-to-remove');

    expect(updateDoc).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({
        'fcmTokens.device-id-to-remove': expect.anything(),
      })
    );
  });

  it('削除に失敗した場合はエラーをスローする', async () => {
    const { updateDoc, doc } = await import('firebase/firestore');
    vi.mocked(doc).mockReturnValue({} as never);
    vi.mocked(updateDoc).mockRejectedValue(new Error('Delete failed'));

    const { removeFCMTokenFromFirestore } = await import('../../src/utils/fcm');
    await expect(removeFCMTokenFromFirestore('user-id', 'device-id')).rejects.toThrow(
      'Delete failed'
    );
  });
});
