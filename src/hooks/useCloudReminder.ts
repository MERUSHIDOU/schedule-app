import { useCallback, useState } from 'react';
import type { Schedule } from '../types/schedule';
import { isFirebaseConfigured } from '../utils/firebase';
import {
  cancelReminder as cancelReminderApi,
  scheduleReminder,
  updateReminder as updateReminderApi,
} from '../utils/reminderApi';

interface UseCloudReminderResult {
  loading: boolean;
  error: string | null;
  createReminder: (schedule: Schedule) => Promise<string | null>;
  cancelReminder: (reminderId: string) => Promise<void>;
  updateReminder: (schedule: Schedule) => Promise<string | null>;
}

// Cloud Functions経由のリマインダーCRUDを管理するフック
export function useCloudReminder(): UseCloudReminderResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReminder = useCallback(async (schedule: Schedule): Promise<string | null> => {
    if (!isFirebaseConfigured()) {
      return null;
    }
    if (!schedule.reminder || schedule.reminder === 'none') {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await scheduleReminder({
        scheduleId: schedule.id,
        title: schedule.title,
        reminderTiming: schedule.reminder,
        scheduleDate: schedule.date,
        scheduleStartTime: schedule.startTime,
        timezone: 'Asia/Tokyo',
      });

      if (!result) {
        return null;
      }

      return result.reminderId;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelReminder = useCallback(async (reminderId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await cancelReminderApi(reminderId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReminder = useCallback(async (schedule: Schedule): Promise<string | null> => {
    if (!isFirebaseConfigured()) {
      return null;
    }
    if (!schedule.reminder || schedule.reminder === 'none') {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // reminderId が存在する場合は updateReminder、存在しない場合は createReminder
      if (schedule.reminderId) {
        const result = await updateReminderApi({
          reminderId: schedule.reminderId,
          scheduleId: schedule.id,
          title: schedule.title,
          reminderTiming: schedule.reminder,
          scheduleDate: schedule.date,
          scheduleStartTime: schedule.startTime,
          timezone: 'Asia/Tokyo',
        });

        if (!result) {
          return null;
        }

        return result.reminderId;
      } else {
        const result = await scheduleReminder({
          scheduleId: schedule.id,
          title: schedule.title,
          reminderTiming: schedule.reminder,
          scheduleDate: schedule.date,
          scheduleStartTime: schedule.startTime,
          timezone: 'Asia/Tokyo',
        });

        if (!result) {
          return null;
        }

        return result.reminderId;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, createReminder, cancelReminder, updateReminder };
}
