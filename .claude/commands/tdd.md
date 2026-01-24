---
description: テスト駆動開発ワークフローを強制します。インターフェースをスキャフォールドし、テストを先に生成してから、テストを通すための最小限のコードを実装します。80%以上のカバレッジを保証します。
---

# TDDコマンド

このコマンドは **tdd-guide** エージェントを起動してテスト駆動開発手法を強制します。

## このコマンドの機能

1. **インターフェースのスキャフォールド** - 型/インターフェースを先に定義
2. **テストを先に生成** - 失敗するテストを作成（RED）
3. **最小限のコードを実装** - テストを通すだけのコードを書く（GREEN）
4. **リファクタリング** - テストをグリーンに保ちながらコードを改善（REFACTOR）
5. **カバレッジを検証** - 80%以上のテストカバレッジを確保

## 使用すべき場面

`/tdd`を使用する場面:
- 新機能を実装する時
- 新しい関数/コンポーネントを追加する時
- バグを修正する時（先にバグを再現するテストを書く）
- 既存のコードをリファクタリングする時
- 重要なビジネスロジックを構築する時

## 動作の仕組み

tdd-guideエージェントは以下を実行します:

1. **インターフェースを定義** 入力/出力の型を定義
2. **失敗するテストを作成** （コードがまだ存在しないため）
3. **テストを実行** 正しい理由で失敗することを確認
4. **最小限の実装を記述** テストを通すために
5. **テストを実行** 成功することを確認
6. **リファクタリング** テストをグリーンに保ちながら
7. **カバレッジを確認** 80%未満の場合はテストを追加

## TDDサイクル

```
RED → GREEN → REFACTOR → 繰り返し

RED:      失敗するテストを書く
GREEN:    テストを通す最小限のコードを書く
REFACTOR: テストを通したままコードを改善
繰り返し: 次の機能/シナリオへ
```

## 使用例

```
ユーザー: /tdd スケジュールの重複をチェックする関数が必要

エージェント (tdd-guide):
# TDDセッション: スケジュール重複チェッカー

## ステップ1: インターフェースを定義（SCAFFOLD）

```typescript
// lib/schedule.ts
export interface Schedule {
  id: string
  title: string
  startTime: Date
  endTime: Date
}

export function checkOverlap(schedule1: Schedule, schedule2: Schedule): boolean {
  // TODO: 実装
  throw new Error('未実装')
}
```

## ステップ2: 失敗するテストを作成（RED）

```typescript
// lib/schedule.test.ts
import { checkOverlap } from './schedule'

describe('checkOverlap', () => {
  it('重複するスケジュールに対してtrueを返す', () => {
    const schedule1 = {
      id: '1',
      title: 'ミーティング',
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T11:00:00')
    }

    const schedule2 = {
      id: '2',
      title: 'レビュー',
      startTime: new Date('2024-01-01T10:30:00'),
      endTime: new Date('2024-01-01T11:30:00')
    }

    const result = checkOverlap(schedule1, schedule2)
    expect(result).toBe(true)
  })

  it('重複しないスケジュールに対してfalseを返す', () => {
    const schedule1 = {
      id: '1',
      title: 'ミーティング',
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T11:00:00')
    }

    const schedule2 = {
      id: '2',
      title: 'ランチ',
      startTime: new Date('2024-01-01T12:00:00'),
      endTime: new Date('2024-01-01T13:00:00')
    }

    const result = checkOverlap(schedule1, schedule2)
    expect(result).toBe(false)
  })

  it('エッジケースを処理: 同じ開始時刻', () => {
    const schedule1 = {
      id: '1',
      title: 'イベント1',
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T11:00:00')
    }

    const schedule2 = {
      id: '2',
      title: 'イベント2',
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T10:30:00')
    }

    const result = checkOverlap(schedule1, schedule2)
    expect(result).toBe(true)
  })
})
```

## ステップ3: テストを実行 - 失敗を確認

```bash
npm test lib/schedule.test.ts

