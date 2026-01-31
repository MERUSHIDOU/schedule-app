# Git Workflow Rules

## Git Worktree Workflow（必須）

### Always Use Git Worktree

**すべての変更は`git worktree`を使用して新しいブランチで作業すること。**

- 必ず`npm run worktree:new`コマンドを使用

### One Branch, One Change Principle

**各修正は必ず別のworktreeで作業する。**

- ❌ **禁止**: 既存のブランチに別の修正を追加
- ✅ **必須**: 新しい修正は最新のベースブランチから新しいworktreeを作成

### All Changes via Pull Requests

変更は直接メインブランチにプッシュせず、必ずPull Requestとして提出すること。

## Branch Naming Convention

- 機能追加: `feat/<機能名>`
- バグ修正: `fix/<修正内容>`
- ドキュメント: `docs/<内容>`
- リファクタリング: `refactor/<内容>`
- テスト追加: `test/<内容>`
- ビルド・設定: `chore/<内容>`

ベースブランチ: `master`

## tmux統合機能

**tmuxセッション内で実行すると、worktree作成時に自動的に新しいpaneが作成され、新しいClaudeセッションが起動します。タスクコンテキストが自然文で自動送信され、Claudeが適切なワークフロー（planner, tdd-guide等）を自動選択します。**

### タスクコンテキストファイル

worktree作成時に、タスク情報を含む`.claude/worktree-context.md`ファイルが自動生成されます：

```markdown
# Worktree タスクコンテキスト

作成日時: 2026-01-31 14:30
ブランチ: feat/new-feature
Worktreeパス: /path/to/schedule-app-feat-new-feature

## ユーザーからの指示

タスク説明がここに表示されます

## 関連ドキュメント

実装計画や設計ドキュメントが自動検出されます

## 推奨ワークフロー

1. タスクコンテキストを確認
2. 実装計画を読む（`plans/`ディレクトリ内）
3. Claudeが自動的に適切なワークフローを選択（planner, tdd-guide等）
4. `/code-review`でセキュリティと品質をレビュー
5. `/ship`でコミット、プッシュ、PR作成
```

### 使い方

#### tmux内での実行（推奨）

```bash
# tmuxセッションを開く
tmux

# worktreeを作成（タスク説明を指定）
npm run worktree:new -- feat new-feature --task "新機能の説明"

# 自動で以下が実行されます：
# 1. 新しいworktreeを作成
# 2. 依存関係をインストール
# 3. タスクコンテキストファイルを生成
# 4. tmux paneを水平分割（左右）で作成
# 5. 新しいpaneでClaudeを起動し、タスクコンテキストを自然文で送信
```

結果：
- 左pane：メインプロジェクト（開発サーバーやgit操作用）
- 右pane：新しいworktreeでClaude起動（コンテキスト付き）

#### tmux外での実行

```bash
# tmux外で実行
npm run worktree:new -- feat new-feature

# worktreeのみ作成される（警告メッセージを表示）
# 手動でworktreeディレクトリに移動してClaudeを起動
cd ../schedule-app-feat-new-feature
claude
```

## Workflow Examples

### 新機能追加の場合（推奨: tmux統合）

```bash
# tmuxセッション内で実行
tmux

# 1. worktreeを作成（タスク説明付き）
npm run worktree:new -- feat new-feature --task "新しいUI要素を追加"

# 2. 自動で以下が実行されます：
#    - worktree作成、依存関係インストール
#    - 新しいpaneが作成される
#    - 新しいpaneでClaudeが起動し、タスクコンテキストを自然文で送信
#    - Claudeが自動的に適切なワークフロー（planner, tdd-guide等）を選択

# 3. 左paneでは、元のプロジェクトで開発サーバーなど実行可能
#    右paneでは、Claudeが新しいworktreeのコンテキストで動作

# 4. 変更をコミット、プッシュし、PR作成（推奨）
/ship

# または手動で実行
git add .
git commit -m "feat: 新機能の説明"
git push -u origin feat/new-feature
gh pr create --title "..." --body "..."
```

