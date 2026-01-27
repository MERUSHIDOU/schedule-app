/**
 * 通知スケジューリング機能
 */

import type { ScheduledNotification } from '../types/notification';
import type { Schedule } from '../types/schedule';
import { showNotification } from './notification';

// スケジュールされた通知を管理
const scheduledNotifications = new Map<string, number>(); // scheduleId -> timeoutId
const notificationQueue: ScheduledNotification[] = [];

/**
 * 通知時刻を計算
 */
export function calculateNotificationTime(schedule: Schedule): Date | null {
  if (!schedule.notification) {
    return null;
  }

  const { timing, customMinutes } = schedule.notification;

  // 日時をパース
  const [year, month, day] = schedule.date.split('-').map(Number);
  const [hours, minutes] = schedule.startTime.split(':').map(Number);

  const scheduledTime = new Date(year, month - 1, day, hours, minutes);

  // タイミングに応じて通知時刻を計算
  let minutesBefore = 0;
  switch (timing) {
    case 'onTime':
      minutesBefore = 0;
      break;
    case '5min':
      minutesBefore = 5;
      break;
    case '15min':
      minutesBefore = 15;
      break;
    case '30min':
      minutesBefore = 30;
      break;
    case '1hour':
      minutesBefore = 60;
      break;
    case 'custom':
      if (customMinutes === undefined || customMinutes < 0) {
        return null;
      }
      minutesBefore = customMinutes;
      break;
  }

  const notificationTime = new Date(scheduledTime.getTime() - minutesBefore * 60 * 1000);
  return notificationTime;
}

/**
 * 通知をスケジュール
 */
export function scheduleNotification(schedule: Schedule): string | null {
  const notificationTime = calculateNotificationTime(schedule);

  if (!notificationTime) {
    return null;
  }

  const now = new Date();
  const delay = notificationTime.getTime() - now.getTime();

  // 過去の時刻の場合はスケジュールしない
  if (delay < 0) {
    return null;
  }

  // 既存の通知をキャンセル
  cancelNotification(schedule.id);

  // 通知をスケジュール
  const timeoutId = window.setTimeout(() => {
    showNotification(schedule.title, {
      body: schedule.description || `${schedule.startTime} - ${schedule.endTime}`,
      tag: schedule.id,
      icon: '/pwa-192x192.png',
    });

    // 実行後はキューから削除
    const index = notificationQueue.findIndex(n => n.scheduleId === schedule.id);
    if (index !== -1) {
      notificationQueue.splice(index, 1);
    }
    scheduledNotifications.delete(schedule.id);
  }, delay);

  // 通知情報を保存
  scheduledNotifications.set(schedule.id, timeoutId);
  notificationQueue.push({
    scheduleId: schedule.id,
    notificationTime: notificationTime.toISOString(),
    title: schedule.title,
    body: schedule.description || `${schedule.startTime} - ${schedule.endTime}`,
  });

  return schedule.id;
}

/**
 * 通知をキャンセル
 */
export function cancelNotification(scheduleId: string): void {
  const timeoutId = scheduledNotifications.get(scheduleId);

  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    scheduledNotifications.delete(scheduleId);

    // キューから削除
    const index = notificationQueue.findIndex(n => n.scheduleId === scheduleId);
    if (index !== -1) {
      notificationQueue.splice(index, 1);
    }
  }
}

/**
 * すべての通知を再スケジュール
 */
export function rescheduleAllNotifications(schedules: Schedule[]): void {
  // すべての既存通知をキャンセル
  scheduledNotifications.forEach(timeoutId => {
    window.clearTimeout(timeoutId);
  });
  scheduledNotifications.clear();
  notificationQueue.length = 0;

  // 新しいスケジュールで通知を登録
  schedules.forEach(schedule => {
    scheduleNotification(schedule);
  });
}

/**
 * スケジュールされた通知の一覧を取得
 */
export function getScheduledNotifications(): ScheduledNotification[] {
  return [...notificationQueue];
}

/**
 * すべての通知をクリア（テスト用）
 */
export function clearAllNotifications(): void {
  scheduledNotifications.forEach(timeoutId => {
    window.clearTimeout(timeoutId);
  });
  scheduledNotifications.clear();
  notificationQueue.length = 0;
}
