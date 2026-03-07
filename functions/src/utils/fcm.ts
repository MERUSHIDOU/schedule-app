import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

export interface PushMessage {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendPushResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

/**
 * FCM マルチキャストでプッシュ通知を送信する
 * @param {PushMessage} message 送信するメッセージ
 * @return {Promise<SendPushResult>} 送信結果
 */
export async function sendPushNotification(message: PushMessage): Promise<SendPushResult> {
  const { tokens, title, body, data } = message;

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const multicastMessage: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
    data: data ?? {},
    webpush: {
      notification: {
        icon: '/schedule-app/pwa-192x192.png',
        badge: '/schedule-app/pwa-192x192.png',
      },
      fcmOptions: {
        link: '/schedule-app/',
      },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(multicastMessage);

  const invalidTokens: string[] = [];
  response.responses.forEach((resp, index) => {
    if (!resp.success && resp.error) {
      const errorCode = resp.error.code;
      if (
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[index]);
      } else {
        logger.error(`FCMエラー (token: ${tokens[index]}): ${resp.error.message}`);
      }
    }
  });

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  };
}
