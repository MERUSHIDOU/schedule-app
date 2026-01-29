# ship

現在の変更をコミットしてプッシュし、Pull Requestを作成する統合スキル。

## 概要

`/ship` スキルは、開発ワークフローの最終段階を自動化します：

1. **変更内容の確認** - git status, git diffで変更を確認
2. **コミット** - 適切なcommit messageを生成してコミット
3. **プッシュ** - リモートブランチにプッシュ
4. **PR作成** - GitHubでPull Requestを作成

## 使用方法

```bash
/ship
```

引数は不要です。現在のブランチの変更を自動的に検出して処理します。

## 前提条件

- git worktreeで作業していること
- 変更がステージング前またはステージング済みであること
- リモートリポジトリが設定されていること
- GitHub CLIが認証済みであること

## 実行内容

### 1. 変更内容の分析

- `git status` - 変更されたファイルを確認
- `git diff` - 変更内容の詳細を確認
- `git log` - 最近のコミット履歴から命名規則を学習

### 2. コミット

- 変更内容に基づいた適切なcommit messageを生成
- `git add .` で変更をステージング
- `git commit` でコミット（Co-Authored-By付き）

### 3. プッシュ

- 現在のブランチをリモートにプッシュ
- `-u` フラグで追跡ブランチを設定

### 4. Pull Request作成

- commit messageとdiffからPRのタイトルと説明を生成
- `gh pr create` でPRを作成
- PR URLを返す

## Commit Message形式

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

## Pull Request形式

```markdown
## Summary
- 変更内容の要約（1-3箇条書き）

## Details
- 詳細な説明（必要に応じて）

## Test plan
- テスト方法のチェックリスト

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 例

```bash
# ドキュメントを修正後
/ship

# 実行内容:
# 1. git status, git diffで変更を確認
# 2. "docs: Claude設定ドキュメントを更新" というcommit messageを生成
# 3. git add . && git commit
# 4. git push -u origin docs/claude-config
# 5. gh pr create でPR作成
# 6. PR URLを返す
```

## 注意事項

- **変更内容の確認**: コミット前に必ず変更内容を表示するため、確認してください
- **小さなPR**: 大きな変更は複数のPRに分割することを推奨
- **テスト実行**: 重要な変更の場合は、事前にテストを実行してください
- **pre-commit hooks**: hooksが設定されている場合は自動実行されます
- **コンフリクト**: ベースブランチの更新が必要な場合は手動で解決してください

## トラブルシューティング

### "Nothing to commit"エラー
→ 変更がない場合はコミットされません。ファイルを編集してください。

### Push失敗
→ リモートブランチが存在する場合は、`git pull`で最新化してください。

### PR作成失敗
→ GitHub CLIの認証を確認: `gh auth status`

### Commit hook失敗
→ hookのエラーメッセージを確認して修正し、再度`/ship`を実行してください。

## 関連スキル

- `/tdd-workflow` - テスト駆動開発ワークフロー
- `/code-review` - コードレビュー

## 設定

特別な設定は不要です。プロジェクトの`.git/config`とGitHub CLIの設定を使用します。
