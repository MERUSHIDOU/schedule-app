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

ブランチ名の規則は `CLAUDE.md` を参照。

## Workflow Examples

### 新機能追加の場合

```bash
# 1. 新しいworktreeを作成（依存関係も自動インストール）
npm run worktree:new feat new-feature

# 2. worktreeディレクトリに移動
cd ../schedule-app-feat-new-feature

# 3. 開発サーバーを起動して変更を実装
npm run dev

# 4. 変更をコミット、プッシュし、PR作成（推奨）
/ship

# または手動で実行
git add .
git commit -m "feat: 新機能の説明"
git push -u origin feat/new-feature
gh pr create --title "..." --body "..."
```

**推奨**: `/ship`スキルを使用すると、コミット、プッシュ、PR作成を自動化できます。詳細は`.claude/skills/ship/SKILL.md`を参照。

### 別の修正が必要になった場合

```bash
# ❌ 間違った方法: 既存のworktreeで別の作業
cd ../schedule-app-feat-new-feature  # これはダメ！

# ✅ 正しい方法: メインプロジェクトから新しいworktreeを作成
cd ../schedule-app
npm run worktree:new fix another-issue  # 依存関係も自動インストール
cd ../schedule-app-fix-another-issue
```

### 複数ブランチの並行作業

worktreeの最大のメリットは、複数のブランチを同時に作業できること：

```bash
# 機能開発用のworktree（開発サーバー起動）
cd ../schedule-app-feat-new-feature
npm run dev  # ポート5173で起動

# 別ターミナルで緊急バグ修正（依存関係も自動インストール）
cd ../schedule-app
npm run worktree:new fix urgent-bug
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
npm run worktree:remove feat new-feature
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
