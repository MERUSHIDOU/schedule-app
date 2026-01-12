---
name: register-github-issue
description: GitHubのIssueを作成・更新します。バグ報告、機能追加リクエスト、改善提案などをIssueとして管理する際に使用してください。
allowed-tools: github:*
---

# GitHub Issue管理

## 概要

このスキルはGitHub IssueをMCP（Model Context Protocol）を通じて作成・更新するためのものです。ユーザーからの要望に基づいて、構造化されたIssueを管理します。

## 使用するタイミング

- バグを発見したときに報告する
- 新機能のリクエストを登録する
- 改善提案を記録する
- タスクをチームで共有する
- 既存Issueの状態やラベルを更新する
- Issueに担当者を設定・変更する

## 前提条件

### MCPサーバーの設定

プロジェクトの`.mcp.json`にGitHub MCPサーバーが設定されている必要があります：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### GitHub Personal Access Token

環境変数`GITHUB_TOKEN`に以下の権限を持つトークンを設定してください：
- `repo` - プライベートリポジトリへのアクセス
- `public_repo` - パブリックリポジトリへのアクセス（最小権限）

## Issue作成ワークフロー

### ステップ1: アクションの判定

まず、ユーザーが望むアクションを特定します：
- **新規作成**: 新しいIssueを作成
- **更新**: 既存Issueの編集（ラベル追加、担当者変更、ステータス変更など）

### ステップ2: 情報収集

#### 新規作成の場合
以下の情報を収集します：
- **タイトル**: 明確で簡潔な要約（50-70文字程度）
- **詳細**: 背景、影響範囲、必要な対応
- **種別**: bug | feature | improvement | documentation
- **優先度**: critical | high | medium | low (オプション)
- **ラベル**: 追加のカテゴリーラベル (オプション)
- **担当者**: GitHubユーザー名 (オプション)

#### 更新の場合
以下の情報を収集します：
- **Issue番号**: 更新対象のIssue番号
- **変更内容**: タイトル、本文、ラベル、担当者、ステータスなど

### ステップ3: リポジトリ情報の取得

MCPツールには`owner`（リポジトリオーナー）と`repo`（リポジトリ名）が必要です。

**自動検出を試みる**:
1. `.git/config`から`remote.origin.url`を取得
2. URLから`owner`と`repo`を抽出
3. 例: `https://github.com/MERUSHIDOU/schedule-app.git` → `owner=MERUSHIDOU`, `repo=schedule-app`

**自動検出が失敗した場合**:
ユーザーに直接`owner`と`repo`を質問してください。

### ステップ4: テンプレートを使用（新規作成時）

[templates.md](templates.md)から適切なテンプレートを選択：
- バグ報告 → バグレポートテンプレート
- 機能追加 → 機能リクエストテンプレート
- 改善提案 → 改善テンプレート
- ドキュメント → ドキュメント改善テンプレート
- タスク → タスク/チェックリストテンプレート

### ステップ5: MCPツールの実行

#### Issue作成

```
ツール: github:create_issue
パラメータ:
- owner: リポジトリオーナー
- repo: リポジトリ名
- title: Issueタイトル
- body: Issue本文（テンプレートから作成）
- labels: ["bug", "priority:high"] (オプション)
- assignees: ["username1", "username2"] (オプション)
```

#### Issue更新

```
ツール: github:update_issue
パラメータ:
- owner: リポジトリオーナー
- repo: リポジトリ名
- issue_number: Issue番号
- title: 新しいタイトル (オプション)
- body: 新しい本文 (オプション)
- state: "open" or "closed" (オプション)
- labels: ["improvement", "in-progress"] (オプション)
- assignees: ["username"] (オプション)
```

### ステップ6: 結果の確認とフィードバック

Issue作成・更新後：
- Issue URLを提供（例: `https://github.com/owner/repo/issues/123`）
- 作成・更新した内容のサマリーを表示
- 関連Issueがあれば言及
- 次のステップを提案（必要に応じて）

## ベストプラクティス

### タイトルの書き方
- **悪い例**: "バグ修正"
- **良い例**: "APIが無効なトークンで500エラーを返す"

### 説明の書き方
以下を含めること：
- 何をしようとしていたか
- 実際に何が起きたか
- どうあるべきか

