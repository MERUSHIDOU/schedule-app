# FCM + Cloud Tasks 実装計画書

> **作成日**: 2026-01-25
> **対象ブランチ**: `feat/issue-12-notification`
> **推定工数**: 7.5日間
> **ステータス**: 未着手

---

## この計画書について

### 目的

現在の `setTimeout` ベースのローカル通知を、Firebase Cloud Messaging (FCM) + Cloud Tasks 方式に完全移行し、iPhoneのバックグラウンド/スリープ状態でも正確な時刻にプッシュ通知を受信できるようにする。

### この計画書の使い方

**新しいClaudeセッションで実装を開始する場合**:

1. この計画書を読み込ませる
2. 「この計画書に従ってPhase 1から実装を開始してください」と指示
3. 各Phaseを順番に実装
4. 完了したらチェックボックスにチェックを入れる

### 前提条件

**プロジェクトの現状**:
- PWA対応のスケジュールアプリ（React + TypeScript + Vite）
- GitHub Pagesでホスティング
- ローカル通知機能が既に実装済み（Notification API + setTimeout）
- スケジュールデータはlocalStorageに保存
- Service Worker実装済み（vite-plugin-pwa）

**必要な知識**:
- Firebase（FCM, Firestore, Cloud Functions）
- Cloud Tasks
- Service Worker
- TypeScript

**必要なアカウント**:
- Googleアカウント（Firebase用）
- クレジットカード（Blazeプランアップグレード用、ただし無料枠内で運用可能）

---

## プロジェクト概要

### 現在のアーキテクチャ（問題点）

```
[ユーザーのブラウザ]
├── localStorage（スケジュールデータ）
├── setTimeout（通知タイマー）← ブラウザを閉じると消える
└── Notification API（通知表示）

問題:
❌ ブラウザを閉じるとsetTimeoutが消える
❌ バックグラウンドで通知が届かない
❌ デバイススリープ時は動作しない
```

### 新しいアーキテクチャ（目標）

```
[PWA (React)]
    │
    ├─ FCMトークン取得・登録
    │
    └─ Firestoreにスケジュール保存
           │
           ↓
[Firestore Trigger: onScheduleCreate]
           │
           ↓
[Cloud Tasks: 指定時刻にタスク予約]
           │
    （その時刻まで何も実行されない）
           │
           ↓ 指定時刻
[Cloud Tasks → sendScheduledNotification]
           │
           ↓
[FCM → iPhoneにプッシュ通知]

利点:
✅ アプリが閉じていても通知が届く
✅ デバイスがスリープしていても通知が届く
✅ 秒単位で正確な通知
✅ ポーリング不要（コスト効率最大化）
```

### 主要コンポーネント

| コンポーネント | 役割 |
|--------------|------|
| **Firestore** | スケジュールデータの永続化 |
| **Cloud Functions** | Firestoreトリガー、HTTP関数 |
| **Cloud Tasks** | 指定時刻にタスクを実行 |
| **FCM** | プッシュ通知の配信 |
| **Service Worker** | バックグラウンド通知の受信 |

---

## コスト試算

### 無料枠（毎月）

| サービス | 無料枠 | 超過時の料金 |
|---------|--------|------------|
| Cloud Functions | 200万回呼び出し | $0.40/100万回 |
| Firestore | 読み取り50,000回/日 | $0.06/10万回 |
| Cloud Tasks | 100万回 | $0.40/100万回 |

### 想定使用量（個人利用、月100スケジュール）

```
Cloud Functions実行:
- onScheduleCreate: 100回
- onScheduleUpdate: 50回
- onScheduleDelete: 20回
- sendScheduledNotification: 100回
合計: 270回/月 → 無料枠200万回の0.0135%

Firestore:
- スケジュール作成: 100回
- スケジュール読み取り: 3,000回
合計: 3,100回/月 → 無料枠150万回の0.2%

Cloud Tasks:
- タスク作成: 100回 → 無料枠100万回の0.01%

結論: 完全に無料枠内 💰 料金: ¥0
```

---

## Firestoreスキーマ

### users コレクション

```typescript
users/{userId}
├── fcmToken: string       // FCMトークン
├── updatedAt: timestamp   // 更新日時
```

### schedules コレクション

```typescript
schedules/{scheduleId}
├── userId: string         // ユーザーID
├── title: string          // スケジュールタイトル
├── description: string    // 説明
├── date: string           // 日付（YYYY-MM-DD）
├── startTime: string      // 開始時刻（HH:mm）
├── endTime: string        // 終了時刻（HH:mm）
├── color: string          // 表示色
├── notification: {
│   ├── timing: string     // 'onTime' | '5min' | '15min' | '30min' | '1hour' | 'custom'
│   └── customMinutes?: number
│ }
├── taskName: string       // Cloud Taskの名前（キャンセル用）
├── createdAt: timestamp   // 作成日時
└── updatedAt: timestamp   // 更新日時
```

---

## 実装ステップ

### 進捗チェックリスト

