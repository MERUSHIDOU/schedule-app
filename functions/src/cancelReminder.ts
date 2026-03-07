import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { deleteTask } from './utils/cloudTasks.js';

export const cancelReminder = onCall({ region: 'asia-northeast1' }, async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '認証が必要です');
  }

  const { reminderId } = request.data as { reminderId?: string };
  if (!reminderId || typeof reminderId !== 'string') {
    throw new HttpsError('invalid-argument', 'reminderId が必要です');
  }

  const db = admin.firestore();
  const reminderRef = db.collection('reminders').doc(reminderId);
  const reminderSnap = await reminderRef.get();

  if (!reminderSnap.exists) {
    throw new HttpsError('not-found', 'リマインダーが見つかりません');
  }

  const reminder = reminderSnap.data() ?? {};

  // 所有権チェック
  if (reminder.userId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'このリマインダーへのアクセス権がありません');
  }

  // すでにキャンセル済みの場合はスキップ
  if (reminder.status === 'cancelled') {
    logger.info(`リマインダー ${reminderId} はすでにキャンセル済みです`);
    return { success: true };
  }

  // Cloud Tasks のタスクを削除 (存在しない場合はスキップ)
  if (reminder.taskName) {
    await deleteTask(reminder.taskName as string);
  }

  // Firestore の status を更新
  await reminderRef.update({
    status: 'cancelled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info(`リマインダーキャンセル完了: ${reminderId}`);
  return { success: true };
});
