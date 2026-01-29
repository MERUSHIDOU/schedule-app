# Claude Code プロジェクト設定

このファイルはプロジェクト固有の情報と設定を定義します。

## ブランチ命名規則

- 機能追加: `feat/<機能名>`
- バグ修正: `fix/<修正内容>`
- ドキュメント: `docs/<内容>`
- リファクタリング: `refactor/<内容>`
- テスト追加: `test/<内容>`
- ビルド・設定: `chore/<内容>`

ベースブランチ: `master`

## Git ワークフロー（必須）

**すべての変更はgit worktreeを使用し、Pull Requestで提出すること。**

### 主要コマンド

```bash
npm run worktree:new <type> <name>     # 新しいworktreeを作成
npm run worktree:list                   # worktree一覧を表示
npm run worktree:remove <type> <name>   # worktreeを削除
```

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

## 実装計画（必須）

**複雑な機能追加やリファクタリングの際は、実装前に必ず `/plan` コマンドで計画を立てること。**

### Planning Workflow

```bash
/plan [実装したい機能]  # 実装計画を策定
```

plannerエージェントが：
1. **要件を再確認** - 何を実装するか明確化
2. **リスクを評価** - 潜在的な問題を洗い出す
3. **段階的計画を作成** - 実装ステップを分解
4. **承認を待機** - ユーザーが明示的に "yes" と言うまで実装しない

### 計画内容

- Requirements（要件）
- Architecture Changes（建築的な変更）
- Implementation Steps（実装ステップ）
  - Phase分割
  - 依存関係の明示
  - 複雑度・リスク評価
- Testing Strategy（テスト戦略）
- Risks & Mitigations（リスク対策）
- Success Criteria（成功基準）

### 詳細ドキュメント

- Plannerエージェント: `.claude/agents/planner.md`
- /planコマンド: `.claude/commands/plan.md`
- エージェント管理ルール: `.claude/rules/agents.md`

## テスト開発手法（必須）

**TDD（テスト駆動開発）を必須とする。すべての新機能実装・バグ修正はテストファーストで行うこと。**

### TDDの基本原則

1. **テストを先に書く** - 実装前に必ずテストを作成（RED）
2. **最小限の実装** - テストを通すための最小限のコードを書く（GREEN）
3. **リファクタリング** - テストを保ちながらコードを改善（REFACTOR）
4. **カバレッジ確認** - 80%以上のテストカバレッジを維持

### 利用可能なコマンド

```bash
/plan [実装したい機能]  # 実装計画を策定（複雑な機能時は必須）
/tdd [実装したい機能]  # TDDワークフローで新機能を実装
/e2e [テストしたいフロー]  # E2Eテストを生成・実行
```

### テストの種類

- **Unit Tests**: 個別の関数・コンポーネントのテスト（必須）
- **Integration Tests**: API・DB操作のテスト（必須）
- **E2E Tests**: 重要なユーザーフローのテスト（Playwright使用）

### カバレッジ要件

- **通常のコード**: 80%以上
- **重要なロジック**: 100%必須（認証、データ操作、計算処理等）

### 詳細ドキュメント

- TDDルール: `.claude/rules/testing.md`
- TDDエージェント: `.claude/agents/tdd-guide.md`
- E2Eエージェント: `.claude/agents/e2e-runner.md`
- ワークフロー詳細: `.claude/skills/tdd-workflow/SKILL.md`

## セキュリティレビュー（推奨）

**本番環境に展開する前に、すべてのコードに対してセキュリティレビューを実行すること。**

### Security Reviewer エージェント

ユーザー入力、認証、APIエンドポイント、機密データを処理するコード作成後に起動：

- ハードコードされたシークレット検出
- SQLインジェクション、XSS、SSRF等の脆弱性検出
- OWASP Top 10チェック
- 依存関係の脆弱性チェック

### 利用可能なコマンド

```bash
/code-review  # コミットされていない変更をセキュリティと品質でレビュー
```

### ドキュメント

- Security Reviewerエージェント: `.claude/agents/security-reviewer.md`
- Code Reviewコマンド: `.claude/commands/code-review.md`

## ビルドエラー解決（トラブルシューティング）

**ビルド失敗またはTypeScript型エラーが発生した際に使用。**

### Build Error Resolver エージェント

ビルドおよび型エラーを段階的に修正：

- TypeScript型エラーを解決
- ビルドエラーを修正
- 依存関係の問題を解決
- 最小限の変更でエラーをクリア

### 利用可能なコマンド

```bash
/build-fix  # TypeScriptおよびビルドエラーを段階的に修正
```

### ドキュメント

- Build Error Resolverエージェント: `.claude/agents/build-error-resolver.md`
- Build Fixコマンド: `.claude/commands/build-fix.md`

## アーキテクチャ設計（複雑な機能用）

**新機能が建築的な決定を必要とする場合や、大規模リファクタリングを実施する場合に使用。**

### Architect エージェント

システム設計とスケーラビリティの専門家：

- システムアーキテクチャを設計
- 技術的なトレードオフを評価
- ベストプラクティスを提案
- スケーラビリティボトルネックを特定

### ドキュメント

- Architectエージェント: `.claude/agents/architect.md`
- エージェント管理ルール: `.claude/rules/agents.md`

## ログ記録（必須）

**重要な会話や作業完了時は、Claudeが自動的に `/log-conversation` スキルを実行すること。**

### Claudeの責任

- ✅ **プロアクティブに実行**: ユーザーの指示を待たずに自動実行
- ✅ **作業完了時に即座に実行**: 機能実装、バグ修正、設計決定などの完了直後
- ❌ **ユーザーからの要求を待たない**: 重要な作業は必ず記録

### 記録すべき会話（必須）
- 機能の実装や変更
- バグ修正
- 設計の決定
- トラブルシューティング

### 実行タイミング
```
1. 機能実装完了（PRマージ前後）
2. バグ修正完了
3. 設計決定後
4. 重要なトラブルシューティング後
   ↓
   Claudeが自動的に /log-conversation を実行
```

### ログの場所
- `.claude/logs/YYYY-MM-DD_conversation.md`（日付ごとに1ファイル）

### 注意事項
- 過去のログは明示的に指示されない限り参照しない（コンテキスト節約のため）
- ログファイルへの追記時は既存内容を上書きしない

### 詳細ルール
詳細な記録方法とルールは `.claude/rules/logging.md` を参照。