- [ ] Phase 1: Firebase プロジェクトセットアップ
- [ ] Phase 2: PWA側 Firebase SDK統合
- [ ] Phase 3: Service Worker FCM統合
- [ ] Phase 4: 型定義の更新
- [ ] Phase 4.5: Cloud Functions実装（最重要）
- [ ] Phase 5: PWA側 Hook更新
- [ ] Phase 6: ユーザーID管理
- [ ] Phase 7: 既存コードの削除・クリーンアップ
- [ ] Phase 8: テスト更新

---

## Phase 1: Firebase プロジェクトセットアップ

**所要時間**: 0.5日
**前提**: Googleアカウント、クレジットカード

### 1.1 Firebase Console設定（手動作業）

#### 手順

1. **Firebaseプロジェクト作成**
   - https://console.firebase.google.com にアクセス
   - 「プロジェクトを追加」をクリック
   - プロジェクト名: `schedule-app`（任意）
   - Google Analyticsは任意で設定

2. **Firestoreデータベース作成**
   - Firebase Console → ビルド → Firestore Database
   - 「データベースを作成」
   - **本番モード**を選択
   - リージョン: `asia-northeast1`（東京）

3. **Cloud Messagingを有効化**
   - Firebase Console → プロジェクトの設定 → Cloud Messaging タブ
   - 「ウェブプッシュ証明書」で「鍵ペアを生成」
   - VAPIDキーをコピー（後で`.env`に設定）

4. **ウェブアプリを追加**
   - Firebase Console → プロジェクトの概要 → ウェブアイコン（</>）
   - アプリのニックネーム: `schedule-app-pwa`
   - Firebase Hostingは「設定しない」
   - `firebaseConfig`オブジェクトをコピー（後で使用）

5. **Blazeプランにアップグレード**
   - Firebase Console → アップグレード
   - Blazeプランを選択
   - クレジットカード情報を入力
   - **予算アラートを設定**（¥100, ¥500, ¥1,000）

#### 取得する情報

```javascript
// firebaseConfig（後でViteの環境変数に設定）
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "schedule-app-xxxxx.firebaseapp.com",
  projectId: "schedule-app-xxxxx",
  storageBucket: "schedule-app-xxxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef...",
};

// VAPIDキー
const vapidKey = "BN3x...";
```

### 1.2 Cloud Tasks キュー作成（手動作業）

#### 前提条件

- gcloud CLIがインストール済み
- Firebaseプロジェクトが選択済み

#### 手順

```bash
# プロジェクトを設定
gcloud config set project schedule-app-xxxxx

# Cloud Tasksキューを作成
gcloud tasks queues create schedule-notifications \
  --location=asia-northeast1

# 作成確認
gcloud tasks queues describe schedule-notifications \
  --location=asia-northeast1
```

### 1.3 IAM権限設定（手動作業）

Cloud FunctionsがCloud Tasksを操作できるよう権限を付与：

```bash
# プロジェクトIDを取得
PROJECT_ID=$(gcloud config get-value project)

# Cloud Functions サービスアカウントに権限付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/cloudtasks.enqueuer"
```

### チェックポイント

- [ ] Firebaseプロジェクト作成完了
- [ ] Firestoreデータベース作成完了
- [ ] Cloud Messaging有効化、VAPIDキー取得完了
- [ ] ウェブアプリ登録、firebaseConfig取得完了
- [ ] Blazeプランアップグレード完了
- [ ] 予算アラート設定完了
- [ ] Cloud Tasksキュー作成完了
- [ ] IAM権限設定完了

---

## Phase 2: PWA側 Firebase SDK統合

**所要時間**: 1日
**前提**: Phase 1完了

### 2.1 Firebase SDKインストール

```bash
cd /home/taka/test-project/schedule-app
npm install firebase
```

### 2.2 環境変数設定

#### `.env.example` を更新

```bash
# 既存の環境変数...

# Firebase設定
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

#### `.env` を作成

Phase 1で取得した値を設定：

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=schedule-app-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=schedule-app-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=schedule-app-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef...
VITE_FIREBASE_VAPID_KEY=BN3x...
```

### 2.3 Firebase初期化

**新規ファイル**: `src/services/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase初期化
export const app = initializeApp(firebaseConfig);

// Firestore初期化
export const db = getFirestore(app);

// FCM初期化（iOS Safariサポートチェック付き）
export async function getMessagingInstance() {
  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser');
    return null;
  }
  return getMessaging(app);
}
```

### 2.4 FCMトークン管理

**新規ファイル**: `src/services/fcmToken.ts`

```typescript
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db, getMessagingInstance } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * FCMトークンを取得してFirestoreに保存
 */
export async function registerFCMToken(userId: string): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn('Messaging not supported');
    return null;
  }

  try {
    // サービスワーカー登録確認
    const registration = await navigator.serviceWorker.ready;

    // FCMトークン取得
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error('Failed to get FCM token');
      return null;
    }

    // Firestoreにトークンを保存
    await setDoc(
      doc(db, 'users', userId),
      {
        fcmToken: token,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log('FCM token registered:', token);
    return token;
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return null;
  }
}

/**
 * フォアグラウンドメッセージリスナーを設定
 */
export function setupMessageListener(
  callback: (payload: MessagePayload) => void
): void {
  getMessagingInstance().then((messaging) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
      });
    }
  });
}
```

