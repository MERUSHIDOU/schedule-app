# Claude Code プロジェクト設定

このファイルはプロジェクト固有の情報と設定を定義します。

**開発での重要事項**

- 質問や提案を命令されたときは、必ずファイル編集/実装はしない
- PR作成までが仕事です。PRのマージは開発者の仕事です。
- masterブランチではファイル変更をしないでください
- コンテキスト節約のために積極的にサブエージェントに仕事を任せてください
- タスクエージェントを使用してコードベースを探索し、以下を見つける：
    1) [機能領域]に関連するすべてのファイル
    2) 関連するテストファイル
    3) 依存する共有型やユーティリティ。変更を開始する前に調査結果をまとめる

## セッション継続性

- 複数ステップのタスクを実行する際は、TodoWriteを使用して進捗を記録し、セッションが中断されても作業を再開できるようにする
- 複雑な機能変更の場合は、編集を開始する前に完全な計画を概説する

## Git ワークフロー（必須）

**すべての変更はgit worktreeを使用し、Pull Requestで提出すること。**

新機能の実装は`/implement`スキルを使用：

```bash
/implement [実装したい機能の説明]
```

このスキルが自動的にブランチ作成、worktree設定、タスク委譲を行います。

詳細: `.claude/commands/implement.md`、`.claude/rules/workflow.md`

## プロジェクト概要

- PWA対応のスケジュール管理アプリ
- React + TypeScript + Vite
- GitHub Pagesでホスティング

## 対象環境（必須）

**Safari + iPhone環境で動作することを前提に設計すること。**

- Safari非対応のHTML/CSS/JS機能は使用しない
- 実装前にSafari/iOS Safariの互換性を確認する
- 例: `<input type="time" step="...">` はSafari非対応のため`<select>`を使用する
- iOS固有のUI/UX（セーフエリア、タッチ操作等）を考慮する

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run preview  # ビルド結果プレビュー
```

## 開発ワークフロー（必須）

新機能の実装は`/implement`スキルを使用。複雑さに応じて自動的に計画→実装→レビュー→PRまでのワークフローが実行されます。

詳細: `.claude/rules/development-workflow.md`

## 実装計画（必須）

**複雑な機能追加やリファクタリングの際は、実装前に必ず `/plan` コマンドで計画を立てること。**

```bash
/plan [実装したい機能]  # 実装計画を策定
```

詳細: `.claude/agents/planner.md`、`.claude/commands/plan.md`

## テスト開発手法（必須）

**TDD（テスト駆動開発）を必須とする。すべての新機能実装・バグ修正はテストファーストで行うこと。**
**カバレッジ要件: 80%以上（重要なロジックは100%）**

```bash
/tdd [実装したい機能]  # TDDワークフローで新機能を実装
/e2e [テストしたいフロー]  # E2Eテストを生成・実行
```

詳細: `.claude/rules/testing.md`、`.claude/agents/tdd-guide.md`

## ビルドエラー解決

**ビルド失敗またはTypeScript型エラーが発生した際に使用。**

```bash
/build-fix  # TypeScriptおよびビルドエラーを段階的に修正
```

詳細: `.claude/agents/build-error-resolver.md`、`.claude/commands/build-fix.md`

## アーキテクチャ設計

**新機能が建築的な決定を必要とする場合や、大規模リファクタリングを実施する場合に使用。**

詳細: `.claude/agents/architect.md`、`.claude/rules/agents.md`

