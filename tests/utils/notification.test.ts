import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getNotificationPermission,
  isNotificationSupported,
  isPWAMode,
  requestNotificationPermission,
  showNotification,
} from '../../src/utils/notification';

describe('notification utils', () => {
  describe('isNotificationSupported', () => {
    it('should return true when Notification API is supported', () => {
      // Notification APIは既にグローバルに存在する（jsdom or happy-dom）
      expect(isNotificationSupported()).toBe(true);
    });

    it('should return false when Notification API is not supported', () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - テストのため意図的にundefined化
      global.Notification = undefined;

      expect(isNotificationSupported()).toBe(false);

      global.Notification = originalNotification;
    });
  });

  describe('isPWAMode', () => {
    beforeEach(() => {
      // window.matchMediaをモック
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
    });

    it('should return true when display-mode is standalone', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(isPWAMode()).toBe(true);
    });

    it('should return true when navigator.standalone is true (iOS Safari)', () => {
      // @ts-expect-error - iOS Safari専用プロパティ
      navigator.standalone = true;

      expect(isPWAMode()).toBe(true);

      // @ts-expect-error - クリーンアップ
      delete navigator.standalone;
    });

    it('should return false when not in PWA mode', () => {
      expect(isPWAMode()).toBe(false);
    });
  });

  describe('getNotificationPermission', () => {
    it('should return current permission state', () => {
      // デフォルトはdefault
      expect(getNotificationPermission()).toBe('default');
    });

    it('should return "unsupported" when Notification API is not supported', () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - テストのため意図的にundefined化
      global.Notification = undefined;

      expect(getNotificationPermission()).toBe('unsupported');

      global.Notification = originalNotification;
    });
  });

  describe('requestNotificationPermission', () => {
    beforeEach(() => {
      // Notification.requestPermissionをモック
      global.Notification.requestPermission = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should request permission and return "granted"', async () => {
      vi.mocked(Notification.requestPermission).mockResolvedValue('granted');

      const result = await requestNotificationPermission();

      expect(result).toBe('granted');
      expect(Notification.requestPermission).toHaveBeenCalledOnce();
    });

    it('should request permission and return "denied"', async () => {
      vi.mocked(Notification.requestPermission).mockResolvedValue('denied');

      const result = await requestNotificationPermission();

      expect(result).toBe('denied');
    });

    it('should return "unsupported" when Notification API is not supported', async () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - テストのため意図的にundefined化
      global.Notification = undefined;

      const result = await requestNotificationPermission();

      expect(result).toBe('unsupported');

      global.Notification = originalNotification;
    });
  });

  describe('showNotification', () => {
    beforeEach(() => {
      // Notificationコンストラクタをモック
      global.Notification = vi.fn() as unknown as typeof Notification;
      Object.defineProperty(global.Notification, 'permission', {
        writable: true,
        value: 'granted',
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should show notification when permission is granted', () => {
      const title = 'Test Notification';
      const options = { body: 'Test body', icon: '/icon.png' };

      showNotification(title, options);

      expect(Notification).toHaveBeenCalledWith(title, options);
    });

    it('should not show notification when permission is not granted', () => {
      Object.defineProperty(global.Notification, 'permission', {
        writable: true,
        value: 'denied',
      });

      const title = 'Test Notification';

      showNotification(title);

      expect(Notification).not.toHaveBeenCalled();
    });

    it('should not show notification when Notification API is not supported', () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - テストのため意図的にundefined化
      global.Notification = undefined;

      const title = 'Test Notification';

      // エラーが投げられないことを確認
      expect(() => showNotification(title)).not.toThrow();

      global.Notification = originalNotification;
    });
  });
});