### 2.5 Firestoreスケジュール操作

**新規ファイル**: `src/services/firestore.ts`

```typescript
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Schedule, ScheduleFormData } from '../types/schedule';

const SCHEDULES_COLLECTION = 'schedules';

/**
 * スケジュールを作成
 */
export async function createSchedule(
  userId: string,
  data: ScheduleFormData
): Promise<string> {
  const docRef = await addDoc(collection(db, SCHEDULES_COLLECTION), {
    ...data,
    userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  console.log('Schedule created:', docRef.id);
  return docRef.id;
}

/**
 * スケジュールを更新
 */
export async function updateSchedule(
  scheduleId: string,
  data: Partial<ScheduleFormData>
): Promise<void> {
  await updateDoc(doc(db, SCHEDULES_COLLECTION, scheduleId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
  console.log('Schedule updated:', scheduleId);
}

/**
 * スケジュールを削除
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  await deleteDoc(doc(db, SCHEDULES_COLLECTION, scheduleId));
  console.log('Schedule deleted:', scheduleId);
}

/**
 * ユーザーのスケジュールをリアルタイムで購読
 */
export function subscribeToSchedules(
  userId: string,
  callback: (schedules: Schedule[]) => void
): Unsubscribe {
  const q = query(
    collection(db, SCHEDULES_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const schedules = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Timestampを文字列に変換
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Schedule;
    });
    callback(schedules);
  });
}
```

### チェックポイント

- [ ] Firebase SDKインストール完了
- [ ] 環境変数設定完了
- [ ] `src/services/firebase.ts` 作成完了
- [ ] `src/services/fcmToken.ts` 作成完了
- [ ] `src/services/firestore.ts` 作成完了

---

## Phase 3: Service Worker FCM統合

**所要時間**: 0.5日
**前提**: Phase 2完了

### 3.1 Firebase Messaging Service Worker作成

**新規ファイル**: `public/firebase-messaging-sw.js`

```javascript
// Firebase SDKをインポート（compat版を使用）
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase初期化（環境変数は使えないので直接記述）
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// バックグラウンドメッセージ処理
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'スケジュール通知';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.data?.scheduleId || 'schedule',
    data: payload.data,
    requireInteraction: true, // iOS PWAで通知を保持
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 既に開いているウィンドウがあればフォーカス
        for (const client of clientList) {
          if (client.url.includes('/schedule-app/') && 'focus' in client) {
            return client.focus();
          }
        }
        // なければ新しいウィンドウを開く
        if (clients.openWindow) {
          return clients.openWindow('/schedule-app/');
        }
      })
  );
});
```

**重要**: `YOUR_API_KEY`などは、Phase 1で取得した実際の値に置き換えてください。

### 3.2 vite.config.ts 更新

**変更ファイル**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // ... 既存設定
        // Firebase Messaging SWを除外
        navigateFallbackDenylist: [/^\/firebase-messaging-sw\.js$/],
      },
      manifest: {
        // ... 既存設定
      },
    }),
  ],
  // ... その他の設定
});
```

### チェックポイント

- [ ] `public/firebase-messaging-sw.js` 作成完了
- [ ] Firebase設定値を実際の値に置き換え完了
- [ ] `vite.config.ts` 更新完了

---

## Phase 4: 型定義の更新

**所要時間**: 0.5日
**前提**: なし

### 4.1 Schedule型拡張

**変更ファイル**: `src/types/schedule.ts`

```typescript
import type { NotificationConfig } from './notification';

export interface Schedule {
  id: string;
  userId: string; // 追加: ユーザー識別子
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: string;
  createdAt: string;
  updatedAt: string;
  notification?: NotificationConfig;
  taskName?: string; // 追加: Cloud Taskの名前（キャンセル用）
}

export interface ScheduleFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  notification?: NotificationConfig;
}

export type ViewMode = 'month' | 'week' | 'day';
```

### 4.2 Notification型拡張

**変更ファイル**: `src/types/notification.ts`

```typescript
// 通知タイミングの種類
export type NotificationTiming = 'onTime' | '5min' | '15min' | '30min' | '1hour' | 'custom';

// 通知設定
export interface NotificationConfig {
  timing: NotificationTiming;
  customMinutes?: number;
}

// スケジュールされた通知（既存）
export interface ScheduledNotification {
  scheduleId: string;
  notificationTime: string;
  title: string;
  body: string;
}

// Cloud Tasks ペイロード（追加）
export interface NotificationTaskPayload {
  scheduleId: string;
  userId: string;
  title: string;
  body: string;
  fcmToken: string;
}
```

### チェックポイント

- [ ] `src/types/schedule.ts` 更新完了
- [ ] `src/types/notification.ts` 更新完了

---

## Phase 4.5: Cloud Functions実装（最重要フェーズ）

**所要時間**: 2日
**前提**: Phase 1完了

### 4.5.1 Functions プロジェクト初期化

```bash
cd /home/taka/test-project/schedule-app
firebase init functions

