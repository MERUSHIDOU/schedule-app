import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotification } from '../../src/hooks/useNotification';
import type { Schedule } from '../../src/types/schedule';
import * as notificationUtils from '../../src/utils/notification';
import * as notificationScheduler from '../../src/utils/notificationScheduler';

// モジュールをモック
vi.mock('../../src/utils/notification');
vi.mock('../../src/utils/notificationScheduler');

describe('useNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック実装
    vi.mocked(notificationUtils.isNotificationSupported).mockReturnValue(true);
    vi.mocked(notificationUtils.isPWAMode).mockReturnValue(true);
    vi.mocked(notificationUtils.getNotificationPermission).mockReturnValue('default');
    vi.mocked(notificationUtils.requestNotificationPermission).mockResolvedValue('granted');
    vi.mocked(notificationScheduler.scheduleNotification).mockReturnValue('timer-1');
    vi.mocked(notificationScheduler.cancelNotification).mockReturnValue(undefined);
    vi.mocked(notificationScheduler.rescheduleAllNotifications).mockReturnValue(undefined);
  });

  it('should return notification permission and support status', () => {
    const { result } = renderHook(() => useNotification());

    expect(result.current.permission).toBe('default');
    expect(result.current.isPWAMode).toBe(true);
    expect(result.current.isSupported).toBe(true);
  });

  it('should request permission when requestPermission is called', async () => {
    const { result } = renderHook(() => useNotification());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(notificationUtils.requestNotificationPermission).toHaveBeenCalledOnce();
  });

  it('should update permission state after requesting permission', async () => {
    vi.mocked(notificationUtils.requestNotificationPermission).mockResolvedValue('granted');

    const { result } = renderHook(() => useNotification());

    await act(async () => {
      await result.current.requestPermission();
    });

    // 許可後、permissionが更新される
    expect(result.current.permission).toBe('granted');
  });

  it('should schedule notification for a schedule', () => {
    const { result } = renderHook(() => useNotification());

    const schedule: Schedule = {
      id: '1',
      title: 'Test',
      description: 'Test desc',
      date: '2026-01-25',
      startTime: '14:00',
      endTime: '15:00',
      color: '#3b82f6',
      createdAt: '2026-01-25T10:00:00Z',
      updatedAt: '2026-01-25T10:00:00Z',
      notification: { timing: '15min' },
    };

    act(() => {
      result.current.scheduleForSchedule(schedule);
    });

    expect(notificationScheduler.scheduleNotification).toHaveBeenCalledWith(schedule);
  });

  it('should cancel notification for a schedule', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.cancelForSchedule('1');
    });

    expect(notificationScheduler.cancelNotification).toHaveBeenCalledWith('1');
  });

  it('should reschedule all notifications', () => {
    const { result } = renderHook(() => useNotification());

    const schedules: Schedule[] = [
      {
        id: '1',
        title: 'Test 1',
        description: '',
        date: '2026-01-25',
        startTime: '14:00',
        endTime: '15:00',
        color: '#3b82f6',
        createdAt: '2026-01-25T10:00:00Z',
        updatedAt: '2026-01-25T10:00:00Z',
        notification: { timing: '15min' },
      },
    ];

    act(() => {
      result.current.rescheduleAll(schedules);
    });

    expect(notificationScheduler.rescheduleAllNotifications).toHaveBeenCalledWith(schedules);
  });

  it('should return unsupported when Notification API is not supported', () => {
    vi.mocked(notificationUtils.isNotificationSupported).mockReturnValue(false);
    vi.mocked(notificationUtils.getNotificationPermission).mockReturnValue('unsupported');

    const { result } = renderHook(() => useNotification());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe('unsupported');
  });

  it('should return false for isPWAMode when not in PWA mode', () => {
    vi.mocked(notificationUtils.isPWAMode).mockReturnValue(false);

    const { result } = renderHook(() => useNotification());

    expect(result.current.isPWAMode).toBe(false);
  });
});
