import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// firebase.ts のモック
const mockIsFirebaseConfigured = vi.fn(() => true);
vi.mock('../../src/utils/firebase', () => ({
  app: { name: '[DEFAULT]' },
  auth: { currentUser: null },
  db: {},
  isFirebaseConfigured: mockIsFirebaseConfigured,
  messaging: { app: { name: '[DEFAULT]' } },
}));

// fcm utils のモック
const mockRequestPushPermission = vi.fn();
const mockGetFCMToken = vi.fn();
const mockSaveFCMTokenToFirestore = vi.fn();
const mockGetOrCreateDeviceId = vi.fn(() => 'test-device-id');

vi.mock('../../src/utils/fcm', () => ({
  requestPushPermission: mockRequestPushPermission,
  getFCMToken: mockGetFCMToken,
  saveFCMTokenToFirestore: mockSaveFCMTokenToFirestore,
  getOrCreateDeviceId: mockGetOrCreateDeviceId,
  isPWA: vi.fn(() => false),
  isIOSSafari: vi.fn(() => false),
}));

// Firebase messaging のモック
vi.mock('firebase/messaging', () => ({
  onMessage: vi.fn(() => vi.fn()),
  getToken: vi.fn(),
}));

describe('useFCM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(true);

    // Notification API のモック
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
    });

    // serviceWorker のモック
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue({} as ServiceWorkerRegistration),
        ready: Promise.resolve({} as ServiceWorkerRegistration),
      },
    });
  });

  it('初期状態は isRegistered=false, isLoading=false, error=null', async () => {
    const { useFCM } = await import('../../src/hooks/useFCM');
    const { result } = renderHook(() => useFCM());

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.requestPermissionAndRegister).toBe('function');
  });

  it('Firebase未設定時は初期化処理を行わない', async () => {
    mockIsFirebaseConfigured.mockReturnValue(false);

    const { useFCM } = await import('../../src/hooks/useFCM');
    const { result } = renderHook(() => useFCM('test-user'));

    expect(result.current.isRegistered).toBe(false);
    expect(mockGetFCMToken).not.toHaveBeenCalled();
  });

  it('マウント時に permission が granted なら自動でトークン取得する', async () => {
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: { permission: 'granted' },
    });

    mockGetFCMToken.mockResolvedValue('auto-token-123');
    mockSaveFCMTokenToFirestore.mockResolvedValue(undefined);

    const { useFCM } = await import('../../src/hooks/useFCM');
    const { result } = renderHook(() => useFCM('test-user'));

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    expect(mockGetFCMToken).toHaveBeenCalled();
    expect(mockSaveFCMTokenToFirestore).toHaveBeenCalledWith('test-user', 'auto-token-123');
  });

  it('permission が granted でも userId がない場合はトークンを保存しない', async () => {
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: { permission: 'granted' },
    });

    mockGetFCMToken.mockResolvedValue('some-token');

    const { useFCM } = await import('../../src/hooks/useFCM');
    const { result } = renderHook(() => useFCM(null));

    // userIdがnullなので自動取得しない
    await new Promise(r => setTimeout(r, 100));
    expect(mockSaveFCMTokenToFirestore).not.toHaveBeenCalled();
    expect(result.current.isRegistered).toBe(false);
  });

  it('requestPermissionAndRegister が権限を取得してトークンを保存する', async () => {
    mockRequestPushPermission.mockResolvedValue('granted');
    mockGetFCMToken.mockResolvedValue('new-token-456');
    mockSaveFCMTokenToFirestore.mockResolvedValue(undefined);

    const { useFCM } = await import('../../src/hooks/useFCM');
    const { result } = renderHook(() => useFCM('test-user'));

    await act(async () => {
      await result.current.requestPermissionAndRegister();
    });

    expect(mockRequestPushPermission).toHaveBeenCalled();
    expect(mockGetFCMToken).toHaveBeenCalled();
    expect(mockSaveFCMTokenToFirestore).toHaveBeenCalledWith('test-user', 'new-token-456');
    expect(result.current.isRegistered).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('requestPermissionAndRegister が denied のとき isRegistered は false のまま', async () => {
    mockRequestPushPermission.mockResolvedValue('denied');

    const { useFCM } = await import('../../src/hooks/useFCM');
    const { result } = renderHook(() => useFCM('test-user'));

    await act(async () => {
      await result.current.requestPermissionAndRegister();
    });

    expect(mockGetFCMToken).not.toHaveBeenCalled();
    expect(result.current.isRegistered).toBe(false);
  });

  it('requestPermissionAndRegister 実行中は isLoading が true になる', async () => {
    let resolvePermission: (value: NotificationPermission) => void;
    mockRequestPushPermission.mockReturnValue(
      new Promise<NotificationPermission>(resolve => {
        resolvePermission = resolve;
      })
    );

    const { useFCM } = await import('../../src/hooks/useFCM');
    const { result } = renderHook(() => useFCM('test-user'));

    let registerPromise: Promise<void>;
    act(() => {
      registerPromise = result.current.requestPermissionAndRegister();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePermission!('denied');
      await registerPromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('トークン取得に失敗したとき error が設定される', async () => {
    mockRequestPushPermission.mockResolvedValue('granted');
    mockGetFCMToken.mockRejectedValue(new Error('FCM error'));

    const { useFCM } = await import('../../src/hooks/useFCM');
    const { result } = renderHook(() => useFCM('test-user'));

    await act(async () => {
      await result.current.requestPermissionAndRegister();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('FCM error');
    expect(result.current.isRegistered).toBe(false);
  });

  it('Firebase未設定時に requestPermissionAndRegister を呼んでも何も行わない', async () => {
    mockIsFirebaseConfigured.mockReturnValue(false);

    const { useFCM } = await import('../../src/hooks/useFCM');
    const { result } = renderHook(() => useFCM('test-user'));

    await act(async () => {
      await result.current.requestPermissionAndRegister();
    });

    expect(mockRequestPushPermission).not.toHaveBeenCalled();
    expect(result.current.isRegistered).toBe(false);
  });
});
