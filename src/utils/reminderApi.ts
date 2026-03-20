import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, isFirebaseConfigured } from './firebase';

export interface ScheduleReminderParams {
  scheduleId: string;
  title: string;
  reminderTiming: string;
  scheduleDate: string;
  scheduleStartTime: string;
  timezone: string;
}

export interface UpdateReminderParams {
  reminderId: string;
  scheduleId: string;
  title: string;
  reminderTiming: string;
  scheduleDate: string;
  scheduleStartTime: string;
  timezone: string;
}

export interface ScheduleReminderResult {
  reminderId: string;
}

// scheduleReminder Cloud Callable関数を呼び出す
export async function scheduleReminder(
  params: ScheduleReminderParams
): Promise<ScheduleReminderResult | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const functions = getFunctions(app);
  const callable = httpsCallable<ScheduleReminderParams, ScheduleReminderResult>(
    functions,
    'scheduleReminder'
  );
  const result = await callable(params);
  return result.data;
}

// cancelReminder Cloud Callable関数を呼び出す
export async function cancelReminder(reminderId: string): Promise<null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const functions = getFunctions(app);
  const callable = httpsCallable<{ reminderId: string }, { success: boolean }>(
    functions,
    'cancelReminder'
  );
  await callable({ reminderId });
  return null;
}

// updateReminder Cloud Callable関数を呼び出す
export async function updateReminder(
  params: UpdateReminderParams
): Promise<ScheduleReminderResult | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const functions = getFunctions(app);
  const callable = httpsCallable<UpdateReminderParams, ScheduleReminderResult>(
    functions,
    'updateReminder'
  );
  const result = await callable(params);
  return result.data;
}