**推奨**: `/ship`スキルを使用すると、コミット、プッシュ、PR作成を自動化できます。詳細は`.claude/skills/ship/SKILL.md`を参照。

### シンプルな使い方（タスク説明なし）

```bash
# タスク説明を指定しない場合
npm run worktree:new -- fix bug-fix

# コンテキストファイルに「タスク説明はありません」と表示されます
```

### 別の修正が必要になった場合（tmux利用）

```bash
# tmuxセッション内で複数のworktreeを並行作業

# 1つ目のworktreeが既に開いている状態で、
# 緊急のバグ修正が必要な場合：

# 元のpaneに戻る（またはメインプロジェクトディレクトリで実行）
cd ../schedule-app

# 2つ目のworktreeを作成（別のpaneが自動作成される）
npm run worktree:new -- fix urgent-bug --task "緊急バグ修正"

# 左右のpaneを切り替えて、複数タスクを並行作業可能
# tmux pane切り替え: Ctrl-b + 方向キー（または Ctrl-b + o）
```

### 複数ブランチの並行作業

worktreeの最大のメリットは、複数のブランチを同時に作業できること：

```bash
# 機能開発用のworktree（開発サーバー起動）
cd ../schedule-app-feat-new-feature
npm run dev  # ポート5173で起動

# 別ターミナルで緊急バグ修正（依存関係も自動インストール）
cd ../schedule-app
npm run worktree:new -- fix urgent-bug
cd ../schedule-app-fix-urgent-bug
# 修正してコミット

# 開発サーバーはそのまま起動し続けている！
```

## Worktree Management

### worktree一覧の確認

```bash
npm run worktree:list
```

### worktreeの削除（任意）

worktreeが不要になった場合は削除できます：

```bash
# メインプロジェクトから実行
cd ../schedule-app
npm run worktree:remove -- feat new-feature
```

**Note**: マージ済みブランチのworktreeは、`npm run worktree:cleanup`で一括削除できます。

### 環境設定ファイルの自動コピー

`npm run worktree:new`を実行すると、以下のファイルが自動的にコピーされます：

- `.env` - 環境変数設定（存在する場合）
- `.env.local` - ローカル環境変数設定（存在する場合）
- `.mcp.json` - MCP（Model Context Protocol）サーバー設定
- `.claude/settings.local.json` - Claude Codeのローカル設定（権限・フック）

追加でコピーしたいファイルがある場合は `scripts/new-worktree.sh` の `FILES_TO_COPY` 配列を編集してください。

### 注意事項

1. **node_modulesは共有しない**
   - worktree作成時に`npm install`が自動実行されます
   - worktreeごとに独立した依存関係を持つため、互いに影響しません
   - 依存関係を更新した場合は、各worktreeで再度`npm install`を実行してください

2. **worktreeディレクトリの場所**
   - 親ディレクトリに作成されます（例: `../schedule-app-feat-new-feature/`）
   - `.gitignore`の影響を受けません

3. **worktreeとブランチの管理**
   - worktreeを削除してもブランチは残ります
   - マージ済みブランチのworktreeは`npm run worktree:cleanup`で一括削除できます
   - ブランチも削除する場合は`git branch -D <branch-name>`を実行

## Best Practices

1. **小さな変更**: PRは小さく保つ（レビューしやすい）
2. **明確なコミットメッセージ**: 何を変更したか明確に記述
3. **テスト実行**: PRを作成する前に必ずテストを実行
4. **競合の解決**: PRマージ前にベースブランチの最新変更を取り込む
5. **worktreeの管理**: マージ済みブランチのworktreeは`npm run worktree:cleanup`で定期的に削除

## Commit Message Format

コミットメッセージの形式については、`.claude/skills/ship/SKILL.md`を参照してください。

`/ship`スキルを使用すると、変更内容に基づいた適切なcommit messageが自動生成されます。

---

**Remember**: クリーンなGit履歴は、チーム開発とコードレビューの基盤。
