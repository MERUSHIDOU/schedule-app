# 開発ワークフロー

## フロー全体

### パターンA: /implementスキル使用（推奨）

```
ユーザー: /implement [機能]
      ↓
メインClaude:
  1. ブランチ名決定
  2. 複雑さ判断
  3. npm run worktree:new -- <type> <name> --prompt "<プロンプト>"
     - シンプル: プロンプト = "[機能]"
     - 複雑: プロンプト = "/plan [機能]"
  4. 終了
      ↓
新セッションClaude:
  [シンプル]              [複雑]
      ↓                      ↓
  /tdd で実装          /plan で計画策定
      ↓                      ↓
  /code-review         承認後 /tdd
      ↓                      ↓
  [セキュリティ?] → Yes → /security-review
      ↓ No                   ↓
  /ship                  /code-review → /ship
```

### パターンB: 直接実装（従来）

```
指示 → [建築的判断必要?] → Yes → architect → ADR/設計
                          ↓ No
                          ↓
       [複雑?] → Yes → /plan → 計画書（plans/）
       or /plan   ↓ No
                  ↓
             /tdd → 実装
                  ↓
          /code-review → 修正（最大3回）
                  ↓
       [セキュリティ変更?] → Yes → /security-review → 修正（最大3回）
                          ↓ No
                          ↓
                      /ship → PR作成
```

## 1. アーキテクチャ設計（条件付き）

以下の場合、architectエージェントが自動起動：
- 新しいシステム/機能のアーキテクチャ設計
- 大規模リファクタリング（10ファイル以上）
- 技術スタック選定
- データモデル設計
- スケーラビリティ検討

**成果物:** アーキテクチャ決定レコード（ADR）、設計ドキュメント

## 2. 実装計画策定

**自動判断（推奨）:**
```
複雑な機能をリクエスト → Claudeが自動的にplannerエージェントを起動
簡単な機能をリクエスト → メインエージェントが実装内容を考える
```

**明示的呼び出し:**
```bash
/plan [機能]  # plannerエージェントを強制起動
```

**成果物:** 実装計画書（`plans/YYYY-MM-DD_<feature-name>.md`）

## 3. 実装

```bash
/tdd [機能]  # tdd-guideエージェントがテストファーストで実装
```

- アーキテクチャ設計・実装計画書がある場合はそれに従う
- ない場合は直接実装
- TDDワークフロー: RED（テスト書く） → GREEN（実装） → REFACTOR（改善）
- カバレッジ80%以上を確認

**実装時の注意:**
- 過度なエンジニアリングを避ける（要求された機能のみ実装）
- Safari + iPhone環境対応を確認
- 既存パターンに従う

## 4. コードレビュー（必須）

```bash
/code-review  # セキュリティと品質の包括的レビュー
```

- CRITICALまたはHIGH問題がある場合は修正必須
- 修正後、再レビュー（最大3回）
- 3回で修正しきれない場合は人間に承認を求める

## 5. セキュリティレビュー（条件付き）

以下の場合のみ実施：
- 変更が多い（10ファイル以上）
- 認証・APIエンドポイント・機密データの変更
- ユーザー入力の処理を追加

```bash
/security-review  # セキュリティ分析
```

- 修正後、再レビュー（最大3回）

## 6. PR作成

```bash
/ship  # コミット、プッシュ、PR作成を自動化
```

## ワークフロー例

### /implementスキル使用（推奨）

**簡単な機能追加:**
```
ユーザー: /implement ログアウトボタンを追加
→ メインClaude: ブランチ決定、worktree作成、プロンプト送信、終了
→ 新セッションClaude: /tdd → /code-review → /ship
```

**複雑な機能追加:**
```
ユーザー: /implement ユーザー認証システムを追加
→ メインClaude: ブランチ決定、worktree作成、/plan付きプロンプト送信、終了
→ 新セッションClaude: /plan → 承認 → /tdd → /code-review → /security-review → /ship
```

### 直接実装（従来）

**簡単な機能追加:**
```
ユーザー: 「ログアウトボタンを追加」
→ /tdd → /code-review → /ship
```

**複雑な機能追加:**
```
ユーザー: 「ユーザー認証システムを追加」
→ architect → /plan → /tdd → /code-review → /security-review → /ship
```

## 補足

**トラブルシューティング:**
- ビルドエラー: `/build-fix`
- E2Eテスト: `/e2e [フロー]`

**参照ドキュメント:**
- Git Workflow: `.claude/rules/workflow.md`
- Testing: `.claude/rules/testing.md`
- Agents: `.claude/rules/agents.md`
