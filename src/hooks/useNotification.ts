import { useEffect, useState } from 'react';
import type { Schedule } from '../types/schedule';
import {
  isPWAMode as checkPWAMode,
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission as requestPermission,
} from '../utils/notification';
import {
  cancelNotification,
  rescheduleAllNotifications,
  scheduleNotification,
} from '../utils/notificationScheduler';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    getNotificationPermission()
  );

  const isSupported = isNotificationSupported();
  const isPWAModeValue = checkPWAMode();

  // 許可状態の変更を監視（将来的な拡張用）
  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    setPermission(result);
  };

  const scheduleForSchedule = (schedule: Schedule) => {
    scheduleNotification(schedule);
  };

  const cancelForSchedule = (scheduleId: string) => {
    cancelNotification(scheduleId);
  };

  const rescheduleAll = (schedules: Schedule[]) => {
    rescheduleAllNotifications(schedules);
  };

  return {
    permission,
    isPWAMode: isPWAModeValue,
    isSupported,
    requestPermission: handleRequestPermission,
    scheduleForSchedule,
    cancelForSchedule,
    rescheduleAll,
  };
}
