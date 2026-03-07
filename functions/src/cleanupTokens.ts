import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const FCM_TOKEN_EXPIRY_DAYS = 90;
const REMINDER_CLEANUP_DAYS = 30;

/**
 * 毎日 03:00 JST に実行される期限切れデータのクリーンアップ
 */
export const cleanupTokens = onSchedule(
  {
    schedule: '0 18 * * *', // UTC 18:00 = JST 03:00
    timeZone: 'UTC',
    region: 'asia-northeast1',
  },
  async () => {
    const db = admin.firestore();
    const now = new Date();

    await Promise.all([cleanupExpiredFcmTokens(db, now), cleanupOldReminders(db, now)]);
  }
);

/**
 * 期限切れの FCM トークンを削除する
 * @param {admin.firestore.Firestore} db Firestore インスタンス
 * @param {Date} now 現在時刻
 */
async function cleanupExpiredFcmTokens(db: admin.firestore.Firestore, now: Date): Promise<void> {
  const expiryDate = new Date(now.getTime() - FCM_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const expiryTimestamp = admin.firestore.Timestamp.fromDate(expiryDate);

  const usersSnap = await db.collection('users').get();
  let deletedCount = 0;

  const batch = db.batch();
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const fcmTokens = (userData.fcmTokens ?? {}) as Record<
      string,
      { token: string; updatedAt: admin.firestore.Timestamp }
    >;

    const expiredDeviceIds = Object.entries(fcmTokens)
      .filter(([, info]) => info.updatedAt && info.updatedAt < expiryTimestamp)
      .map(([deviceId]) => deviceId);

    if (expiredDeviceIds.length > 0) {
      const updates: Record<string, admin.firestore.FieldValue> = {};
      for (const deviceId of expiredDeviceIds) {
        updates[`fcmTokens.${deviceId}`] = admin.firestore.FieldValue.delete();
      }
      batch.update(userDoc.ref, updates);
      deletedCount += expiredDeviceIds.length;
    }
  }

  await batch.commit();
  logger.info(
    `期限切れFCMトークンを削除: ${deletedCount}件 (${FCM_TOKEN_EXPIRY_DAYS}日以上未更新)`
  );
}

/**
 * 送信済みの古いリマインダーを削除する
 * @param {admin.firestore.Firestore} db Firestore インスタンス
 * @param {Date} now 現在時刻
 */
async function cleanupOldReminders(db: admin.firestore.Firestore, now: Date): Promise<void> {
  const cleanupDate = new Date(now.getTime() - REMINDER_CLEANUP_DAYS * 24 * 60 * 60 * 1000);
  const cleanupTimestamp = admin.firestore.Timestamp.fromDate(cleanupDate);

  const oldRemindersSnap = await db
    .collection('reminders')
    .where('status', '==', 'sent')
    .where('sentAt', '<', cleanupTimestamp)
    .get();

  if (oldRemindersSnap.empty) {
    logger.info('削除対象の古いリマインダーはありません');
    return;
  }

  // Firestore のバッチ削除 (500件制限)
  const BATCH_SIZE = 500;
  const docs = oldRemindersSnap.docs;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + BATCH_SIZE)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  logger.info(
    `古いリマインダーを削除: ${docs.length}件 (${REMINDER_CLEANUP_DAYS}日以上前に送信済み)`
  );
}
