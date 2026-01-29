# Ship スキル実行手順

このスキルは、現在の変更をコミット、プッシュし、Pull Requestを作成します。

## 実行フロー

### Phase 1: 変更内容の確認と分析

1. **並列で以下のgitコマンドを実行**（並列実行で効率化）:
   ```bash
   git status
   git diff --staged
   git diff
   git log --oneline -10
   ```

2. **変更内容を分析**:
   - 変更されたファイルのリストを確認
   - 変更の種類を判断（feat/fix/docs/refactor/test/chore）
   - 変更の影響範囲を把握

3. **変更がない場合**:
   - ユーザーに「変更がありません」と通知して終了

### Phase 2: Commit Message生成

1. **変更内容に基づいてcommit messageを生成**:
   - **Type**: 変更の種類を判断
     - `docs`: ドキュメントのみの変更
     - `feat`: 新機能追加
     - `fix`: バグ修正
     - `refactor`: リファクタリング
     - `test`: テスト追加・修正
     - `chore`: ビルド・設定変更

   - **Subject**: 簡潔な要約（50文字以内、日本語可）

   - **Body**: 詳細な説明（必要に応じて）
     - なぜこの変更が必要か
     - 何を変更したか
     - 影響範囲

2. **Commit message形式**:
   ```
   <type>: <subject>

   <body>

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```

### Phase 3: Commit実行

1. **ステージングとコミット**を順次実行:
   ```bash
   git add .
   git commit -m "$(cat <<'EOF'
   <生成したcommit message>

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

2. **コミット失敗時（pre-commit hook等）**:
   - エラーメッセージを確認
   - 修正方法をユーザーに提案
   - 修正後、**新しいコミット**を作成（--amendは使わない）

### Phase 4: Push実行

1. **現在のブランチ名を取得**:
   ```bash
   git branch --show-current
   ```

2. **リモートにプッシュ**:
   ```bash
   git push -u origin <branch-name>
   ```

3. **Push失敗時**:
   - リモートの変更を確認: `git fetch && git status`
   - 必要に応じて`git pull --rebase`を提案
   - コンフリクトがある場合は手動解決を促す

### Phase 5: Pull Request作成

1. **PRのタイトルと説明を生成**:

   - **Title**: commit messageのsubjectを使用（70文字以内）

   - **Body**:
     ```markdown
     ## Summary
     - 変更内容の要約（1-3箇条書き）

     ## Details
     変更の詳細説明（commit bodyを元に作成）

     ## Test plan
     - [ ] 動作確認項目1
     - [ ] 動作確認項目2

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     ```

2. **gh CLIでPR作成**（HEREDOCで本文を渡す）:
   ```bash
   gh pr create --title "<title>" --body "$(cat <<'EOF'
   <生成したPR body>
   EOF
   )"
   ```

3. **PR作成成功時**:
   - PR URLをユーザーに通知
   - 作業完了のメッセージを表示

4. **PR作成失敗時**:
   - エラーメッセージを確認
   - GitHub CLI認証状態を確認: `gh auth status`
   - 解決方法をユーザーに提案

## 重要な実装ルール

### Git Safety Protocol（厳守）

- ❌ **絶対にしないこと**:
  - `git config`の変更
  - `--force`フラグの使用
  - `--no-verify`でhooksをスキップ
  - `--amend`で既存コミットを変更（hookエラー後は特に禁止）
  - `git add -A`や`git add .`以外の大量ステージング

- ✅ **必ずすること**:
  - 変更内容を事前に表示してユーザーに確認を促す
  - Hook失敗時は新しいコミットを作成
  - エラー時は原因を明確に説明

### Parallel Execution

独立したgitコマンドは並列実行で効率化：
```markdown
# 良い例
git status, git diff, git log を並列実行

# 悪い例
git status → 結果確認 → git diff → 結果確認 → git log
```

### Error Handling

各フェーズでエラーハンドリング：
1. エラー検出
2. 原因分析
3. 解決方法提示
4. 必要に応じて再実行

## 出力形式

ユーザーへの出力は明確で簡潔に：

```markdown
## 変更内容

<変更されたファイルのリスト>

## Commit Message

<生成したcommit message>

## 実行結果

✅ コミット完了
✅ プッシュ完了
✅ Pull Request作成完了

PR URL: <url>

作業完了！ PRをレビューしてマージしてください。
```

## Context

- **context:fork**: 使用しない（メインコンテキストを引き継ぐ）
- **理由**: 現在のgit状態や変更内容を理解する必要があるため

## Testing

このスキル実装後は、以下をテスト：
1. 通常のコミット・プッシュ・PR作成
2. 変更がない場合の処理
3. pre-commit hook失敗時の処理
4. Push失敗時の処理
5. PR作成失敗時の処理

---

**Remember**: ユーザーの作業を効率化するスキル。安全性と明確性を最優先に実装すること。
