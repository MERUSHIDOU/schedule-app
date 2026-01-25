# スケジュールアプリ

React + TypeScript + Vite で構築されたPWA対応のスケジュール管理アプリです。

**このプロジェクトはClaude Code + 専門的なエージェント体系を採用しています。** 開発する際は、[開発ガイド](#開発ガイド)を必ず読んでください。

## 機能

- カレンダー表示（月表示、前月/次月ナビゲーション）
- スケジュールのCRUD操作（作成・読取・更新・削除）
- ローカルストレージによるデータ永続化
- PWA対応（オフライン動作、ホーム画面に追加可能）
- レスポンシブデザイン（iPhone対応）

## 技術スタック

- **フレームワーク**: React 19
- **言語**: TypeScript
- **ビルドツール**: Vite
- **PWA**: vite-plugin-pwa

## クイックスタート

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

---

## 開発ガイド

### 📌 プロジェクト方針

このプロジェクトは以下の5つのコア原則に基づいて開発されています：

#### 1. テスト駆動開発（TDD）必須 ✅
すべての新機能実装・バグ修正はテストファーストで行う
- **RED**: テストを先に書く
- **GREEN**: テストを通す最小限のコードを実装
- **REFACTOR**: テストを保ちながら改善
- **CHECK**: 80%以上のテストカバレッジを維持

#### 2. 事前計画と承認 📋
複雑な機能やリファクタリングは、実装前に必ず計画を策定・承認
- 要件を明確化
- リスクを評価
- 段階的な計画を作成
- ユーザーの承認を得る

#### 3. セキュリティ優先 🔒
本番環境に展開する前に、すべてのコードに対してセキュリティレビューを実施
- ハードコードされたシークレット検出
- SQLインジェクション・XSS等の脆弱性検出
- OWASP Top 10チェック
- 依存関係の脆弱性チェック

#### 4. 最小限の変更 🎯
エラー修正や変更は、必ず最小限の差分を心がける
- 不要なリファクタリングは避ける
- アーキテクチャ変更は設計フェーズで決定
- コードスタイル改善は別のタスク

#### 5. Safari/iOS対応 🍎
Safari + iPhone環境での動作を前提に設計
- Safari非対応のHTML/CSS/JS機能は使用禁止
- 実装前に常にSafari/iOS Safari互換性を確認
- iOS固有のUI/UX（セーフエリア、タッチ操作等）を考慮

---

## 🤖 利用可能なエージェント

このプロジェクトには8つの専門的なエージェントが導入されています：

### エージェント体系図

```
開発フェーズ         エージェント              用途
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
計画・設計          planner               要件確認・計画策定
                    architect             建築的決定・設計

実装                tdd-guide             テスト駆動開発

エラー処理          build-error-resolver  ビルド・型エラー修正

レビュー・品質      code-reviewer         コード品質レビュー
                    security-reviewer     セキュリティ分析

テスト・検証        e2e-runner            E2Eテスト実施

保守・最適化        refactor-cleaner      不要コード削除
                    doc-updater           ドキュメント更新
```

### エージェント別の役割

| エージェント | 用途 | 使用時期 |
|-----------|------|---------|
| **planner** | 計画策定 | 新機能・リファクタリング時 |
| **architect** | 設計決定 | 複数実装方法がある・スケーラビリティ判断時 |
| **tdd-guide** | テスト駆動開発 | すべての実装時 |
| **security-reviewer** | セキュリティ分析 | ユーザー入力・認証・支払い時 |
| **build-error-resolver** | ビルド・型エラー修正 | ビルド失敗・型エラー時 |
| **code-reviewer** | コード品質レビュー | PR前・実装後 |
| **e2e-runner** | E2Eテスト | 重要なユーザーフロー検証 |
| **refactor-cleaner** | 不要コード削除 | コード保守時 |

---

## 🎮 利用可能なコマンド

```bash
/plan [機能]          # 実装計画を策定（複雑な機能時は必須）
/tdd [機能]           # テスト駆動開発で実装
/e2e [フロー]         # E2Eテストを生成・実行
/code-review          # コード品質・セキュリティをレビュー
/build-fix            # ビルド・TypeScript型エラーを修正
```

---

## 📊 ワークフロー別ガイド

### 新機能の追加（標準ワークフロー）

```
1. /plan で計画を策定
   ↓
2. 計画を確認・修正
   ↓
3. ユーザーが "yes" と承認
   ↓
4. /tdd でテスト駆動開発で実装
   ↓
5. npm run build でビルド確認
   ↓
6. /code-review でセキュリティと品質をレビュー
   ↓
7. /e2e で重要なユーザーフロー検証
   ↓
8. Safari/iOS Safari で互換性確認
   ↓
9. PR作成
```

### バグ修正ワークフロー

```
1. バグの原因を特定
   ↓
2. /tdd でテストを先に実装
   ↓
3. バグを修正
   ↓
4. /code-review でレビュー
   ↓
5. PR作成
```

### セキュリティが重要なコード（認証・支払い等）

```
1. /plan で詳細計画
   ↓
2. architect で security 観点のレビュー
   ↓
3. /tdd でテスト駆動実装
   ↓
4. /code-review で基本チェック
   ↓
5. security-reviewer で詳細セキュリティ分析
   ↓
6. 指摘事項を修正
   ↓
7. PR作成
```

### ビルドエラー対応

```
1. npm run build でエラー
   ↓
2. /build-fix コマンド実行
   ↓
3. エラーを自動解析・段階的に修正
   ↓
4. ビルド成功
```

---

## ✅ ベストプラクティス

### 1. 計画を軽視しない

❌ **してはいけないこと**:
- 大きな変更を計画なしに実装
- 複数の修正を1つのブランチで混ぜる
- セキュリティを後から考える

✅ **すべきこと**:
- 複雑な機能は必ず `/plan` を実行
- 1つのブランチ = 1つの修正
- セキュリティは最初から考える

### 2. テストを先に書く

```javascript
// テストを先に書く（RED）
test('calculateTotal は全アイテムの合計を返す', () => {
  const items = [{ price: 10 }, { price: 20 }]
  expect(calculateTotal(items)).toBe(30)
})

// テストを通すコードを実装（GREEN）
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// リファクタリング（REFACTOR）
function calculateTotal(items) {
  return items.reduce((total, { price }) => total + price, 0)
}
```

### 3. セキュリティを優先する

```javascript
// ❌ ユーザー入力をそのまま使用しない
const userId = req.query.id
const user = await db.query(`SELECT * FROM users WHERE id = ${userId}`)

// ✅ パラメータ化クエリを使用
const userId = req.query.id
const user = await db.query('SELECT * FROM users WHERE id = ?', [userId])
```

**セキュリティレビューの実施**:
```bash
# PR前に常に実行
/code-review

# ユーザー入力・認証・支払い処理の場合
# security-reviewer エージェント で詳細分析
```

### 4. 最小限の変更を心がける

```diff
# ✅ エラーのみを修正
# 結果：1〜3行の変更

# ❌ エラーを修正しながら
# - コードスタイルを改善
# - 関数を抽出
# - 変数を名前変更
# 結果：50行変更（避けるべき）
```

### 5. 明確なコミットメッセージ

```bash
# ❌ 避けるべき
git commit -m "fix"
git commit -m "update"

# ✅ 推奨
git commit -m "feat: ダッシュボードページを追加

- カレンダーウィジェットを実装
- 予定サマリーを表示
- テストカバレッジ: 85%"

git commit -m "fix: カレンダーの日付ズレを修正

原因: タイムゾーン処理の誤り
修正: UTC時刻に統一"
```

### 6. Safari/iOS Safari互換性を確認

```javascript
// ❌ Safari非対応の機能を使用
input[type="time" step="1"] {
  /* iOS Safariでは動作しない */
}

// ✅ Safari対応のセレクトボックスを使用
<select>
  <option value="09:00">9:00 AM</option>
  <option value="09:30">9:30 AM</option>
</select>
```

---

## 🆘 トラブルシューティング

### `npm run build` が失敗

```bash
# /build-fix コマンドを使用
/build-fix

# 段階的にエラーを修正
# - 型エラー
# - インポートエラー
# - モジュール解決エラー

# 再度ビルド確認
npm run build
```

### テストカバレッジが80%未満

```bash
# テストを追加
/tdd で不足しているテストを実装

# カバレッジレポートを確認
npm run test:coverage

# 未テスト部分にテストを追加
```

### セキュリティエラーが見つかった

```bash
# /code-review でどの問題か確認
/code-review

# security-reviewer で詳細分析
# 指摘事項を修正
# 再度レビュー
/code-review
```

### Safari/iOS Safari で動作しない

```bash
# Safari互換性を確認
# - HTML5機能（input type）
# - CSS機能（Grid、Flexbox）
# - JavaScript API（fetch、Promise）

# 互換性のあるコードに修正
# /e2e で Safari での動作確認
```

---

## 📚 参考資料

### プロジェクト設定
- **CLAUDE.md** - プロジェクト全体設定
- **DEVELOPMENT_GUIDE.md** - 詳細な開発ガイド
- **AGENTS_SETUP_COMPLETE.md** - エージェント体系の詳細

### エージェントドキュメント
詳細については `.claude/agents/` 内の各ファイルを参照してください：
- `planner.md` - 計画専門家
- `architect.md` - 設計決定専門家
- `tdd-guide.md` - テスト駆動開発
- `security-reviewer.md` - セキュリティ分析
- `build-error-resolver.md` - ビルド修正
- 他 3つのエージェント

---

## 開発コマンド一覧

### テスト実行

```bash
# ユニットテスト実行（ウォッチモード）
npm test

# ユニットテスト実行（一度だけ）
npm run test:run

# テストカバレッジ確認
npm run test:coverage

# E2Eテスト初期セットアップ
npm run playwright:install

# E2Eテスト実行（ヘッドレスモード）
npm run test:e2e

# E2Eテスト実行（UIモード - テスト結果を視覚的に確認）
npm run test:e2e:ui

# E2Eテスト実行（ヘッドモード - ブラウザを表示）
npm run test:e2e:headed

# E2Eテスト実行（デバッグモード）
npm run test:e2e:debug
```

### ビルド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果プレビュー
npm run preview
```

---

## テスト

### ユニットテスト（Vitest）

```bash
# テストを実行（ウォッチモード）
npm test

# テストを一度だけ実行
npm run test:run
```

### E2Eテスト（Playwright）

初回のみ、Playwrightのブラウザをインストールする必要があります：

```bash
# Playwrightのブラウザをインストール
npm run playwright:install
```

テストの実行：

```bash
# E2Eテストを実行（ヘッドレスモード）
npm run test:e2e

# E2Eテストを実行（UIモード - テスト結果を視覚的に確認）
npm run test:e2e:ui

# E2Eテストを実行（ヘッドモード - ブラウザを表示）
npm run test:e2e:headed

# E2Eテストをデバッグモードで実行
npm run test:e2e:debug
```

E2Eテストは以下のブラウザで実行されます：
- Mobile Safari（iPhone 14 Pro）のみ

## プロジェクト構成

```
src/
├── components/      # UIコンポーネント
│   ├── Calendar.tsx
│   ├── ScheduleForm.tsx
│   └── ScheduleList.tsx
├── hooks/           # カスタムフック
│   └── useSchedules.ts
├── types/           # 型定義
│   └── schedule.ts
├── utils/           # ユーティリティ関数
│   ├── date.ts
│   └── storage.ts
├── App.tsx
└── main.tsx
```

## ライセンス

MIT
