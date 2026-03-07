import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createScheduledTask } from './utils/cloudTasks.js';
import { calculateReminderTime, validateScheduleReminderInput } from './utils/validators.js';

// 環境変数
const QUEUE = process.env.CLOUD_TASKS_QUEUE ?? '';
const SEND_PUSH_URL = process.env.SEND_PUSH_URL ?? '';
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL ?? '';

export const scheduleReminder = onCall({ region: 'asia-northeast1' }, async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '認証が必要です');
  }

  const userId = request.auth.uid;
  const input = validateScheduleReminderInput(request.data);

  // リマインダー時刻を計算
  const reminderTime = calculateReminderTime(
    input.scheduleDate,
    input.scheduleStartTime,
    input.timezone,
    input.reminderTiming
  );

  // 過去の時刻チェック (1分のマージン)
  const now = new Date();
  if (reminderTime.getTime() < now.getTime() + 60 * 1000) {
    throw new HttpsError('invalid-argument', 'リマインダー時刻が過去または直近1分以内です');
  }

  // Firestore に reminder ドキュメントを作成
  const db = admin.firestore();
  const reminderRef = db.collection('reminders').doc();
  const reminderId = reminderRef.id;

  const reminderData = {
    scheduleId: input.scheduleId,
    userId,
    title: input.title,
    body: input.body,
    reminderTiming: input.reminderTiming,
    reminderTime: admin.firestore.Timestamp.fromDate(reminderTime),
    scheduleDate: input.scheduleDate,
    scheduleStartTime: input.scheduleStartTime,
    status: 'scheduled',
    taskName: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    sentAt: null,
    error: null,
  };

  await reminderRef.set(reminderData);
  logger.info(`リマインダー作成: ${reminderId}`);

  // Cloud Tasks にタスクを作成
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
    // タスク作成失敗時は Firestore ドキュメントを削除してクリーンアップ
    logger.error(`タスク作成失敗、リマインダーを削除: ${reminderId}`, error);
    await reminderRef.delete();
    throw new HttpsError('internal', 'リマインダーのスケジュール設定に失敗しました');
  }

  // taskName を Firestore に保存
  await reminderRef.update({
    taskName,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info(`リマインダースケジュール完了: ${reminderId}, タスク: ${taskName}`);
  return { reminderId };
});
