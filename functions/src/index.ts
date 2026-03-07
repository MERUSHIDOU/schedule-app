import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions';

// Firebase Admin SDK の初期化 (一度だけ)
admin.initializeApp();

setGlobalOptions({
  maxInstances: 10,
  region: 'asia-northeast1',
});

export { cancelReminder } from './cancelReminder.js';
export { cleanupTokens } from './cleanupTokens.js';
export { scheduleReminder } from './scheduleReminder.js';
export { sendPush } from './sendPush.js';
export { updateReminder } from './updateReminder.js';