# 選択項目:
# - TypeScript を選択
# - ESLint を有効化
# - 依存関係をインストール
```

### 4.5.2 package.json

**ファイル**: `functions/package.json`

```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "20"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "@google-cloud/tasks": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "eslint-config-google": "^0.14.0"
  },
  "private": true
}
```

依存関係をインストール:

```bash
cd functions
npm install
```

### 4.5.3 型定義

**新規ファイル**: `functions/src/types.ts`

```typescript
export interface NotificationConfig {
  timing: 'onTime' | '5min' | '15min' | '30min' | '1hour' | 'custom';
  customMinutes?: number;
}

export interface Schedule {
  userId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  notification?: NotificationConfig;
  taskName?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface NotificationTaskPayload {
  scheduleId: string;
  userId: string;
  title: string;
  body: string;
  fcmToken: string;
}
```

### 4.5.4 Cloud Tasks ユーティリティ

**新規ファイル**: `functions/src/utils/cloudTasks.ts`

```typescript
import { CloudTasksClient } from '@google-cloud/tasks';
import { NotificationTaskPayload } from '../types';

const client = new CloudTasksClient();
const PROJECT_ID = process.env.GCLOUD_PROJECT || '';
const LOCATION = 'asia-northeast1';
const QUEUE_NAME = 'schedule-notifications';
const FUNCTION_URL = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/sendScheduledNotification`;

/**
 * Cloud Taskを作成（指定時刻に実行）
 */
export async function createNotificationTask(
  scheduleId: string,
  scheduledTime: Date,
  payload: NotificationTaskPayload
): Promise<string> {
  const parent = client.queuePath(PROJECT_ID, LOCATION, QUEUE_NAME);

  // タスク名を一意に生成
  const taskName = `${parent}/tasks/notification-${scheduleId}-${Date.now()}`;

  const task = {
    name: taskName,
    httpRequest: {
      httpMethod: 'POST' as const,
      url: FUNCTION_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
    },
    scheduleTime: {
      seconds: Math.floor(scheduledTime.getTime() / 1000),
    },
  };

  const [response] = await client.createTask({ parent, task });
  console.log(`Task created: ${response.name}`);

  return response.name || taskName;
}

/**
 * Cloud Taskをキャンセル
 */
export async function cancelNotificationTask(taskName: string): Promise<void> {
  if (!taskName) return;

  try {
    await client.deleteTask({ name: taskName });
    console.log(`Task cancelled: ${taskName}`);
  } catch (error: any) {
    // タスクが既に実行済みまたは存在しない場合は無視
    if (error.code === 5) {
      // NOT_FOUND
      console.log(`Task not found (already executed?): ${taskName}`);
    } else {
      throw error;
    }
  }
}

/**
 * 通知時刻を計算
 */
export function calculateNotificationTime(
  date: string,
  startTime: string,
  timing: string,
  customMinutes?: number
): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  const scheduledTime = new Date(year, month - 1, day, hours, minutes);

  let minutesBefore = 0;
  switch (timing) {
    case 'onTime':
      minutesBefore = 0;
      break;
    case '5min':
      minutesBefore = 5;
      break;
    case '15min':
      minutesBefore = 15;
      break;
    case '30min':
      minutesBefore = 30;
      break;
    case '1hour':
      minutesBefore = 60;
      break;
    case 'custom':
      minutesBefore = customMinutes || 0;
      break;
  }

  return new Date(scheduledTime.getTime() - minutesBefore * 60 * 1000);
}
```

### 4.5.5 FCMユーティリティ

**新規ファイル**: `functions/src/utils/fcm.ts`

```typescript
import * as admin from 'firebase-admin';

/**
 * FCMでプッシュ通知を送信
 */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string> {
  const message: admin.messaging.Message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: data || {},
    webpush: {
      notification: {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        requireInteraction: true,
      },
      fcmOptions: {
        link: '/schedule-app/',
      },
    },
  };

  const response = await admin.messaging().send(message);
  console.log(`Notification sent successfully: ${response}`);
  return response;
}
```

### 4.5.6 Firestoreトリガー

**新規ファイル**: `functions/src/triggers/scheduleNotification.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  createNotificationTask,
  cancelNotificationTask,
  calculateNotificationTime,
} from '../utils/cloudTasks';
import { Schedule } from '../types';

const db = admin.firestore();

/**
 * スケジュール作成時: Cloud Taskを予約
 */
export const onScheduleCreate = functions
  .region('asia-northeast1')
  .firestore.document('schedules/{scheduleId}')
  .onCreate(async (snap, context) => {
    const scheduleId = context.params.scheduleId;
    const schedule = snap.data() as Schedule;

    // 通知設定がない場合はスキップ
    if (!schedule.notification) {
      console.log(`No notification config for schedule ${scheduleId}`);
      return;
    }

    // ユーザーのFCMトークンを取得
    const userDoc = await db.collection('users').doc(schedule.userId).get();
    const userData = userDoc.data();

    if (!userData?.fcmToken) {
      console.log(`No FCM token for user ${schedule.userId}`);
      return;
    }

    // 通知時刻を計算
    const notificationTime = calculateNotificationTime(
      schedule.date,
      schedule.startTime,
      schedule.notification.timing,
      schedule.notification.customMinutes
    );

    // 過去の時刻はスキップ
    if (notificationTime.getTime() <= Date.now()) {
      console.log(`Notification time is in the past for schedule ${scheduleId}`);
      return;
    }

    // Cloud Taskを作成
    const payload = {
      scheduleId,
      userId: schedule.userId,
      title: schedule.title,
      body: schedule.description || `${schedule.startTime} - ${schedule.endTime}`,
      fcmToken: userData.fcmToken,
    };

    const taskName = await createNotificationTask(scheduleId, notificationTime, payload);

    // タスク名をスケジュールに保存
    await snap.ref.update({ taskName });

    console.log(
      `Notification scheduled for ${scheduleId} at ${notificationTime.toISOString()}`
    );
  });

/**
 * スケジュール更新時: 既存タスクをキャンセルし新規作成
 */
export const onScheduleUpdate = functions
  .region('asia-northeast1')
  .firestore.document('schedules/{scheduleId}')
  .onUpdate(async (change, context) => {
    const scheduleId = context.params.scheduleId;
    const before = change.before.data() as Schedule;
    const after = change.after.data() as Schedule;

    // 通知関連のフィールドが変更されたかチェック
    const notificationChanged =
      before.date !== after.date ||
      before.startTime !== after.startTime ||
      JSON.stringify(before.notification) !== JSON.stringify(after.notification);

    if (!notificationChanged) {
      console.log(`No notification-related changes for schedule ${scheduleId}`);
      return;
    }

    // 既存のタスクをキャンセル
    if (before.taskName) {
      await cancelNotificationTask(before.taskName);
    }

    // 通知設定がなくなった場合は終了
    if (!after.notification) {
      await change.after.ref.update({ taskName: admin.firestore.FieldValue.delete() });
      console.log(`Notification disabled for schedule ${scheduleId}`);
      return;
    }

    // ユーザーのFCMトークンを取得
    const userDoc = await db.collection('users').doc(after.userId).get();
    const userData = userDoc.data();

    if (!userData?.fcmToken) {
      console.log(`No FCM token for user ${after.userId}`);
      return;
    }

    // 新しい通知時刻を計算
    const notificationTime = calculateNotificationTime(
      after.date,
      after.startTime,
      after.notification.timing,
      after.notification.customMinutes
    );

    // 過去の時刻はスキップ
    if (notificationTime.getTime() <= Date.now()) {
      await change.after.ref.update({ taskName: admin.firestore.FieldValue.delete() });
      console.log(`New notification time is in the past for schedule ${scheduleId}`);
      return;
    }

    // 新しいCloud Taskを作成
    const payload = {
      scheduleId,
      userId: after.userId,
      title: after.title,
      body: after.description || `${after.startTime} - ${after.endTime}`,
      fcmToken: userData.fcmToken,
    };

    const taskName = await createNotificationTask(scheduleId, notificationTime, payload);

    await change.after.ref.update({ taskName });

    console.log(
      `Notification rescheduled for ${scheduleId} at ${notificationTime.toISOString()}`
    );
  });

/**
 * スケジュール削除時: タスクをキャンセル
 */
export const onScheduleDelete = functions
  .region('asia-northeast1')
  .firestore.document('schedules/{scheduleId}')
  .onDelete(async (snap, context) => {
    const scheduleId = context.params.scheduleId;
    const schedule = snap.data() as Schedule;

    if (schedule.taskName) {
      await cancelNotificationTask(schedule.taskName);
      console.log(`Notification cancelled for deleted schedule ${scheduleId}`);
    }
  });
```

### 4.5.7 HTTP関数

**新規ファイル**: `functions/src/handlers/sendNotification.ts`

```typescript
import * as functions from 'firebase-functions';
import { sendPushNotification } from '../utils/fcm';
import { NotificationTaskPayload } from '../types';

/**
 * Cloud Tasksから呼び出されるHTTP関数
 * 指定時刻に実行され、FCM通知を送信
 */
export const sendScheduledNotification = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    // Cloud Tasksからの呼び出しを検証
    const taskName = req.headers['x-cloudtasks-taskname'];
    if (!taskName) {
      console.warn('Request not from Cloud Tasks');
      res.status(403).send('Forbidden');
      return;
    }

    try {
      const payload: NotificationTaskPayload = req.body;

      if (!payload.fcmToken || !payload.title) {
        res.status(400).send('Invalid payload');
        return;
      }

      await sendPushNotification(
        payload.fcmToken,
        payload.title,
        payload.body,
        { scheduleId: payload.scheduleId }
      );

      console.log(`Notification sent for schedule ${payload.scheduleId}`);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).send('Internal Server Error');
    }
  });
```

### 4.5.8 エントリーポイント

**変更ファイル**: `functions/src/index.ts`

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp();

// Firestoreトリガー
export { onScheduleCreate, onScheduleUpdate, onScheduleDelete } from './triggers/scheduleNotification';

// HTTP関数（Cloud Tasksから呼び出し）
export { sendScheduledNotification } from './handlers/sendNotification';
```

### 4.5.9 TypeScript設定

**ファイル**: `functions/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "ES2020",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 4.5.10 ビルドとデプロイ

```bash
cd functions

# ビルド
npm run build

# ローカルエミュレータでテスト（オプション）
npm run serve

# デプロイ
firebase deploy --only functions
```

### チェックポイント

- [ ] Functions プロジェクト初期化完了
- [ ] 依存関係インストール完了
- [ ] 型定義作成完了
- [ ] Cloud Tasksユーティリティ作成完了
- [ ] FCMユーティリティ作成完了
- [ ] Firestoreトリガー作成完了
- [ ] HTTP関数作成完了
- [ ] エントリーポイント作成完了
- [ ] ビルド成功
- [ ] デプロイ成功

---

## Phase 5: PWA側 Hook更新

**所要時間**: 1日
**前提**: Phase 2, 4, 4.5完了

### 5.1 useAuth Hook

**新規ファイル**: `src/hooks/useAuth.ts`

```typescript
import { useState, useEffect } from 'react';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../services/firebase';

const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        setLoading(false);
      } else {
        // 未認証の場合は匿名認証
        signInAnonymously(auth)
          .then((result) => {
            setUser(result.user);
            setLoading(false);
          })
          .catch((error) => {
            console.error('Anonymous sign-in failed:', error);
            setLoading(false);
          });
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    userId: user?.uid || null,
  };
}
```

### 5.2 useSchedules Hook更新

**変更ファイル**: `src/hooks/useSchedules.ts`

```typescript
import { useState, useEffect } from 'react';
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  subscribeToSchedules,
} from '../services/firestore';
import type { Schedule, ScheduleFormData } from '../types/schedule';

export function useSchedules(userId: string | null) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToSchedules(userId, (newSchedules) => {
      setSchedules(newSchedules);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addSchedule = async (data: ScheduleFormData) => {
    if (!userId) throw new Error('User not authenticated');
    await createSchedule(userId, data);
    // Firestoreトリガーが自動的にCloud Taskを作成
  };

  const editSchedule = async (id: string, data: ScheduleFormData) => {
    await updateSchedule(id, data);
    // Firestoreトリガーが自動的にCloud Taskを更新
  };

  const removeSchedule = async (id: string) => {
    await deleteSchedule(id);
    // Firestoreトリガーが自動的にCloud Taskをキャンセル
  };

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule: editSchedule,
    deleteSchedule: removeSchedule,
  };
}
```

### 5.3 useNotification Hook更新

**変更ファイル**: `src/hooks/useNotification.ts`

```typescript
import { useState, useEffect } from 'react';
import { registerFCMToken, setupMessageListener } from '../services/fcmToken';
import {
  isNotificationSupported,
  isPWAMode,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/notification';

export function useNotification(userId: string | null) {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permission === 'granted' && userId) {
      setLoading(true);
      registerFCMToken(userId)
        .then(setFcmToken)
        .finally(() => setLoading(false));
    }
  }, [permission, userId]);

  useEffect(() => {
    // フォアグラウンドメッセージリスナー
    setupMessageListener((payload) => {
      console.log('フォアグラウンド通知:', payload);
      // 必要に応じてUI更新（トーストなど）
    });
  }, []);

  const requestPermission = async () => {
    if (!userId) {
      console.warn('User not authenticated');
      return;
    }

    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === 'granted') {
      setLoading(true);
      const token = await registerFCMToken(userId);
      setFcmToken(token);
      setLoading(false);
    }
  };

  return {
    permission,
    fcmToken,
    loading,
    isPWAMode: isPWAMode(),
    isSupported: isNotificationSupported(),
    requestPermission,
  };
}
```

### 5.4 App.tsx更新

**変更ファイル**: `src/App.tsx`

```typescript
import { useAuth } from './hooks/useAuth';
import { useSchedules } from './hooks/useSchedules';
import { useNotification } from './hooks/useNotification';
// ... その他のimport

function App() {
  const { userId, loading: authLoading } = useAuth();
  const { schedules, loading: schedulesLoading, addSchedule, updateSchedule, deleteSchedule } = useSchedules(userId);
  const { permission, requestPermission, isPWAMode, isSupported } = useNotification(userId);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {/* 通知許可バナー */}
      {isSupported && permission !== 'granted' && (
        <NotificationPermissionBanner
          onRequestPermission={requestPermission}
          isPWAMode={isPWAMode}
        />
      )}

      {/* 既存のコンポーネント */}
      {/* ... */}
    </div>
  );
}

export default App;
```

### チェックポイント

- [ ] `src/hooks/useAuth.ts` 作成完了
- [ ] `src/hooks/useSchedules.ts` 更新完了
- [ ] `src/hooks/useNotification.ts` 更新完了
- [ ] `src/App.tsx` 更新完了

---

## Phase 6: ユーザーID管理

**所要時間**: 0.5日
**前提**: Phase 5完了

このフェーズはPhase 5で `useAuth` Hook として既に実装済みです。

### 追加作業（オプション）

Firebase Authentication の匿名認証は自動的に処理されますが、必要に応じて以下を追加できます：

- ユーザープロフィール管理
- 永続化（ログアウト機能は不要だが、データ移行用）
- アカウントアップグレード（将来的に本格的な認証を追加する場合）

### チェックポイント

- [ ] 匿名認証が正常に動作することを確認
- [ ] ユーザーIDがFirestoreに正しく保存されることを確認

---

## Phase 7: 既存コードの削除・クリーンアップ

**所要時間**: 0.5日
**前提**: Phase 5完了

### 7.1 setTimeout ベースの通知削除

**変更ファイル**: `src/utils/notificationScheduler.ts`

このファイルは完全に削除するか、以下の関数のみ残して他を削除：

**残す関数**:
- `calculateNotificationTime` - UIでの表示用に使用可能

**削除する関数**:
- `scheduleNotification`
- `cancelNotification`
- `rescheduleAllNotifications`
- `getScheduledNotifications`

### 7.2 localStorage スケジュールデータの削除

既存のlocalStorageデータがあれば、移行後に削除：

**追加コード（オプション）**: `src/utils/migration.ts`

```typescript
export function migrateLocalStorageToFirestore(): void {
  const migrated = localStorage.getItem('migrated_to_firestore');
  if (migrated) return;

  // 既存のlocalStorageデータを削除
  localStorage.removeItem('schedules');
  localStorage.removeItem('scheduled_notifications');

  // 移行済みフラグを立てる
  localStorage.setItem('migrated_to_firestore', 'true');

  console.log('LocalStorage data cleared (migrated to Firestore)');
}
```

`App.tsx` で一度だけ実行：

```typescript
useEffect(() => {
  migrateLocalStorageToFirestore();
}, []);
```

### チェックポイント

- [ ] `src/utils/notificationScheduler.ts` の不要な関数削除完了
- [ ] localStorage移行完了（オプション）
- [ ] ビルドエラーがないことを確認

---

## Phase 8: テスト更新

**所要時間**: 1日
**前提**: Phase 7完了

### 8.1 ユニットテスト更新

#### `tests/services/fcmToken.test.ts`（新規）

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerFCMToken } from '../../src/services/fcmToken';
import { getToken } from 'firebase/messaging';
import { setDoc } from 'firebase/firestore';

