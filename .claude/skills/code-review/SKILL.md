---
name: code-review
description: コミットされていない変更について包括的なセキュリティと品質をレビュー。
context: fork
model: sonnet
---

# Code Review Skill

コミットされていない変更に対して、ベストプラクティスに沿った包括的なコードレビューを実施します。

## レビュープロセス

### 1. 変更ファイルの取得

```bash
git diff --name-only HEAD
git diff HEAD
```

### 2. レビュー観点

以下の観点で各ファイルをレビューする。

---

## セキュリティ（CRITICAL）

**必ずチェックすること：**

### ハードコードされた機密情報
```typescript
// ❌ NG
const apiKey = "sk-proj-xxxxx"
const password = "admin123"

// ✅ OK
const apiKey = process.env.API_KEY
```

### SQLインジェクション
```typescript
// ❌ NG
const query = `SELECT * FROM users WHERE id = '${userId}'`

// ✅ OK
const { data } = await supabase.from('users').select('*').eq('id', userId)
```

### XSS脆弱性
```typescript
// ❌ NG
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ OK
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 入力検証の欠如
```typescript
// ❌ NG
function processData(data: any) {
  return data.value * 2
}

// ✅ OK
import { z } from 'zod'
const schema = z.object({ value: z.number() })
function processData(input: unknown) {
  const data = schema.parse(input)
  return data.value * 2
}
```

---

## コード品質（HIGH）

### 関数の長さ
- **警告**: 30行以上
- **エラー**: 50行以上
- **対策**: 関数を分割し、単一責任の原則に従う

### ファイルの長さ
- **警告**: 300行以上
- **エラー**: 500行以上
- **対策**: コンポーネントやモジュールを分割

### ネスト深度
- **警告**: 3レベル以上
- **エラー**: 4レベル以上
- **対策**: 早期リターン、ガード句を使用

```typescript
// ❌ NG: 深いネスト
function process(data) {
  if (data) {
    if (data.items) {
      if (data.items.length > 0) {
        for (const item of data.items) {
          if (item.active) {
            // 処理
          }
        }
      }
    }
  }
}

// ✅ OK: 早期リターン
function process(data) {
  if (!data?.items?.length) return

  for (const item of data.items) {
    if (!item.active) continue
    // 処理
  }
}
```

### エラーハンドリング
```typescript
// ❌ NG: エラー無視
async function fetchData() {
  try {
    const res = await fetch('/api/data')
    return res.json()
  } catch (e) {
    // 何もしない
  }
}

// ✅ OK: 適切なエラーハンドリング
async function fetchData() {
  try {
    const res = await fetch('/api/data')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  } catch (error) {
    console.error('Failed to fetch data:', error)
    throw error // または適切なフォールバック
  }
}
```

### console.log の残留
- 開発用のconsole.logは削除する
- 必要なログは適切なロガーを使用

### TODO/FIXME コメント
- 未解決のTODO/FIXMEがないか確認
- 残す場合はIssue番号を記載

---

## TypeScript ベストプラクティス（HIGH）

### 型安全性
```typescript
// ❌ NG: any型の使用
function process(data: any) { ... }

// ✅ OK: 適切な型定義
interface ProcessData {
  id: string
  value: number
}
function process(data: ProcessData) { ... }
```

### 型アサーションの乱用
```typescript
// ❌ NG: 不要な型アサーション
const user = data as User

// ✅ OK: 型ガードまたはzodでバリデーション
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'id' in data
}
```

### null/undefined の安全な処理
```typescript
// ❌ NG: null チェック漏れ
const name = user.profile.name

// ✅ OK: オプショナルチェーン
const name = user?.profile?.name ?? 'Unknown'
```

---

## React ベストプラクティス（MEDIUM）

### コンポーネント設計
```typescript
// ❌ NG: 巨大なコンポーネント
function Dashboard() {
  // 500行のコード...
}

// ✅ OK: 責務の分離
function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <DashboardContent />
      <DashboardFooter />
    </DashboardLayout>
  )
}
```

### Hooks の使い方
```typescript
// ❌ NG: useEffectの依存配列漏れ
useEffect(() => {
  fetchData(userId)
}, []) // userIdが依存配列にない

