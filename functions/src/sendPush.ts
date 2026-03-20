import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onRequest } from 'firebase-functions/v2/https';
import { OAuth2Client } from 'google-auth-library';
import { sendPushNotification } from './utils/fcm.js';

const authClient = new OAuth2Client();

/**
 * Cloud Tasks から送られてくる OIDC トークンを検証する。
 * Cloud Tasks は Authorization: Bearer <OIDC token> ヘッダーを付与する。
 * トークンのメールアドレスが Cloud Tasks サービスアカウントと一致することを確認する。
 */
async function verifyCloudTasksToken(authHeader: string | undefined): Promise<void> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization ヘッダーがありません');
  }
  const token = authHeader.slice(7);
  const audience = process.env.SEND_PUSH_URL ?? '';

  const ticket = await authClient.verifyIdToken({ idToken: token, audience });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('トークンのペイロードが取得できません');
  }

  const expectedEmail = process.env.SERVICE_ACCOUNT_EMAIL ?? '';
  if (expectedEmail && payload.email !== expectedEmail) {
    throw new Error(`サービスアカウントが一致しません: ${payload.email}`);
  }
}

interface ReminderDoc {
  userId: string;
  title: string;
  body: string;
  scheduleId: string;
  status: string;
}

interface FcmTokenInfo {
  token: string;
}

/**
 * リマインダーの送信ステータスを更新する
 */
async function updateReminderStatus(
  reminderRef: admin.firestore.DocumentReference,
  success: boolean,
  failureMessage?: string
): Promise<void> {
  if (success) {
    await reminderRef.update({
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await reminderRef.update({
      status: 'failed',
      error: failureMessage ?? '不明なエラー',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * 無効な FCM トークンをユーザードキュメントから削除する
 */
async function removeInvalidTokens(
  userRef: admin.firestore.DocumentReference,
  fcmTokensMap: Record<string, FcmTokenInfo>,
  invalidTokens: string[]
): Promise<void> {
  const invalidTokenSet = new Set(invalidTokens);
  const updates: Record<string, admin.firestore.FieldValue> = {};
  for (const [deviceId, info] of Object.entries(fcmTokensMap)) {
    if (invalidTokenSet.has(info.token)) {
      updates[`fcmTokens.${deviceId}`] = admin.firestore.FieldValue.delete();
    }
  }
  if (Object.keys(updates).length > 0) {
    await userRef.update(updates);
    logger.info(`無効トークンを削除: ${invalidTokens.length}件`);
  }
}

/**
 * Cloud Tasks から呼び出される Push 通知送信エンドポイント
 */
export const sendPush = onRequest({ region: 'asia-northeast1' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Cloud Tasks からの正規リクエストであることを OIDC トークンで検証
  try {
    await verifyCloudTasksToken(req.headers.authorization);
  } catch (err) {
    logger.warn('OIDC トークン検証失敗', err);
    res.status(401).send('Unauthorized');
    return;
  }

  const { reminderId } = req.body as { reminderId?: string };
  if (!reminderId || typeof reminderId !== 'string') {
    logger.error('reminderId が不正です', req.body);
    res.status(400).send('reminderId が必要です');
    return;
  }

  try {
    const db = admin.firestore();
    const reminderRef = db.collection('reminders').doc(reminderId);
    const reminderSnap = await reminderRef.get();

    if (!reminderSnap.exists) {
      logger.warn(`リマインダーが存在しません: ${reminderId}`);
      res.status(200).send('ok');
      return;
    }

    const reminder = reminderSnap.data() as ReminderDoc;
    if (reminder.status === 'cancelled' || reminder.status === 'sent') {
      logger.info(`リマインダー ${reminderId} はすでに ${reminder.status} です`);
      res.status(200).send('ok');
      return;
    }

    const userRef = db.collection('users').doc(reminder.userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      logger.warn(`ユーザーが存在しません: ${reminder.userId}`);
      await updateReminderStatus(reminderRef, false, 'ユーザードキュメントが存在しません');
      res.status(200).send('ok');
      return;
    }

    const userData = userSnap.data() ?? {};
    const fcmTokensMap = (userData.fcmTokens ?? {}) as Record<string, FcmTokenInfo>;
    const tokens = Object.values(fcmTokensMap).map(info => info.token);

    if (tokens.length === 0) {
      logger.warn(`FCMトークンがありません: userId=${reminder.userId}`);
      await updateReminderStatus(reminderRef, false, 'FCMトークンが登録されていません');
      res.status(200).send('ok');
      return;
    }

    const result = await sendPushNotification({
      tokens,
      title: reminder.title,
      body: reminder.body,
      data: {
        scheduleId: reminder.scheduleId,
        reminderId,
        click_action: '/schedule-app/',
      },
    });

    logger.info(
      `FCM送信結果: reminderId=${reminderId}, ` +
        `success=${result.successCount}, failure=${result.failureCount}`
    );

    if (result.invalidTokens.length > 0) {
      await removeInvalidTokens(userRef, fcmTokensMap, result.invalidTokens);
    }

    if (result.successCount > 0) {
      await updateReminderStatus(reminderRef, true);
    } else {
      await updateReminderStatus(
        reminderRef,
        false,
        `全トークンへの送信失敗 (failure=${result.failureCount})`
      );
      res.status(500).send('全トークンへの送信に失敗しました');
      return;
    }

    res.status(200).send('ok');
  } catch (err) {
    logger.error('sendPush ハンドラで予期しないエラーが発生しました', err);
    res.status(500).json({ error: '内部サーバーエラーが発生しました' });
  }
});