vi.mock('firebase/messaging');
vi.mock('firebase/firestore');

describe('fcmToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FCMトークンを取得して保存する', async () => {
    const mockToken = 'mock-fcm-token';
    vi.mocked(getToken).mockResolvedValue(mockToken);

    const token = await registerFCMToken('user123');

    expect(token).toBe(mockToken);
    expect(setDoc).toHaveBeenCalled();
  });
});
```

#### `tests/services/firestore.test.ts`（新規）

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createSchedule, updateSchedule, deleteSchedule } from '../../src/services/firestore';
import { addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

vi.mock('firebase/firestore');

describe('firestore', () => {
  it('スケジュールを作成する', async () => {
    const mockId = 'schedule123';
    vi.mocked(addDoc).mockResolvedValue({ id: mockId } as any);

    const id = await createSchedule('user123', {
      title: 'テスト',
      description: '',
      date: '2026-01-25',
      startTime: '10:00',
      endTime: '11:00',
      color: '#3b82f6',
    });

    expect(id).toBe(mockId);
    expect(addDoc).toHaveBeenCalled();
  });
});
```

#### `tests/hooks/useSchedules.test.tsx`（更新）

Firestoreモックを使用するよう更新：

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useSchedules } from '../../src/hooks/useSchedules';
import { subscribeToSchedules } from '../../src/services/firestore';

