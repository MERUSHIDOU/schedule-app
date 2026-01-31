# Claude Code プロジェクト設定

このファイルはプロジェクト固有の情報と設定を定義します。

## Git ワークフロー（必須）

ブランチ命名規則とワークフローの詳細: `.claude/rules/workflow.md`

**すべての変更はgit worktreeを使用し、Pull Requestで提出すること。**

### 主要コマンド

```bash
# tmux統合機能付き（推奨）
npm run worktree:new -- <type> <name> --task "タスク説明"  # worktree作成、pane分割、Claude起動

# シンプル版
npm run worktree:new -- <type> <name>     # worktree作成のみ
npm run worktree:list                      # worktree一覧を表示
npm run worktree:remove -- <type> <name>   # worktreeを削除
```

#### tmux統合機能について

**tmuxセッション内で実行すると、自動的に以下が実行されます：**

1. 新しいworktreeを作成
2. 依存関係をインストール
3. タスクコンテキストファイル（`.claude/worktree-context.md`）を自動生成
4. tmux paneを水平分割（左右）で作成
5. 新しいpaneでClaudeを起動し、タスクコンテキストを自然文で送信

**利点:**
- タスク情報がClaudeに自動送信され、適切なワークフローを自動選択
- 複数のworktreeを並行して作業可能（各paneで独立）
- 元のプロジェクトと新しいworktreeを左右のpaneで同時表示
- 効率的な開発環境構築

**使用方法:**
```bash
# tmuxセッション内で実行
tmux
npm run worktree:new -- feat my-feature --task "新しいUI要素を追加"
```

詳細は `.claude/rules/workflow.md` の「tmux統合機能」セクションを参照。

### 変更の提出

```bash
/ship  # 変更をコミット、プッシュし、Pull Requestを作成（推奨）
```

`/ship`スキルは、変更内容の確認、commit message生成、コミット、プッシュ、PR作成を自動化します。

**詳細ドキュメント**:
- `/ship`スキル: `.claude/skills/ship/SKILL.md`
- Gitワークフロー: `.claude/rules/workflow.md`

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

**指示出しからPR作成までの標準フロー**

### 1. アーキテクチャ設計（条件付き）

以下の場合、architectエージェントが自動起動：
- 新しいシステム/機能のアーキテクチャ設計
- 大規模リファクタリング
- 技術スタック選定
- データモデル設計
- スケーラビリティ検討

**成果物:** アーキテクチャ決定レコード（ADR）、設計ドキュメント

### 2. 実装計画策定

**自動判断（推奨）:**
```
複雑な機能をリクエスト → Claudeが自動的にplannerエージェントを起動
簡単な機能をリクエスト → メインエージェントが実装内容を考える
```

**明示的呼び出し:**
```
/plan [機能] → plannerエージェントを強制起動
```

**成果物:** 実装計画書（`plans/YYYY-MM-DD_<feature-name>.md`）

### 3. 実装
```
/tdd [機能] → tdd-guideエージェントがテストファーストで実装
```
- アーキテクチャ設計・実装計画書がある場合はそれに従う
- ない場合は直接実装

### 4. コードレビュー（必須）
```
/code-review → セキュリティと品質の包括的レビュー
```
- CRITICALまたはHIGH問題がある場合は修正必須
- 修正後、再レビュー（最大3回）
- 3回で修正しきれない場合は人間に承認を求める

### 5. セキュリティレビュー（条件付き）
以下の場合のみ実施：
- 変更が多い（10ファイル以上）
- 認証・APIエンドポイント・機密データの変更
- ユーザー入力の処理を追加

```
security-reviewerエージェントに委託
```
- 修正後、再レビュー（最大3回）

### 6. PR作成
```
/ship → コミット、プッシュ、PR作成を自動化
```

**フロー図:**
```
指示 → [建築的判断必要?] → Yes → architectエージェント → ADR/設計
                          ↓ No
                          ↓
       [複雑?] → Yes → plannerエージェント → 計画書（plans/）
       or /plan   ↓ No
                  ↓
             /tdd → 実装
                  ↓
          /code-review → 修正（最大3回）
                  ↓
       [セキュリティ変更?] → Yes → security-review → 修正（最大3回）
                          ↓ No
                          ↓
                      /ship → PR作成
```

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

