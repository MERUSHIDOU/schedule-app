# Git Workflow Rules

## Branch and Pull Request Workflow

### Always Work on New Branches

すべての変更（機能追加、バグ修正、ドキュメント変更など）は新しいブランチで作業すること。

### One Branch, One Change Principle

**各修正は必ず別のブランチで作業する。**

- ❌ **禁止**: 既存のブランチに別の修正を追加
- ✅ **必須**: 新しい修正は最新のベースブランチから新しいブランチを作成

### All Changes via Pull Requests

変更は直接メインブランチにプッシュせず、必ずPull Requestとして提出すること。

## Branch Naming Convention

ブランチ名の規則は `CLAUDE.md` を参照。

## Workflow Examples

### 新機能追加の場合

```bash
# 1. ベースブランチから新しいブランチを作成
git checkout master
git pull origin master
git checkout -b feat/new-feature

# 2. 変更を実装

# 3. コミット
git add .
git commit -m "feat: 新機能の説明"

# 4. プッシュしてPR作成
git push -u origin feat/new-feature
# GitHub上でPRを作成
```

### 別の修正が必要になった場合

```bash
# ❌ 間違った方法: 既存のブランチで作業
git checkout feat/new-feature  # これはダメ！

# ✅ 正しい方法: 新しいブランチを作成
git checkout master
git pull origin master
git checkout -b fix/another-issue
```

## Best Practices

1. **小さな変更**: PRは小さく保つ（レビューしやすい）
2. **明確なコミットメッセージ**: 何を変更したか明確に記述
3. **テスト実行**: PRを作成する前に必ずテストを実行
4. **競合の解決**: PRマージ前にベースブランチの最新変更を取り込む

## Commit Message Format

以下の形式を推奨：

```
<type>: <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `refactor`: リファクタリング
- `test`: テストの追加・修正
- `chore`: ビルド、設定ファイルの変更

---

**Remember**: クリーンなGit履歴は、チーム開発とコードレビューの基盤。