vi.mock('../../src/services/firestore');

describe('useSchedules', () => {
  it('ユーザーのスケジュールを購読する', async () => {
    const mockSchedules = [{ id: '1', title: 'テスト' }];
    vi.mocked(subscribeToSchedules).mockImplementation((userId, callback) => {
      callback(mockSchedules as any);
      return () => {};
    });

    const { result } = renderHook(() => useSchedules('user123'));

    await waitFor(() => {
      expect(result.current.schedules).toEqual(mockSchedules);
    });
  });
});
```

### 8.2 E2Eテスト更新

#### `e2e/notification-flow.spec.ts`（更新）

```typescript
import { test, expect } from '@playwright/test';

test.describe('通知フロー', () => {
  test('スケジュール作成後にCloud Taskが予約される', async ({ page }) => {
    await page.goto('/');

    // 通知許可
    await page.click('[data-testid="notification-permission-button"]');

    // スケジュール作成
    await page.click('[data-testid="add-schedule-button"]');
    await page.fill('[data-testid="schedule-title"]', 'テストスケジュール');
    await page.fill('[data-testid="schedule-date"]', '2026-01-26');
    await page.fill('[data-testid="schedule-start-time"]', '10:00');
    await page.fill('[data-testid="schedule-end-time"]', '11:00');

    // 通知設定
    await page.selectOption('[data-testid="notification-timing"]', '5min');

    await page.click('[data-testid="save-schedule-button"]');

    // Firestoreに保存されることを確認（taskNameフィールドが存在）
    // 注: 実際のE2Eでは、Firebase Emulatorsを使用してFirestoreをモック
    await expect(page.locator('[data-testid="schedule-item"]')).toBeVisible();
  });
});
```

### チェックポイント

- [ ] ユニットテスト作成・更新完了
- [ ] E2Eテスト更新完了
- [ ] すべてのテストが成功
- [ ] カバレッジ80%以上

---

## デプロイ手順

### 1. Firebase Functions デプロイ

```bash
cd functions
npm run build
firebase deploy --only functions
```

デプロイ後、Cloud Functionsのログを確認：

```bash
firebase functions:log
```

### 2. Cloud Tasks キュー確認

```bash
gcloud tasks queues describe schedule-notifications \
  --location=asia-northeast1
