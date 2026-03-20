import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// firebase.ts のモック
const mockIsFirebaseConfigured = vi.fn(() => true);
vi.mock('../../src/utils/firebase', () => ({
  app: { name: '[DEFAULT]' },
  auth: { currentUser: null },
  db: {},
  isFirebaseConfigured: mockIsFirebaseConfigured,
  messaging: null,
}));

// reminderApi のモック
const mockScheduleReminder = vi.fn();
const mockCancelReminderApi = vi.fn();
const mockUpdateReminderApi = vi.fn();

vi.mock('../../src/utils/reminderApi', () => ({
  scheduleReminder: mockScheduleReminder,
  cancelReminder: mockCancelReminderApi,
  updateReminder: mockUpdateReminderApi,
}));

// firebase/functions のモック（useCloudReminder内でimportされる場合のため）
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(),
}));

import type { Schedule } from '../../src/types/schedule';

const createMockSchedule = (overrides?: Partial<Schedule>): Schedule => ({
  id: 'schedule-1',
  title: 'テスト予定',
  description: '',
  date: '2026-03-25',
  startTime: '14:00',
  endTime: '15:00',
  color: '#3b82f6',
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
  reminder: '30min',
  ...overrides,
});

describe('useCloudReminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(true);
  });

  describe('初期状態', () => {
    it('loading=false, error=null で初期化される', async () => {
      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('createReminder', () => {
    it('reminder が "none" でない場合、scheduleReminder APIを呼び出してreminderIdを返す', async () => {
      mockScheduleReminder.mockResolvedValue({ reminderId: 'reminder-abc' });

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({ reminder: '30min' });
      let reminderId: string | null = null;

      await act(async () => {
        reminderId = await result.current.createReminder(schedule);
      });

      expect(mockScheduleReminder).toHaveBeenCalledWith({
        scheduleId: schedule.id,
        title: schedule.title,
        reminderTiming: '30min',
        scheduleDate: schedule.date,
        scheduleStartTime: schedule.startTime,
        timezone: 'Asia/Tokyo',
      });
      expect(reminderId).toBe('reminder-abc');
    });

    it('reminder が "none" の場合、APIを呼び出さずnullを返す', async () => {
      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({ reminder: 'none' });
      let reminderId: string | null = 'initial';

      await act(async () => {
        reminderId = await result.current.createReminder(schedule);
      });

      expect(mockScheduleReminder).not.toHaveBeenCalled();
      expect(reminderId).toBeNull();
    });

    it('reminder が undefined の場合、APIを呼び出さずnullを返す', async () => {
      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({ reminder: undefined });
      let reminderId: string | null = 'initial';

      await act(async () => {
        reminderId = await result.current.createReminder(schedule);
      });

      expect(mockScheduleReminder).not.toHaveBeenCalled();
      expect(reminderId).toBeNull();
    });

    it('Firebase未設定の場合、APIを呼び出さずnullを返す', async () => {
      mockIsFirebaseConfigured.mockReturnValue(false);

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({ reminder: '30min' });
      let reminderId: string | null = 'initial';

      await act(async () => {
        reminderId = await result.current.createReminder(schedule);
      });

      expect(mockScheduleReminder).not.toHaveBeenCalled();
      expect(reminderId).toBeNull();
    });

    it('createReminder 中は loading が true になる', async () => {
      let resolveApi: (value: { reminderId: string }) => void;
      mockScheduleReminder.mockReturnValue(
        new Promise<{ reminderId: string }>(resolve => {
          resolveApi = resolve;
        })
      );

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({ reminder: '30min' });

      let createPromise: Promise<string | null>;
      act(() => {
        createPromise = result.current.createReminder(schedule);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveApi!({ reminderId: 'reminder-xyz' });
        await createPromise!;
      });

      expect(result.current.loading).toBe(false);
    });

    it('APIがエラーを返した場合、error が設定されnullを返す', async () => {
      mockScheduleReminder.mockRejectedValue(new Error('Network error'));

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({ reminder: '30min' });
      let reminderId: string | null = 'initial';

      await act(async () => {
        reminderId = await result.current.createReminder(schedule);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
      expect(reminderId).toBeNull();
    });

    it('オフライン時のエラーが error として設定される', async () => {
      mockScheduleReminder.mockRejectedValue(new Error('Failed to fetch'));

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({ reminder: '15min' });

      await act(async () => {
        await result.current.createReminder(schedule);
      });

      expect(result.current.error).toBe('Failed to fetch');
    });

    it('scheduleReminder がnullを返した場合（Firebase未設定）、nullを返す', async () => {
      mockScheduleReminder.mockResolvedValue(null);

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({ reminder: '5min' });
      let reminderId: string | null = 'initial';

      await act(async () => {
        reminderId = await result.current.createReminder(schedule);
      });

      expect(reminderId).toBeNull();
    });
  });

  describe('cancelReminder', () => {
    it('cancelReminder APIを呼び出す', async () => {
      mockCancelReminderApi.mockResolvedValue(null);

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      await act(async () => {
        await result.current.cancelReminder('reminder-123');
      });

      expect(mockCancelReminderApi).toHaveBeenCalledWith('reminder-123');
      expect(result.current.error).toBeNull();
    });

    it('cancelReminder 中は loading が true になる', async () => {
      let resolveApi: () => void;
      mockCancelReminderApi.mockReturnValue(
        new Promise<void>(resolve => {
          resolveApi = resolve;
        })
      );

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      let cancelPromise: Promise<void>;
      act(() => {
        cancelPromise = result.current.cancelReminder('reminder-123');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveApi!();
        await cancelPromise!;
      });

      expect(result.current.loading).toBe(false);
    });

    it('APIがエラーを返した場合、error が設定される', async () => {
      mockCancelReminderApi.mockRejectedValue(new Error('Cancel failed'));

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      await act(async () => {
        await result.current.cancelReminder('reminder-123');
      });

      expect(result.current.error).toBe('Cancel failed');
      expect(result.current.loading).toBe(false);
    });

    it('オフライン時のエラーが error として設定される', async () => {
      mockCancelReminderApi.mockRejectedValue(new Error('Failed to fetch'));

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      await act(async () => {
        await result.current.cancelReminder('reminder-123');
      });

      expect(result.current.error).toBe('Failed to fetch');
    });
  });

  describe('updateReminder', () => {
    it('reminderId が存在する場合、updateReminder APIを呼び出す', async () => {
      mockUpdateReminderApi.mockResolvedValue({ reminderId: 'reminder-new' });

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({
        reminder: '1hour',
        reminderId: 'reminder-old',
      });
      let reminderId: string | null = null;

      await act(async () => {
        reminderId = await result.current.updateReminder(schedule);
      });

      expect(mockUpdateReminderApi).toHaveBeenCalledWith({
        reminderId: 'reminder-old',
        scheduleId: schedule.id,
        title: schedule.title,
        reminderTiming: '1hour',
        scheduleDate: schedule.date,
        scheduleStartTime: schedule.startTime,
        timezone: 'Asia/Tokyo',
      });
      expect(reminderId).toBe('reminder-new');
    });

    it('reminderId が存在しない場合、createReminder と同様に scheduleReminder を呼び出す', async () => {
      mockScheduleReminder.mockResolvedValue({ reminderId: 'reminder-created' });

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({
        reminder: '30min',
        reminderId: undefined,
      });
      let reminderId: string | null = null;

      await act(async () => {
        reminderId = await result.current.updateReminder(schedule);
      });

      expect(mockUpdateReminderApi).not.toHaveBeenCalled();
      expect(mockScheduleReminder).toHaveBeenCalled();
      expect(reminderId).toBe('reminder-created');
    });

    it('Firebase未設定の場合、APIを呼び出さずnullを返す', async () => {
      mockIsFirebaseConfigured.mockReturnValue(false);

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({
        reminder: '30min',
        reminderId: 'reminder-old',
      });
      let reminderId: string | null = 'initial';

      await act(async () => {
        reminderId = await result.current.updateReminder(schedule);
      });

      expect(mockUpdateReminderApi).not.toHaveBeenCalled();
      expect(mockScheduleReminder).not.toHaveBeenCalled();
      expect(reminderId).toBeNull();
    });

    it('APIがエラーを返した場合、error が設定されnullを返す', async () => {
      mockUpdateReminderApi.mockRejectedValue(new Error('Update failed'));

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({
        reminder: '10min',
        reminderId: 'reminder-old',
      });
      let reminderId: string | null = 'initial';

      await act(async () => {
        reminderId = await result.current.updateReminder(schedule);
      });

      expect(result.current.error).toBe('Update failed');
      expect(reminderId).toBeNull();
    });

    it('updateReminder 中は loading が true になる', async () => {
      let resolveApi: (value: { reminderId: string }) => void;
      mockUpdateReminderApi.mockReturnValue(
        new Promise<{ reminderId: string }>(resolve => {
          resolveApi = resolve;
        })
      );

      const { useCloudReminder } = await import('../../src/hooks/useCloudReminder');
      const { result } = renderHook(() => useCloudReminder());

      const schedule = createMockSchedule({
        reminder: '30min',
        reminderId: 'reminder-old',
      });

      let updatePromise: Promise<string | null>;
      act(() => {
        updatePromise = result.current.updateReminder(schedule);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await act(async () => {
        resolveApi!({ reminderId: 'reminder-new' });
        await updatePromise!;
      });

      expect(result.current.loading).toBe(false);
    });
  });
});