FAIL lib/schedule.test.ts
  ✕ 重複するスケジュールに対してtrueを返す (2 ms)
    Error: 未実装

1テスト失敗, 0テスト合格
```

✅ 期待通りテストが失敗しました。実装の準備ができました。

## ステップ4: 最小限のコードを実装（GREEN）

```typescript
// lib/schedule.ts
export function checkOverlap(schedule1: Schedule, schedule2: Schedule): boolean {
  // スケジュール1の終了がスケジュール2の開始より後
  // かつ スケジュール1の開始がスケジュール2の終了より前
  return schedule1.endTime > schedule2.startTime && 
         schedule1.startTime < schedule2.endTime
}
```

## ステップ5: テストを実行 - 成功を確認

```bash
npm test lib/schedule.test.ts

PASS lib/schedule.test.ts
  ✓ 重複するスケジュールに対してtrueを返す (3 ms)
  ✓ 重複しないスケジュールに対してfalseを返す (2 ms)
  ✓ エッジケースを処理: 同じ開始時刻 (1 ms)

3テスト合格
```

✅ すべてのテストが合格しました！

## ステップ6: カバレッジを確認

```bash
npm test -- --coverage lib/schedule.test.ts

ファイル       | % Stmts | % Branch | % Funcs | % Lines
--------------|---------|----------|---------|--------
schedule.ts   |   100   |   100    |   100   |   100

カバレッジ: 100% ✅ (目標: 80%)
```

✅ TDDセッション完了！
```

## TDDベストプラクティス

**すべきこと:**
- ✅ 実装前にテストを先に書く
- ✅ テストを実行して実装前に失敗することを確認
- ✅ テストを通すための最小限のコードを書く
- ✅ テストがグリーンになった後のみリファクタリング
- ✅ エッジケースとエラーシナリオを追加
- ✅ 80%以上のカバレッジを目指す（重要なコードは100%）

**すべきでないこと:**
- ❌ テストの前に実装を書く
- ❌ 変更後にテストを実行しない
- ❌ 一度に大量のコードを書く
- ❌ 失敗するテストを無視する
- ❌ 実装の詳細をテストする（動作をテストする）
- ❌ すべてをモックする（統合テストを優先）

## 含めるべきテストタイプ

**ユニットテスト** (関数レベル):
- ハッピーパスのシナリオ
- エッジケース（空、null、最大値）
- エラー条件
- 境界値

**統合テスト** (コンポーネントレベル):
- APIエンドポイント
- データベース操作
- 外部サービス呼び出し
- フックを含むReactコンポーネント

**E2Eテスト** (`/e2e`コマンドを使用):
- 重要なユーザーフロー
- 複数ステップのプロセス
- フルスタック統合

## カバレッジ要件

- **最小80%** すべてのコード用
- **100%必須** 以下の場合:
  - 金融計算
  - 認証ロジック
  - セキュリティ重要なコード
  - コアビジネスロジック

## 重要な注意事項

**必須**: テストは実装前に書く必要があります。TDDサイクルは:

1. **RED** - 失敗するテストを書く
2. **GREEN** - テストを通すための実装
3. **REFACTOR** - コードを改善

REDフェーズをスキップしないでください。テストの前にコードを書かないでください。

## 他のコマンドとの統合

- まず`/plan`を使用して何を構築するか理解する
- `/tdd`を使用してテスト付きで実装する
- ビルドエラーが発生したら`/build-and-fix`を使用
- `/code-review`を使用して実装をレビュー
- `/test-coverage`を使用してカバレッジを検証

## 関連エージェント

このコマンドは以下の`tdd-guide`エージェントを起動します:
`~/.claude/agents/tdd-guide.md`

また、以下の`tdd-workflow`スキルを参照できます:
`~/.claude/skills/tdd-workflow/`
