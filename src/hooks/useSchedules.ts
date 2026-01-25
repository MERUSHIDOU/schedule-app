import { useCallback, useEffect, useState } from 'react';
import type { Schedule, ScheduleFormData } from '../types/schedule';
import {
  cancelNotification,
  rescheduleAllNotifications,
  scheduleNotification,
} from '../utils/notificationScheduler';
import { generateId, hasStorageData, loadSchedules, saveSchedules } from '../utils/storage';

// スケジュールデータのCRUD
export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const loadedSchedules = loadSchedules();
    setSchedules(loadedSchedules);
    // 初回ロード時にすべての通知を再スケジュール
    rescheduleAllNotifications(loadedSchedules);
  }, []);

  useEffect(() => {
    if (schedules.length > 0 || hasStorageData()) {
      saveSchedules(schedules);
    }
  }, [schedules]);

  // CREATE
  const addSchedule = useCallback((data: ScheduleFormData) => {
    const now = new Date().toISOString();
    const newSchedule: Schedule = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setSchedules(prev => [...prev, newSchedule]);
    // 通知設定があればスケジュール
    if (newSchedule.notification?.enabled) {
      scheduleNotification(newSchedule);
    }
    return newSchedule;
  }, []);

  // UPDATE
  const updateSchedule = useCallback((id: string, data: ScheduleFormData) => {
    // 既存通知をキャンセル
    cancelNotification(id);

    setSchedules(prev =>
      prev.map(schedule => {
        if (schedule.id === id) {
          const updatedSchedule = {
            ...schedule,
            ...data,
            updatedAt: new Date().toISOString(),
          };
          // 新しい通知設定でスケジュール
          if (updatedSchedule.notification?.enabled) {
            scheduleNotification(updatedSchedule);
          }
          return updatedSchedule;
        }
        return schedule;
      })
    );
  }, []);

  // DELETE
  const deleteSchedule = useCallback((id: string) => {
    // 関連通知をキャンセル
    cancelNotification(id);
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  }, []);

  // READ
  const getSchedulesByDate = useCallback(
    (date: string) => {
      return schedules.filter(schedule => schedule.date === date);
    },
    [schedules]
  );

  return {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByDate,
  };
}
