# スケジュールアプリ

React + TypeScript + Vite で構築されたPWA対応のスケジュール管理アプリです。

## 機能

- カレンダー表示（月表示、前月/次月ナビゲーション）
- スケジュールのCRUD操作（作成・読取・更新・削除）
- ローカルストレージによるデータ永続化
- PWA対応（オフライン動作、ホーム画面に追加可能）
- レスポンシブデザイン（iPhone対応）

## 技術スタック

- **フレームワーク**: React 19
- **言語**: TypeScript
- **ビルドツール**: Vite
- **PWA**: vite-plugin-pwa

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## テスト

### ユニットテスト（Vitest）

```bash
# テストを実行（ウォッチモード）
npm test

# テストを一度だけ実行
npm run test:run
```

### E2Eテスト（Playwright）

初回のみ、Playwrightのブラウザをインストールする必要があります：

```bash
# Playwrightのブラウザをインストール
npm run playwright:install
```

テストの実行：

```bash
# E2Eテストを実行（ヘッドレスモード）
npm run test:e2e

# E2Eテストを実行（UIモード - テスト結果を視覚的に確認）
npm run test:e2e:ui

# E2Eテストを実行（ヘッドモード - ブラウザを表示）
npm run test:e2e:headed

# E2Eテストをデバッグモードで実行
npm run test:e2e:debug
```

E2Eテストは以下のブラウザで実行されます：
- Mobile Safari（iPhone 14 Pro）のみ

## プロジェクト構成

```
src/
├── components/      # UIコンポーネント
│   ├── Calendar.tsx
│   ├── ScheduleForm.tsx
│   └── ScheduleList.tsx
├── hooks/           # カスタムフック
│   └── useSchedules.ts
├── types/           # 型定義
│   └── schedule.ts
├── utils/           # ユーティリティ関数
│   ├── date.ts
│   └── storage.ts
├── App.tsx
└── main.tsx
```

## ライセンス

MIT
