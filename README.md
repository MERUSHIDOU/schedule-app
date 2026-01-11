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
