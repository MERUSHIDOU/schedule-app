---
name: tdd-workflow
description: 新機能の作成、バグ修正、コードのリファクタリング時に使用してください。ユニット、統合、E2Eテストを含む80%以上のカバレッジでテスト駆動開発を強制します。
---

# テスト駆動開発ワークフロー

このスキルは、すべてのコード開発が包括的なテストカバレッジを持つTDD原則に従うことを保証します。

## 使用すべき場面

- 新機能や機能を作成する時
- バグや問題を修正する時
- 既存のコードをリファクタリングする時
- APIエンドポイントを追加する時
- 新しいコンポーネントを作成する時

## 基本原則

### 1. コードの前にテスト
常にテストを先に書き、その後テストを通すためのコードを実装します。

### 2. カバレッジ要件
- 最小80%のカバレッジ（ユニット + 統合 + E2E）
- すべてのエッジケースをカバー
- エラーシナリオをテスト
- 境界条件を検証

### 3. テストタイプ

#### ユニットテスト
- 個別の関数とユーティリティ
- コンポーネントロジック
- 純粋関数
- ヘルパーとユーティリティ

#### 統合テスト
- APIエンドポイント
- データベース操作
- サービス間の相互作用
- 外部API呼び出し

#### E2Eテスト（Playwright）
- 重要なユーザーフロー
- 完全なワークフロー
- ブラウザ自動化
- UI操作

## TDDワークフローステップ

### ステップ1: ユーザージャーニーを書く
```
[役割]として、[アクション]したい、それにより[利点]を得るため

例:
ユーザーとして、マーケットを意味的に検索したい、
それにより正確なキーワードなしでも関連するマーケットを見つけられるようにするため。
```

### ステップ2: テストケースを生成
各ユーザージャーニーについて、包括的なテストケースを作成:

```typescript
describe('意味的検索', () => {
  it('クエリに対して関連するマーケットを返す', async () => {
    // テスト実装
  })

  it('空のクエリを適切に処理する', async () => {
    // エッジケースのテスト
  })

  it('Redis利用不可時は部分文字列検索にフォールバックする', async () => {
    // フォールバック動作のテスト
  })

  it('類似度スコアで結果をソートする', async () => {
    // ソートロジックのテスト
  })
})
```

### ステップ3: テストを実行（失敗するはず）
```bash
npm test
# テストは失敗するはず - まだ実装していない
```

### ステップ4: コードを実装
テストを通すための最小限のコードを書く:

```typescript
// テストに導かれた実装
export async function searchMarkets(query: string) {
  // ここに実装
}
```

### ステップ5: 再度テストを実行
```bash
npm test
# テストは成功するはず
```

### ステップ6: リファクタリング
テストをグリーンに保ちながらコード品質を改善:
- 重複を削除
- 命名を改善
- パフォーマンスを最適化
- 可読性を向上

### ステップ7: カバレッジを検証
```bash
npm run test:coverage
# 80%以上のカバレッジが達成されているか確認
```

## テストパターン

### ユニットテストパターン（Jest/Vitest）
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Buttonコンポーネント', () => {
  it('正しいテキストでレンダリングされる', () => {
    render(<Button>クリック</Button>)
    expect(screen.getByText('クリック')).toBeInTheDocument()
  })

  it('クリック時にonClickが呼ばれる', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>クリック</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabledプロパティがtrueの時無効化される', () => {
    render(<Button disabled>クリック</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### API統合テストパターン
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('マーケットを正常に返す', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('クエリパラメータを検証する', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('データベースエラーを適切に処理する', async () => {
    // データベース障害をモック
    const request = new NextRequest('http://localhost/api/markets')
    // エラーハンドリングをテスト
  })
})
```

### E2Eテストパターン（Playwright）
```typescript
import { test, expect } from '@playwright/test'

test('ユーザーはマーケットを検索してフィルタできる', async ({ page }) => {
  // マーケットページに移動
  await page.goto('/')
  await page.click('a[href="/markets"]')

  // ページが読み込まれたことを検証
  await expect(page.locator('h1')).toContainText('マーケット')

  // マーケットを検索
  await page.fill('input[placeholder="マーケットを検索"]', '選挙')

  // デバウンスと結果を待つ
  await page.waitForTimeout(600)

  // 検索結果が表示されることを検証
  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })

  // 結果に検索語が含まれることを検証
  const firstResult = results.first()
  await expect(firstResult).toContainText('選挙', { ignoreCase: true })

  // ステータスでフィルタ
  await page.click('button:has-text("アクティブ")')

  // フィルタされた結果を検証
  await expect(results).toHaveCount(3)
})
```

## よくあるテストの間違いを避ける

### ❌ 間違い: 実装の詳細をテストする
```typescript
// 内部状態をテストしない
expect(component.state.count).toBe(5)
```

### ✅ 正しい: ユーザーに見える動作をテストする
```typescript
// ユーザーが見るものをテストする
expect(screen.getByText('カウント: 5')).toBeInTheDocument()
```

### ❌ 間違い: 脆弱なセレクタ
```typescript
// 変更に弱い
await page.click('.css-class-xyz')
```

### ✅ 正しい: セマンティックなセレクタ
```typescript
// 変更に強い
await page.click('button:has-text("送信")')
await page.click('[data-testid="submit-button"]')
```

### ❌ 間違い: テストの独立性がない
```typescript
// テストが互いに依存する
test('ユーザーを作成する', () => { /* ... */ })
test('同じユーザーを更新する', () => { /* 前のテストに依存 */ })
```

### ✅ 正しい: 独立したテスト
```typescript
// 各テストで独自のデータをセットアップ
test('ユーザーを作成する', () => {
  const user = createTestUser()
  // テストロジック
})

test('ユーザーを更新する', () => {
  const user = createTestUser()
  // 更新ロジック
})
```

## ベストプラクティス

1. **テストを先に書く** - 常にTDD
2. **1つのアサート/テスト** - 単一の動作に焦点を当てる
3. **説明的なテスト名** - 何をテストしているか説明
4. **Arrange-Act-Assert** - 明確なテスト構造
5. **外部依存関係をモック** - ユニットテストを独立させる
6. **エッジケースをテスト** - Null、undefined、空、大量
7. **エラーパスをテスト** - ハッピーパスだけでなく
8. **テストを高速に保つ** - ユニットテストは各50ms未満
9. **テスト後にクリーンアップ** - 副作用なし
10. **カバレッジレポートをレビュー** - ギャップを特定

## 成功指標

- 80%以上のコードカバレッジを達成
- すべてのテストが合格（グリーン）
- スキップまたは無効化されたテストがない
- 高速なテスト実行（ユニットテストは30秒未満）
- E2Eテストが重要なユーザーフローをカバー
- テストが本番前にバグを捕捉

---

**重要**: テストはオプションではありません。テストは、自信を持ったリファクタリング、迅速な開発、本番環境の信頼性を可能にする安全網です。