```

### 3. PWAビルド

```bash
cd /home/taka/test-project/schedule-app
npm run build
```

### 4. GitHub Pagesデプロイ

```bash
# 既存のデプロイスクリプトを実行
npm run deploy
# または
git add .
git commit -m "feat: FCM + Cloud Tasks による通知機能実装"
git push origin feat/issue-12-notification
```

### 5. 動作確認

#### iPhone（iOS 16.4+）での確認

1. Safari で https://your-username.github.io/schedule-app/ にアクセス
2. 「ホーム画面に追加」でPWAをインストール
3. PWAを開く
4. 通知許可を承認
5. スケジュールを作成（5分後の通知で設定）
6. アプリを閉じてバックグラウンドへ
7. 5分後に通知が届くことを確認

#### デスクトップ（Chrome/Edge）での確認

1. ブラウザで https://your-username.github.io/schedule-app/ にアクセス
2. 通知許可を承認
3. スケジュールを作成（5分後の通知で設定）
4. ブラウザを閉じる
5. 5分後に通知が届くことを確認

---

## トラブルシューティング

### FCMトークンが取得できない

**原因**:
- Service Workerが正しく登録されていない
- VAPIDキーが間違っている
- iOS Safari PWAモードではない

**解決**:
```bash
# Service Worker登録確認
navigator.serviceWorker.getRegistrations()

