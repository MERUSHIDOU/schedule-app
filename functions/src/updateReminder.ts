import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createScheduledTask, deleteTask } from './utils/cloudTasks.js';
import { calculateReminderTime, validateScheduleReminderInput } from './utils/validators.js';

const QUEUE = process.env.CLOUD_TASKS_QUEUE ?? '';
const SEND_PUSH_URL = process.env.SEND_PUSH_URL ?? '';
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL ?? '';

export const updateReminder = onCall({ region: 'asia-northeast1' }, async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '認証が必要です');
  }

  const { reminderId, ...updateData } = request.data as {
    reminderId?: string;
    [key: string]: unknown;
  };

  if (!reminderId || typeof reminderId !== 'string') {
    throw new HttpsError('invalid-argument', 'reminderId が必要です');
  }

  const db = admin.firestore();
  const reminderRef = db.collection('reminders').doc(reminderId);
  const reminderSnap = await reminderRef.get();

  if (!reminderSnap.exists) {
    throw new HttpsError('not-found', 'リマインダーが見つかりません');
  }

  const existing = reminderSnap.data() ?? {};

  // 所有権チェック
  if (existing.userId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'このリマインダーへのアクセス権がありません');
  }

  // キャンセル済み・送信済みは更新不可
  if (existing.status === 'cancelled' || existing.status === 'sent') {
    throw new HttpsError(
      'failed-precondition',
      `ステータスが ${existing.status} のリマインダーは更新できません`
    );
  }

  // 既存タスクをキャンセル
  if (existing.taskName) {
    await deleteTask(existing.taskName as string);
  }

  // 更新後の入力データをマージして検証
  const mergedData = {
    scheduleId: existing.scheduleId,
    title: existing.title,
    body: existing.body,
    reminderTiming: existing.reminderTiming,
    scheduleDate: existing.scheduleDate,
    scheduleStartTime: existing.scheduleStartTime,
    timezone: existing.timezone ?? 'Asia/Tokyo',
    ...updateData,
  };

  const input = validateScheduleReminderInput(mergedData);

  // 新しいリマインダー時刻を計算
  const reminderTime = calculateReminderTime(
    input.scheduleDate,
    input.scheduleStartTime,
    input.timezone,
    input.reminderTiming
  );

  const now = new Date();
  if (reminderTime.getTime() < now.getTime() + 60 * 1000) {
    throw new HttpsError('invalid-argument', 'リマインダー時刻が過去または直近1分以内です');
  }

  // 新しい Cloud Tasks タスクを作成
  let taskName: string;
  try {
    taskName = await createScheduledTask({
      queue: QUEUE,
      url: SEND_PUSH_URL,
      payload: { reminderId },
      scheduleTime: reminderTime,
      serviceAccountEmail: SERVICE_ACCOUNT_EMAIL,
    });
  } catch (error) {
    logger.error(`タスク再作成失敗: ${reminderId}`, error);
    throw new HttpsError('internal', 'リマインダーの更新に失敗しました');
  }

  // Firestore を更新
  await reminderRef.update({
    title: input.title,
    body: input.body,
    reminderTiming: input.reminderTiming,
    reminderTime: admin.firestore.Timestamp.fromDate(reminderTime),
    scheduleDate: input.scheduleDate,
    scheduleStartTime: input.scheduleStartTime,
    timezone: input.timezone,
    taskName,
    status: 'scheduled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info(`リマインダー更新完了: ${reminderId}, 新タスク: ${taskName}`);
  return { reminderId };
});
