import { beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase の functions モック
const mockHttpsCallable = vi.fn();
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: mockHttpsCallable,
}));

// firebase.ts のモック
const mockIsFirebaseConfigured = vi.fn(() => true);
vi.mock('../../src/utils/firebase', () => ({
  app: { name: '[DEFAULT]' },
  auth: { currentUser: null },
  db: {},
  isFirebaseConfigured: mockIsFirebaseConfigured,
  messaging: null,
}));

describe('reminderApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(true);
  });

  describe('scheduleReminder', () => {
    it('Firebase設定済みの場合、scheduleReminder Callableを呼び出す', async () => {
      const mockReminderId = 'reminder-123';
      const mockCallable = vi.fn().mockResolvedValue({ data: { reminderId: mockReminderId } });
      mockHttpsCallable.mockReturnValue(mockCallable);

      const { scheduleReminder } = await import('../../src/utils/reminderApi');

      const params = {
        scheduleId: 'schedule-1',
        title: 'テスト予定',
        reminderTiming: '30min',
        scheduleDate: '2026-03-25',
        scheduleStartTime: '14:00',
        timezone: 'Asia/Tokyo',
      };

      const result = await scheduleReminder(params);

      expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), 'scheduleReminder');
      expect(mockCallable).toHaveBeenCalledWith(params);
      expect(result).toEqual({ reminderId: mockReminderId });
    });

    it('Firebase未設定の場合、nullを返す', async () => {
      mockIsFirebaseConfigured.mockReturnValue(false);

      const { scheduleReminder } = await import('../../src/utils/reminderApi');

      const params = {
        scheduleId: 'schedule-1',
        title: 'テスト予定',
        reminderTiming: '30min',
        scheduleDate: '2026-03-25',
        scheduleStartTime: '14:00',
        timezone: 'Asia/Tokyo',
      };

      const result = await scheduleReminder(params);

      expect(mockHttpsCallable).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('Callable関数がエラーを投げた場合、エラーを再スローする', async () => {
      const mockError = new Error('functions/internal: Internal error');
      const mockCallable = vi.fn().mockRejectedValue(mockError);
      mockHttpsCallable.mockReturnValue(mockCallable);

      const { scheduleReminder } = await import('../../src/utils/reminderApi');

      const params = {
        scheduleId: 'schedule-1',
        title: 'テスト予定',
        reminderTiming: '30min',
        scheduleDate: '2026-03-25',
        scheduleStartTime: '14:00',
        timezone: 'Asia/Tokyo',
      };

      await expect(scheduleReminder(params)).rejects.toThrow('functions/internal: Internal error');
    });

    it('ネットワークエラーの場合、エラーを再スローする', async () => {
      const mockError = new Error('Failed to fetch');
      const mockCallable = vi.fn().mockRejectedValue(mockError);
      mockHttpsCallable.mockReturnValue(mockCallable);

      const { scheduleReminder } = await import('../../src/utils/reminderApi');

      await expect(
        scheduleReminder({
          scheduleId: 'schedule-1',
          title: 'テスト予定',
          reminderTiming: 'atStart',
          scheduleDate: '2026-03-25',
          scheduleStartTime: '09:00',
          timezone: 'Asia/Tokyo',
        })
      ).rejects.toThrow('Failed to fetch');
    });
  });

  describe('cancelReminder', () => {
    it('Firebase設定済みの場合、cancelReminder Callableを呼び出す', async () => {
      const mockCallable = vi.fn().mockResolvedValue({ data: { success: true } });
      mockHttpsCallable.mockReturnValue(mockCallable);

      const { cancelReminder } = await import('../../src/utils/reminderApi');

      await cancelReminder('reminder-123');

      expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), 'cancelReminder');
      expect(mockCallable).toHaveBeenCalledWith({ reminderId: 'reminder-123' });
    });

    it('Firebase未設定の場合、何もせずnullを返す', async () => {
      mockIsFirebaseConfigured.mockReturnValue(false);

      const { cancelReminder } = await import('../../src/utils/reminderApi');

      const result = await cancelReminder('reminder-123');

      expect(mockHttpsCallable).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('Callable関数がエラーを投げた場合、エラーを再スローする', async () => {
      const mockError = new Error('functions/not-found: Reminder not found');
      const mockCallable = vi.fn().mockRejectedValue(mockError);
      mockHttpsCallable.mockReturnValue(mockCallable);

      const { cancelReminder } = await import('../../src/utils/reminderApi');

      await expect(cancelReminder('not-exist-reminder')).rejects.toThrow(
        'functions/not-found: Reminder not found'
      );
    });
  });

  describe('updateReminder', () => {
    it('Firebase設定済みの場合、updateReminder Callableを呼び出す', async () => {
      const mockReminderId = 'reminder-456';
      const mockCallable = vi.fn().mockResolvedValue({ data: { reminderId: mockReminderId } });
      mockHttpsCallable.mockReturnValue(mockCallable);

      const { updateReminder } = await import('../../src/utils/reminderApi');

      const params = {
        reminderId: 'reminder-old',
        scheduleId: 'schedule-1',
        title: '更新されたテスト予定',
        reminderTiming: '1hour',
        scheduleDate: '2026-03-26',
        scheduleStartTime: '15:00',
        timezone: 'Asia/Tokyo',
      };

      const result = await updateReminder(params);

      expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), 'updateReminder');
      expect(mockCallable).toHaveBeenCalledWith(params);
      expect(result).toEqual({ reminderId: mockReminderId });
    });

    it('Firebase未設定の場合、nullを返す', async () => {
      mockIsFirebaseConfigured.mockReturnValue(false);

      const { updateReminder } = await import('../../src/utils/reminderApi');

      const params = {
        reminderId: 'reminder-old',
        scheduleId: 'schedule-1',
        title: '更新されたテスト予定',
        reminderTiming: '1hour',
        scheduleDate: '2026-03-26',
        scheduleStartTime: '15:00',
        timezone: 'Asia/Tokyo',
      };

      const result = await updateReminder(params);

      expect(mockHttpsCallable).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('Callable関数がエラーを投げた場合、エラーを再スローする', async () => {
      const mockError = new Error('functions/unauthenticated: Authentication required');
      const mockCallable = vi.fn().mockRejectedValue(mockError);
      mockHttpsCallable.mockReturnValue(mockCallable);

      const { updateReminder } = await import('../../src/utils/reminderApi');

      await expect(
        updateReminder({
          reminderId: 'reminder-old',
          scheduleId: 'schedule-1',
          title: 'テスト',
          reminderTiming: '5min',
          scheduleDate: '2026-03-26',
          scheduleStartTime: '10:00',
          timezone: 'Asia/Tokyo',
        })
      ).rejects.toThrow('functions/unauthenticated: Authentication required');
    });
  });
});