# VAPIDキー確認
console.log(import.meta.env.VITE_FIREBASE_VAPID_KEY)

# PWAモード確認（iOSのみ）
console.log(navigator.standalone)
```

### Cloud Tasksが実行されない

**原因**:
- IAM権限が設定されていない
- キューが作成されていない
- タスク名が重複している

**解決**:
```bash
# IAM権限確認
gcloud projects get-iam-policy YOUR_PROJECT_ID

# キュー確認
gcloud tasks queues list --location=asia-northeast1

# Cloud Functionsログ確認
firebase functions:log --only onScheduleCreate
```

### 通知が届かない

**原因**:
- FCMトークンが期限切れ
- ユーザーがFirestoreに存在しない
- 通知時刻が過去

**解決**:
```bash
# Firestoreデータ確認
firebase firestore:get users/USER_ID
firebase firestore:get schedules/SCHEDULE_ID

# Cloud Functionsログ確認
firebase functions:log --only sendScheduledNotification
```

---

## 成功基準チェックリスト

- [ ] スケジュール作成時にCloud Taskが自動予約される
- [ ] 指定時刻にFCM通知がiPhoneに届く
- [ ] スケジュール更新時に通知時刻が正しく更新される
- [ ] スケジュール削除時にタスクがキャンセルされる
- [ ] アプリがバックグラウンド/スリープ状態でも通知が届く
- [ ] iOS 16.4+ Safari PWAで動作確認
- [ ] 全テストがパス（80%以上カバレッジ）
- [ ] ビルドエラーなし
- [ ] ポーリングが存在しない（1分ごとのSchedulerを使用しない）
- [ ] コストが無料枠内（Firebase Consoleで確認）

---

## 参考リンク

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Cloud Tasks ドキュメント](https://cloud.google.com/tasks/docs)
- [Firestore トリガー](https://firebase.google.com/docs/functions/firestore-events)
- [iOS PWA プッシュ通知](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

---

## 実装開始コマンド

新しいClaudeセッションで実装を開始する場合、以下のように指示してください：

```
この計画書（.claude/plans/fcm-cloud-tasks-implementation-plan.md）に従って、
Phase 1から順番に実装を開始してください。

まずPhase 1: Firebase プロジェクトセットアップを実施します。
```

---

**最終更新**: 2026-01-25
**計画策定者**: Claude Sonnet 4.5
**レビュー**: 未実施
