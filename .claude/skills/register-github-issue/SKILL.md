---
name: register-github-issue
description: GitHubのIssueを作成します。バグ報告、機能追加リクエスト、改善提案などをIssueとして登録する際に使用してください。
allowed-tools: Bash(gh:*)
---

# GitHub Issue登録

## 概要

このスキルはGitHub Issueを適切な形式で作成するためのものです。ユーザーからの要望に基づいて、構造化されたIssueを作成します。

## 使用するタイミング

- バグを発見したときに報告する
- 新機能のリクエストを登録する
- 改善提案を記録する
- タスクをチームで共有する

## Issue作成ワークフロー

### ステップ1: 情報収集

ユーザーから以下の情報を収集します：
- **タイトル**: 明確で簡潔な要約（50-70文字程度）
- **詳細**: 背景、影響範囲、必要な対応
- **種別**: bug | enhancement | documentation | improvement
- **優先度**: critical | high | medium | low (オプション)
- **ラベル**: 追加のカテゴリーラベル (オプション)
- **担当者**: GitHubユーザー名 (オプション)

### ステップ2: テンプレートを使用

[templates.md](templates.md)から適切なテンプレートを選択：
- バグ報告 → バグレポートテンプレート
- 機能追加 → 機能リクエストテンプレート
- 改善提案 → 改善テンプレート

### ステップ3: Issueを作成

`gh issue create`コマンドを使用してIssueを作成：

```bash
gh issue create \
  --title "Issueのタイトル" \
  --body "テンプレートから作成したIssue本文" \
  --label "label1,label2"
```

担当者を指定する場合：
```bash
gh issue create \
  --title "Issueのタイトル" \
  --body "Issue本文" \
  --label "enhancement" \
  --assignee "@username"
```

### ステップ4: 確認とリンク

Issue作成後：
- Issue URLを提供
- 関連Issueがあれば言及
- 次のステップを提案

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
- 種別: bug, enhancement, documentation
- 優先度: critical, high, medium, low
- 状態: blocked, in-progress, review

### Issue間のリンク
- `Closes #123` - 関連Issueをクローズ
- `Related to #456` - 関連Issue

## 例

### バグ報告の例

```bash
gh issue create \
  --title "スケジュール削除後も表示が残る" \
  --body "## 概要
スケジュールを削除した後も、カレンダー表示に削除したスケジュールが残り続ける

## 再現手順
1. スケジュールを作成
2. 作成したスケジュールを削除
3. カレンダー表示を確認

## 期待される動作
削除したスケジュールはカレンダーから即座に消える

## 実際の動作
削除したスケジュールがカレンダー表示に残り続ける

## 環境
- ブラウザ: Chrome 120
- OS: Windows 11" \
  --label "bug,priority:high"
```

### 機能追加の例

```bash
gh issue create \
  --title "通知・リマインダー機能の追加" \
  --body "## 概要
スケジュール開始時刻の前に通知を受け取れる機能

## 解決する問題
予定を忘れないようにリマインダーが欲しい

## 提案する解決策
- スケジュール作成時に通知設定を追加
- 開始時刻の5分前、15分前、30分前から選択可能
- ブラウザ通知で表示

## 受け入れ条件
- [ ] 通知設定UIの実装
- [ ] 通知タイミングの設定機能
- [ ] ブラウザ通知の実装
- [ ] 通知のオン/オフ切り替え" \
  --label "enhancement"
```

## 注意事項

- Issue作成前に、既存のIssueと重複していないか確認してください
- 適切なラベルを付与して、検索しやすくしてください
- 必要に応じて関連Issueやコミットへのリンクを含めてください