// ✅ OK: 正しい依存配列
useEffect(() => {
  fetchData(userId)
}, [userId])
```

### メモ化の適切な使用
```typescript
// ❌ NG: 不要なメモ化
const value = useMemo(() => 1 + 1, [])

// ✅ OK: 必要な場合のみメモ化
const expensiveValue = useMemo(() =>
  heavyComputation(data),
  [data]
)
```

### Props の型定義
```typescript
// ❌ NG: 型なしProps
function Button(props) { ... }

// ✅ OK: 明確な型定義
interface ButtonProps {
  variant: 'primary' | 'secondary'
  onClick: () => void
  children: React.ReactNode
}
function Button({ variant, onClick, children }: ButtonProps) { ... }
```

---

## パフォーマンス（MEDIUM）

### 不要な再レンダリング
```typescript
// ❌ NG: インラインオブジェクト
<Component style={{ color: 'red' }} />

// ✅ OK: 外部定義
const style = { color: 'red' }
<Component style={style} />
```

### 大量データの処理
```typescript
// ❌ NG: すべてのデータを一度にレンダリング
{items.map(item => <Item key={item.id} {...item} />)}

// ✅ OK: 仮想化
import { FixedSizeList } from 'react-window'
<FixedSizeList itemCount={items.length} itemSize={50}>
  {({ index }) => <Item {...items[index]} />}
</FixedSizeList>
```

### バンドルサイズ
```typescript
// ❌ NG: ライブラリ全体をインポート
import _ from 'lodash'

// ✅ OK: 必要な関数のみインポート
import debounce from 'lodash/debounce'
```

---

## アクセシビリティ（MEDIUM）

### セマンティックHTML
```typescript
// ❌ NG
<div onClick={handleClick}>ボタン</div>

// ✅ OK
<button onClick={handleClick}>ボタン</button>
```

### ARIA属性
```typescript
// ❌ NG: アクセシビリティ情報なし
<div className="modal">...</div>

// ✅ OK: 適切なARIA属性
<div role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">タイトル</h2>
  ...
</div>
```

### フォームラベル
```typescript
// ❌ NG
<input type="text" placeholder="名前" />

// ✅ OK
<label htmlFor="name">名前</label>
<input id="name" type="text" />
```

---

## テスト（MEDIUM）

### 新しいコードにテストがあるか
- 新しい関数/コンポーネントにはテストを追加
- エッジケースをカバー

### テストの品質
```typescript
// ❌ NG: 実装の詳細をテスト
expect(component.state.count).toBe(5)

// ✅ OK: ユーザー視点でテスト
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

---

## 命名規則（LOW）

### 一貫性のある命名
- **コンポーネント**: PascalCase (`UserProfile`)
- **関数/変数**: camelCase (`getUserData`)
- **定数**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **ファイル**: kebab-case (`user-profile.tsx`)

### 意味のある名前
```typescript
// ❌ NG
const d = new Date()
const arr = users.filter(u => u.a)

// ✅ OK
const createdAt = new Date()
const activeUsers = users.filter(user => user.isActive)
```

---

## レビューレポート形式

```markdown
## Code Review Report

### Summary
- Total files reviewed: X
- Critical issues: X
- High issues: X
- Medium issues: X
- Low issues: X

### Critical Issues (Must Fix)
1. **[Security]** `path/to/file.ts:42`
   - Issue: ハードコードされたAPIキー
   - Suggestion: 環境変数を使用

### High Issues (Should Fix)
1. **[Quality]** `path/to/file.tsx:128`
   - Issue: 関数が75行を超えている
   - Suggestion: 責務を分割して複数の関数に

### Medium Issues (Consider Fixing)
...

### Low Issues (Nice to Have)
...

### Positive Observations
- 適切なエラーハンドリングが実装されている
- テストカバレッジが十分
```

---

## レビュー完了条件

以下をすべて確認してからレビュー完了とする：

- [ ] **Critical**: セキュリティ問題がない
- [ ] **High**: コード品質基準を満たしている
- [ ] **High**: TypeScript型が適切に使用されている
- [ ] **Medium**: Reactのベストプラクティスに従っている
- [ ] **Medium**: パフォーマンス問題がない
- [ ] **Medium**: アクセシビリティが考慮されている
- [ ] **Medium**: 新しいコードにテストがある

**CRITICALまたはHIGH問題が残っている場合は、コミットをブロックすること。**
