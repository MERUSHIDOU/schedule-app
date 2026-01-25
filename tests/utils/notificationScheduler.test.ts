import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Schedule } from '../../src/types/schedule';
import {
  calculateNotificationTime,
  cancelNotification,
  clearAllNotifications,
  getScheduledNotifications,
  rescheduleAllNotifications,
  scheduleNotification,
} from '../../src/utils/notificationScheduler';

describe('notificationScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
    clearAllNotifications();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('calculateNotificationTime', () => {
    const baseSchedule: Schedule = {
      id: '1',
      title: 'テストスケジュール',
      description: 'テスト',
      date: '2026-01-25',
      startTime: '14:00',
      endTime: '15:00',
      color: '#3b82f6',
      createdAt: '2026-01-25T10:00:00Z',
      updatedAt: '2026-01-25T10:00:00Z',
    };

    it('should return null when notification is disabled', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: false, timing: 'onTime' },
      };

      const result = calculateNotificationTime(schedule);

      expect(result).toBeNull();
    });

    it('should return null when notification config is not set', () => {
      const schedule: Schedule = { ...baseSchedule };

      const result = calculateNotificationTime(schedule);

      expect(result).toBeNull();
    });

    it('should calculate notification time for "onTime"', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: true, timing: 'onTime' },
      };

      const result = calculateNotificationTime(schedule);

      expect(result).toEqual(new Date('2026-01-25T14:00:00'));
    });

    it('should calculate notification time for "5min"', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: true, timing: '5min' },
      };

      const result = calculateNotificationTime(schedule);

      expect(result).toEqual(new Date('2026-01-25T13:55:00'));
    });

    it('should calculate notification time for "15min"', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: true, timing: '15min' },
      };

      const result = calculateNotificationTime(schedule);

      expect(result).toEqual(new Date('2026-01-25T13:45:00'));
    });

    it('should calculate notification time for "30min"', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: true, timing: '30min' },
      };

      const result = calculateNotificationTime(schedule);

      expect(result).toEqual(new Date('2026-01-25T13:30:00'));
    });

    it('should calculate notification time for "1hour"', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: true, timing: '1hour' },
      };

      const result = calculateNotificationTime(schedule);

      expect(result).toEqual(new Date('2026-01-25T13:00:00'));
    });

    it('should calculate notification time for "custom"', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: true, timing: 'custom', customMinutes: 45 },
      };

      const result = calculateNotificationTime(schedule);

      expect(result).toEqual(new Date('2026-01-25T13:15:00'));
    });

    it('should return null when custom timing has no customMinutes', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: true, timing: 'custom' },
      };

      const result = calculateNotificationTime(schedule);

      expect(result).toBeNull();
    });
  });

  describe('scheduleNotification', () => {
    const baseSchedule: Schedule = {
      id: '1',
      title: 'テストスケジュール',
      description: 'テスト説明',
      date: '2026-01-25',
      startTime: '14:00',
      endTime: '15:00',
      color: '#3b82f6',
      createdAt: '2026-01-25T10:00:00Z',
      updatedAt: '2026-01-25T10:00:00Z',
    };

    beforeEach(() => {
      // 現在時刻を2026-01-25 12:00に設定
      vi.setSystemTime(new Date('2026-01-25T12:00:00'));
    });

    it('should schedule notification for future time', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: true, timing: '15min' }, // 13:45に通知
      };

      const timerId = scheduleNotification(schedule);

      expect(timerId).not.toBeNull();
      expect(getScheduledNotifications()).toHaveLength(1);
      expect(getScheduledNotifications()[0]).toMatchObject({
        scheduleId: '1',
        title: 'テストスケジュール',
        body: 'テスト説明',
      });
    });

    it('should not schedule notification for past time', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        date: '2026-01-25',
        startTime: '10:00', // 過去の時刻
        notification: { enabled: true, timing: 'onTime' },
      };

      const timerId = scheduleNotification(schedule);

      expect(timerId).toBeNull();
      expect(getScheduledNotifications()).toHaveLength(0);
    });

    it('should return null when notification config is invalid', () => {
      const schedule: Schedule = {
        ...baseSchedule,
        notification: { enabled: false, timing: 'onTime' },
      };

      const timerId = scheduleNotification(schedule);

      expect(timerId).toBeNull();
      expect(getScheduledNotifications()).toHaveLength(0);
    });
  });

  describe('cancelNotification', () => {
    const baseSchedule: Schedule = {
      id: '1',
      title: 'テストスケジュール',
      description: 'テスト説明',
      date: '2026-01-25',
      startTime: '14:00',
      endTime: '15:00',
      color: '#3b82f6',
      createdAt: '2026-01-25T10:00:00Z',
      updatedAt: '2026-01-25T10:00:00Z',
      notification: { enabled: true, timing: '15min' },
    };

    beforeEach(() => {
      vi.setSystemTime(new Date('2026-01-25T12:00:00'));
    });

    it('should cancel scheduled notification', () => {
      scheduleNotification(baseSchedule);
      expect(getScheduledNotifications()).toHaveLength(1);

      cancelNotification('1');

      expect(getScheduledNotifications()).toHaveLength(0);
    });

    it('should do nothing when canceling non-existent notification', () => {
      expect(() => cancelNotification('non-existent')).not.toThrow();
    });
  });

  describe('rescheduleAllNotifications', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-01-25T12:00:00'));
    });

    it('should schedule multiple notifications', () => {
      const schedules: Schedule[] = [
        {
          id: '1',
          title: 'スケジュール1',
          description: '説明1',
          date: '2026-01-25',
          startTime: '14:00',
          endTime: '15:00',
          color: '#3b82f6',
          createdAt: '2026-01-25T10:00:00Z',
          updatedAt: '2026-01-25T10:00:00Z',
          notification: { enabled: true, timing: '15min' },
        },
        {
          id: '2',
          title: 'スケジュール2',
          description: '説明2',
          date: '2026-01-25',
          startTime: '16:00',
          endTime: '17:00',
          color: '#ef4444',
          createdAt: '2026-01-25T10:00:00Z',
          updatedAt: '2026-01-25T10:00:00Z',
          notification: { enabled: true, timing: '30min' },
        },
      ];

      rescheduleAllNotifications(schedules);

      expect(getScheduledNotifications()).toHaveLength(2);
    });

    it('should clear existing notifications before rescheduling', () => {
      const schedule1: Schedule = {
        id: '1',
        title: 'スケジュール1',
        description: '説明1',
        date: '2026-01-25',
        startTime: '14:00',
        endTime: '15:00',
        color: '#3b82f6',
        createdAt: '2026-01-25T10:00:00Z',
        updatedAt: '2026-01-25T10:00:00Z',
        notification: { enabled: true, timing: '15min' },
      };

      scheduleNotification(schedule1);
      expect(getScheduledNotifications()).toHaveLength(1);

      const schedule2: Schedule = {
        id: '2',
        title: 'スケジュール2',
        description: '説明2',
        date: '2026-01-25',
        startTime: '16:00',
        endTime: '17:00',
        color: '#ef4444',
        createdAt: '2026-01-25T10:00:00Z',
        updatedAt: '2026-01-25T10:00:00Z',
        notification: { enabled: true, timing: '30min' },
      };

      rescheduleAllNotifications([schedule2]);

      expect(getScheduledNotifications()).toHaveLength(1);
      expect(getScheduledNotifications()[0].scheduleId).toBe('2');
    });

    it('should handle empty schedules array', () => {
      rescheduleAllNotifications([]);

      expect(getScheduledNotifications()).toHaveLength(0);
    });
  });

  describe('getScheduledNotifications', () => {
    it('should return empty array when no notifications scheduled', () => {
      expect(getScheduledNotifications()).toEqual([]);
    });
  });
});
