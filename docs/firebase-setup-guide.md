# Firebase環境構築ガイド

このドキュメントは、通知/リマインダーシステムに必要なFirebase環境の構築手順を記載しています。

## 📋 目次

1. [前提条件](#前提条件)
2. [Firebaseプロジェクト作成](#firebaseプロジェクト作成)
3. [Blazeプランへのアップグレード](#blazeプランへのアップグレード)
4. [必要なAPIの有効化](#必要なapiの有効化)
5. [Firebase SDK設定（Web）](#firebase-sdk設定web)
6. [Cloud Functions環境構築](#cloud-functions環境構築)
7. [FCM設定](#fcm設定)
8. [Firestore設定](#firestore設定)
9. [環境変数・シークレット管理](#環境変数シークレット管理)
10. [検証手順](#検証手順)
11. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 必要なアカウント・ツール

- [ ] Googleアカウント
- [ ] クレジットカード（Blazeプラン登録用、個人利用なら実質無料）
- [ ] Node.js 18以降
- [ ] npm または yarn
- [ ] Firebase CLI

### Firebase CLIのインストール

```bash
# npm経由
npm install -g firebase-tools

# バージョン確認
firebase --version
```

---

## Firebaseプロジェクト作成

### 1. Firebase Consoleにアクセス

https://console.firebase.google.com/ にアクセスし、Googleアカウントでログイン。

### 2. プロジェクト作成

1. 「プロジェクトを追加」をクリック
2. プロジェクト名を入力（例: `schedule-app-notifications`）
3. プロジェクトIDが自動生成される（変更も可能）
   - 例: `schedule-app-notifications-xxxxx`
   - **このIDは後で使用するのでメモ**
4. Google アナリティクスの有効化（任意、このプロジェクトでは不要）
   - 無効化を推奨（シンプルに保つため）
5. 「プロジェクトを作成」をクリック

### 3. プロジェクト作成完了

「新しいプロジェクトの準備ができました」と表示されたら完了。

---

## Blazeプランへのアップグレード

### なぜBlazeプランが必要か？

- Cloud Functions（サーバーレス関数）はBlazeプラン必須
- Cloud TasksもBlazeプラン必須
- **個人利用（月100通知程度）なら無料枠内で$0**

### 1. 課金設定画面へ

Firebase Console左下の「⚙️ 設定」→「使用量と請求額」→「プランを変更」

### 2. Blazeプランを選択

1. 「Blazeプランにアップグレード」をクリック
2. クレジットカード情報を入力
3. 請求先住所を入力
4. 「購入して有効にする」をクリック

### 3. 予算アラート設定（推奨）

1. 「予算アラートを設定」をクリック
2. 予算額を設定（例: $5）
   - 個人利用では$0のはずだが、念のため
3. アラートのしきい値を設定（例: 50%, 90%, 100%）
4. 「作成」をクリック

---

## 必要なAPIの有効化

### 1. Google Cloud Consoleにアクセス

https://console.cloud.google.com/ にアクセス

右上のプロジェクト選択ドロップダウンから、先ほど作成したFirebaseプロジェクトを選択。

### 2. Cloud Tasks APIを有効化

1. 左メニュー「APIとサービス」→「ライブラリ」
2. 検索バーで「Cloud Tasks API」を検索
3. 「Cloud Tasks API」をクリック
4. 「有効にする」をクリック

### 3. Cloud Scheduler APIを有効化（推奨）

1. 検索バーで「Cloud Scheduler API」を検索
2. 「Cloud Scheduler API」をクリック
3. 「有効にする」をクリック

### 4. 有効化の確認

「APIとサービス」→「ダッシュボード」で以下が表示されることを確認：
- Cloud Tasks API
- Cloud Scheduler API
- Cloud Functions API（自動的に有効化済み）

---

## Firebase SDK設定（Web）

### 1. Webアプリを追加

Firebase Console → プロジェクト設定 → 「アプリを追加」→ Webアイコン（`</>`）をクリック。

1. アプリのニックネームを入力（例: `Schedule App`）
2. 「このアプリのFirebase Hostingも設定します」は**チェックしない**
   - GitHub Pagesを使用するため
3. 「アプリを登録」をクリック

### 2. 構成情報を取得

以下のような構成オブジェクトが表示されます：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "schedule-app-notifications-xxxxx.firebaseapp.com",
  projectId: "schedule-app-notifications-xxxxx",
  storageBucket: "schedule-app-notifications-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxx"
};
```

**この情報を安全な場所にコピー** → 後で`.env`ファイルに記載します。

### 3. SDK追加手順

```bash
# プロジェクトルートで実行
npm install firebase
```

---

## Cloud Functions環境構築

### 1. Firebase CLIでログイン

```bash
firebase login
```

ブラウザが開き、Googleアカウントでログインを求められます。

### 2. Firebaseプロジェクトを初期化

```bash
# プロジェクトルートで実行
firebase init
```

以下の選択を行います：

```
? Which Firebase features do you want to set up for this directory?
  ◉ Functions: Configure a Cloud Functions directory
  ◉ Firestore: Configure security rules and indexes files
  ◯ Hosting (GitHub Pagesを使用するため不要)

? Please select an option:
  > Use an existing project

? Select a default Firebase project for this directory:
  > schedule-app-notifications-xxxxx (Schedule App)

? What language would you like to use to write Cloud Functions?
  > TypeScript

? Do you want to use ESLint to catch probable bugs and enforce style?
  > Yes

? Do you want to install dependencies with npm now?
  > Yes

? What file should be used for Firestore Rules?
  > firestore.rules

? What file should be used for Firestore indexes?
  > firestore.indexes.json
```

### 3. ディレクトリ構造確認

初期化後、以下のディレクトリが作成されます：

```
project-root/
├── functions/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.js
├── firestore.rules
├── firestore.indexes.json
└── firebase.json
```

### 4. Cloud Functions依存パッケージ追加

```bash
cd functions

# Cloud Tasks Client
npm install @google-cloud/tasks

# Firebase Admin SDK（自動インストール済みだが念のため）
npm install firebase-admin

cd ..
```

---

## FCM設定

### 1. Web Push証明書（VAPIDキー）の生成

Firebase Console → プロジェクト設定 → 「Cloud Messaging」タブ

「Web Push証明書」セクションで「鍵ペアを生成」をクリック。

以下のような公開鍵が表示されます：

```
BK8X... (長い文字列)
```

**この公開鍵をコピー** → 後で`.env`ファイルに記載します。

### 2. サーバーキー（レガシー）

「Cloud Messaging API（レガシー）」セクションで「サーバーキー」が表示されます。

**注**: 新しいプロジェクトではレガシーAPIは無効化されているため、特に操作不要。

### 3. Firebase Admin SDKのサービスアカウントキー

Firebase Console → プロジェクト設定 → 「サービスアカウント」タブ

「新しい秘密鍵の生成」をクリック → JSON形式でダウンロード。

**このファイルは機密情報** → `functions/service-account-key.json`として保存し、`.gitignore`に追加。

```bash
# functions/.gitignore に追加
service-account-key.json
```

---

## Firestore設定

### 1. Firestoreデータベースの作成

Firebase Console → 「Firestore Database」→「データベースを作成」

1. **モードの選択**:
   - 「本番環境モード」を選択（セキュリティルールで制御）

2. **ロケーション**:
   - `asia-northeast1`（東京）を推奨
   - **一度設定したら変更不可**

3. 「有効にする」をクリック

### 2. セキュリティルール（仮設定）

初期状態では以下のルールが設定されます：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**後で実装時に適切なルールを設定します。**

### 3. インデックスの作成（後で実施）

実装中にFirestoreクエリでエラーが出た場合、エラーメッセージにインデックス作成のリンクが含まれます。そのリンクから作成可能。

---

## 環境変数・シークレット管理

### 1. フロントエンド用環境変数（`.env`）

プロジェクトルートに`.env`ファイルを作成：

```bash
# .env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=schedule-app-notifications-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=schedule-app-notifications-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=schedule-app-notifications-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxx
VITE_FIREBASE_VAPID_KEY=BK8X... (Web Push証明書)
```

**`.env`を`.gitignore`に追加**:

```bash
# .gitignore に追加
.env
.env.local
```

### 2. Cloud Functions用シークレット

```bash
cd functions

# Firebase Secretsにシークレットを保存
firebase functions:secrets:set GOOGLE_CLOUD_PROJECT
# プロンプトでプロジェクトIDを入力

firebase functions:secrets:set CLOUD_TASKS_LOCATION
# プロンプトで "asia-northeast1" を入力

firebase functions:secrets:set CLOUD_TASKS_QUEUE
# プロンプトで "reminder-queue" を入力

cd ..
```

### 3. `.env.example`の作成（Git管理用）

```bash
# .env.example
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

このファイルはGitにコミット可能（値は含まない）。

---

## 検証手順

### 1. Firebase CLIの接続確認

```bash
firebase projects:list
```

作成したプロジェクトが表示されることを確認。

### 2. Cloud Functions のデプロイテスト

```bash
cd functions/src

# index.ts を編集して簡単なテスト関数を追加
```

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';

export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});
```

```bash
# デプロイ
cd ..
npm run deploy
```

成功すると、Function URLが表示されます。ブラウザでアクセスして「Hello from Firebase!」が表示されることを確認。

### 3. Firestore書き込みテスト

Firebase Console → Firestore Database → 「コレクションを開始」

1. コレクションID: `test`
2. ドキュメントID: 自動ID
3. フィールド: `message` (string) = `Hello Firestore`
4. 「保存」

データが表示されることを確認したら、テストコレクションを削除。

---

## トラブルシューティング

### エラー: `Billing account not configured`

**原因**: Blazeプランにアップグレードしていない

**解決策**:
1. Firebase Console → 設定 → 使用量と請求額
2. 「プランを変更」→ Blazeプランにアップグレード

---

### エラー: `Cloud Tasks API has not been used in project`

**原因**: Cloud Tasks APIが有効化されていない

**解決策**:
1. https://console.cloud.google.com/apis/library/cloudtasks.googleapis.com
2. プロジェクトを選択
3. 「有効にする」をクリック

---

### エラー: `Failed to create task: Permission denied`

**原因**: Cloud Functions のサービスアカウントに権限がない

**解決策**:
1. Google Cloud Console → IAM と管理 → IAM
2. `<project-id>@appspot.gserviceaccount.com`を検索
3. 「編集」→「Cloud Tasks Enqueuer」ロールを追加

---

### エラー: `CORS error when calling Cloud Functions`

**原因**: Cloud Functionsが外部からの呼び出しを許可していない

**解決策**:
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as cors from 'cors';

const corsHandler = cors({ origin: true });

export const myFunction = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    // 関数の処理
  });
});
```

または、`onCall`を使用（推奨）：
```typescript
export const myFunction = functions.https.onCall((data, context) => {
  // 認証済みリクエストのみ処理
  return { success: true };
});
```

---

### エラー: `Failed to get FCM token`

**原因**: Web Push証明書（VAPIDキー）が未設定または間違っている

**解決策**:
1. Firebase Console → プロジェクト設定 → Cloud Messaging
2. Web Push証明書を確認
3. `.env`の`VITE_FIREBASE_VAPID_KEY`を正しい値に更新

---

## 次のステップ

環境構築が完了したら、実装を開始します。

```bash
# 実装開始
/tdd Firebase Cloud Tasks通知システム
```

または、以下のドキュメントを参照：
- 実装計画: `plans/2026-02-07_notification-reminder-system-firebase.md`
- アーキテクチャ: 計画書内の「アーキテクチャ設計」セクション

---

## 参考リンク

- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase CLI リファレンス](https://firebase.google.com/docs/cli)
- [Cloud Tasks ドキュメント](https://cloud.google.com/tasks/docs)
- [FCM Web Push ドキュメント](https://firebase.google.com/docs/cloud-messaging/js/client)
