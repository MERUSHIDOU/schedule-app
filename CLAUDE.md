## プロジェクト概要

- PWA対応のスケジュール管理アプリ
- React + TypeScript + Vite
- GitHub Pagesでホスティング
- Safari + iPhone環境で動作

## ディレクトリ構造

```
.
├── .claude/           # Claude Code設定
│   ├── agents/       # エージェント定義
│   ├── commands/     # スキルコマンド定義
│   ├── rules/        # 開発ルール
│   └── skills/       # カスタムスキル
├── public/           # 静的アセット
├── src/              # アプリケーションソース
│   ├── components/  # Reactコンポーネント
│   ├── data/        # データ管理
│   ├── hooks/       # カスタムフック
│   ├── types/       # TypeScript型定義
│   └── utils/       # ユーティリティ関数
├── tests/           # 単体テスト
├── e2e/             # E2Eテスト (Playwright)
├── plans/           # 実装計画書
└── scripts/         # 開発スクリプト
```

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run preview  # ビルド結果プレビュー
npm run test     # 単体テスト実行
npm run test:e2e # e2eテスト実行
```

## 開発での重要事項

- 質問や提案を命令されたときは、必ずファイル編集/実装はしない
- PR作成までが仕事です。PRのマージは開発者の仕事です。
- masterブランチではファイル変更をしないでください
- コンテキスト節約のために積極的にサブエージェントに仕事を任せてください
- タスクエージェントを使用してコードベースを探索し、以下を見つける：
    1) [機能領域]に関連するすべてのファイル
    2) 関連するテストファイル
    3) 依存する共有型やユーティリティ。変更を開始する前に調査結果をまとめる
- 複数ステップのタスクを実行する際は、TodoWriteを使用して進捗を記録し、セッションが中断されても作業を再開できるようにする
- 複雑な機能変更の場合は、編集を開始する前に完全な計画を概説する

## 詳細ドキュメント

- 開発手順: @.claude/rules/workflow.md
- agents/skills手引き: @.claude/rules/agents.md
- テスト戦略: @.claude/rules/testing.md