import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UseFCMResult } from '../../src/hooks/useFCM';
import type { Schedule } from '../../src/types/schedule';

// Firebase 設定モック
const mockIsFirebaseConfigured = vi.fn(() => true);
vi.mock('../../src/utils/firebase', () => ({
  app: { name: '[DEFAULT]' },
  auth: { currentUser: null },
  db: {},
  isFirebaseConfigured: mockIsFirebaseConfigured,
  messaging: null,
}));

// fcm utils モック
vi.mock('../../src/utils/fcm', () => ({
  isPWA: vi.fn(() => false),
  isIOSSafari: vi.fn(() => false),
  requestPushPermission: vi.fn(),
  getFCMToken: vi.fn(),
  saveFCMTokenToFirestore: vi.fn(),
  getOrCreateDeviceId: vi.fn(() => 'test-device-id'),
}));

const mockRequestPermissionAndRegister = vi.fn();

const defaultUseFCMResult: UseFCMResult = {
  isRegistered: false,
  isLoading: false,
  error: null,
  requestPermissionAndRegister: mockRequestPermissionAndRegister,
};

const schedulesWithReminder: Schedule[] = [
  {
    id: '1',
    title: '会議',
    description: '',
    date: '2026-03-20',
    startTime: '10:00',
    endTime: '11:00',
    color: '#3b82f6',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    reminder: '30min',
  },
];

const schedulesWithoutReminder: Schedule[] = [
  {
    id: '2',
    title: 'タスク',
    description: '',
    date: '2026-03-20',
    startTime: '14:00',
    endTime: '15:00',
    color: '#22c55e',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    reminder: 'none',
  },
];

describe('FCMPermissionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(true);
    sessionStorage.clear();

    // Notification.permission を 'default' に設定
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('Firebase設定あり、permission=default、リマインダーありのとき表示される', async () => {
    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    expect(screen.getByText(/通知を有効にする/)).toBeInTheDocument();
  });

  it('Firebase未設定のとき表示されない', async () => {
    mockIsFirebaseConfigured.mockReturnValue(false);

    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    const { container } = render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('Notification.permission が granted のとき表示されない', async () => {
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: { permission: 'granted' },
    });

    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    const { container } = render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('Notification.permission が denied のとき表示されない', async () => {
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: { permission: 'denied' },
    });

    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    const { container } = render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('リマインダーが none のみのとき表示されない', async () => {
    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    const { container } = render(
      <FCMPermissionBanner
        schedules={schedulesWithoutReminder}
        useFCMResult={defaultUseFCMResult}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('スケジュールが空のとき表示されない', async () => {
    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    const { container } = render(
      <FCMPermissionBanner schedules={[]} useFCMResult={defaultUseFCMResult} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('「後で」ボタンを押すと非表示になり sessionStorage にフラグが保存される', async () => {
    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    const { container } = render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    const laterButton = screen.getByText('後で');
    fireEvent.click(laterButton);

    expect(container.firstChild).toBeNull();
    expect(sessionStorage.getItem('fcm-banner-dismissed')).toBe('true');
  });

  it('sessionStorage にフラグがある場合は表示されない', async () => {
    sessionStorage.setItem('fcm-banner-dismissed', 'true');

    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    const { container } = render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('「通知を有効にする」ボタンを押すと requestPermissionAndRegister が呼ばれる', async () => {
    mockRequestPermissionAndRegister.mockResolvedValue(undefined);

    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    const enableButton = screen.getByText(/通知を有効にする/);
    fireEvent.click(enableButton);

    expect(mockRequestPermissionAndRegister).toHaveBeenCalledTimes(1);
  });

  it('isRegistered が true のとき表示されない', async () => {
    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    const { container } = render(
      <FCMPermissionBanner
        schedules={schedulesWithReminder}
        useFCMResult={{ ...defaultUseFCMResult, isRegistered: true }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('iOS Safari PWA でない場合（isPWA=false && isIOSSafari=true）にガイドテキストが表示される', async () => {
    const { isPWA, isIOSSafari } = await import('../../src/utils/fcm');
    vi.mocked(isPWA).mockReturnValue(false);
    vi.mocked(isIOSSafari).mockReturnValue(true);

    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    expect(screen.getByText(/ホーム画面に追加/)).toBeInTheDocument();
  });

  it('isPWA=true の場合はガイドテキストが表示されない', async () => {
    const { isPWA, isIOSSafari } = await import('../../src/utils/fcm');
    vi.mocked(isPWA).mockReturnValue(true);
    vi.mocked(isIOSSafari).mockReturnValue(false);

    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    expect(screen.queryByText(/ホーム画面に追加/)).toBeNull();
  });

  it('Notification API が利用不可のとき表示されない', async () => {
    const originalNotification = window.Notification;
    // @ts-expect-error - テスト用
    window.Notification = undefined;

    const { FCMPermissionBanner } = await import('../../src/components/FCMPermissionBanner');

    const { container } = render(
      <FCMPermissionBanner schedules={schedulesWithReminder} useFCMResult={defaultUseFCMResult} />
    );

    expect(container.firstChild).toBeNull();

    window.Notification = originalNotification;
  });
});