### ラベルの使い方
- 種別: bug, feature, improvement, documentation, refactoring
- 優先度: priority:critical, priority:high, priority:medium, priority:low
- 状態: blocked, in-progress, review
- その他: good first issue, help wanted, question

### Issue間のリンク
本文中で以下のように参照：
- `Closes #123` - 関連Issueをクローズ
- `Related to #456` - 関連Issue
- `Fixes #789` - このIssueが修正されると#789も解決

## 使用例

### バグ報告の例

**収集した情報**:
- タイトル: "スケジュール削除後も表示が残る"
- 種別: bug
- 優先度: high
- テンプレート: バグレポート

**MCPツール呼び出し**:
```
github:create_issue
{
  "owner": "MERUSHIDOU",
  "repo": "schedule-app",
  "title": "スケジュール削除後も表示が残る",
  "body": "## 概要\nスケジュールを削除した後も、カレンダー表示に削除したスケジュールが残り続ける\n\n## 再現手順\n1. スケジュールを作成\n2. 作成したスケジュールを削除\n3. カレンダー表示を確認\n\n## 期待される動作\n削除したスケジュールはカレンダーから即座に消える\n\n## 実際の動作\n削除したスケジュールがカレンダー表示に残り続ける\n\n## 環境\n- ブラウザ: Chrome 120\n- OS: Windows 11",
  "labels": ["bug", "priority:high"]
}
```

### 機能追加の例

**MCPツール呼び出し**:
```
github:create_issue
{
  "owner": "MERUSHIDOU",
  "repo": "schedule-app",
  "title": "通知・リマインダー機能の追加",
  "body": "## 概要\nスケジュール開始時刻の前に通知を受け取れる機能\n\n## 解決する問題\n予定を忘れないようにリマインダーが欲しい\n\n## 提案する解決策\n- スケジュール作成時に通知設定を追加\n- 開始時刻の5分前、15分前、30分前から選択可能\n- ブラウザ通知で表示\n\n## 受け入れ条件\n- [ ] 通知設定UIの実装\n- [ ] 通知タイミングの設定機能\n- [ ] ブラウザ通知の実装\n- [ ] 通知のオン/オフ切り替え",
  "labels": ["feature"]
}
```

### Issue更新の例

**ラベル追加**:
```
github:update_issue
{
  "owner": "MERUSHIDOU",
  "repo": "schedule-app",
  "issue_number": 42,
  "labels": ["bug", "priority:high", "in-progress"]
}
```

**担当者設定**:
```
github:update_issue
{
  "owner": "MERUSHIDOU",
  "repo": "schedule-app",
  "issue_number": 42,
  "assignees": ["developer-username"]
}
```

**Issueをクローズ**:
```
github:update_issue
{
  "owner": "MERUSHIDOU",
  "repo": "schedule-app",
  "issue_number": 42,
  "state": "closed"
}
```

## エラーハンドリング

### よくあるエラー

1. **認証エラー**: `GITHUB_TOKEN`が設定されていないか、権限が不足
   - 解決策: トークンを確認し、必要な権限を付与

2. **リポジトリが見つからない**: `owner`または`repo`が間違っている
   - 解決策: リポジトリ情報を再確認

3. **Issue番号が存在しない**: 更新しようとしたIssueが見つからない
   - 解決策: Issue番号を確認

4. **権限エラー**: リポジトリへの書き込み権限がない
   - 解決策: リポジトリのコラボレーター設定を確認

## 注意事項

- Issue作成前に、既存のIssueと重複していないか確認してください
- 適切なラベルを付与して、検索しやすくしてください
- 必要に応じて関連IssueやコミットへのリンクXを含めてください
- MCPツールを使用するには、`.mcp.json`の設定と環境変数`GITHUB_TOKEN`が必須です

## トラブルシューティング

### MCPサーバーが起動しない

1. `@modelcontextprotocol/server-github`がインストールされているか確認
   ```bash
   npm list -g @modelcontextprotocol/server-github
   ```

2. `.mcp.json`の設定が正しいか確認

3. `GITHUB_TOKEN`環境変数が設定されているか確認
   ```bash
   echo $GITHUB_TOKEN
   ```

### ツールが見つからない

Claude Codeを再起動して、MCPサーバーを再読み込みしてください。
