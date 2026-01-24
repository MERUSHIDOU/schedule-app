---
description: Playwrightを使用してエンドツーエンドテストを生成・実行します。テストジャーニーを作成し、テストを実行し、スクリーンショット/動画/トレースを取得し、アーティファクトをアップロードします。
---

# E2Eコマンド

このコマンドは **e2e-runner** エージェントを起動して、Playwrightを使用したエンドツーエンドテストを生成、メンテナンス、実行します。

## このコマンドの機能

1. **テストジャーニーを生成** - ユーザーフロー用のPlaywrightテストを作成
2. **E2Eテストを実行** - 複数のブラウザでテストを実行
3. **アーティファクトを取得** - 失敗時にスクリーンショット、動画、トレースを取得
4. **結果をアップロード** - HTMLレポートとJUnit XMLを生成
5. **不安定なテストを特定** - 不安定なテストを隔離して推奨事項を提供

## 使用すべき場面

`/e2e`を使用する場面:
- 重要なユーザージャーニーをテストする時（ログイン、取引、支払い）
- 複数ステップのフローが正しく動作することを検証する時
- UI操作とナビゲーションをテストする時
- フロントエンドとバックエンドの統合を検証する時
- 本番環境へのデプロイ準備をする時

## 動作の仕組み

e2e-runnerエージェントは以下を実行します:

1. **ユーザーフローを分析** してテストシナリオを特定
2. **Playwrightテストを生成** Page Object Modelパターンを使用
3. **複数ブラウザでテストを実行** (Chrome, Firefox, Safari)
4. **失敗を取得** スクリーンショット、動画、トレース付き
5. **レポートを生成** 結果とアーティファクト付き
6. **不安定なテストを特定** して修正を推奨

## 使用例

```
ユーザー: /e2e スケジュール登録から表示・編集・削除までのフローをテストしたい

エージェント (e2e-runner):
# E2Eテスト生成: スケジュール管理フロー

## 特定されたテストシナリオ

**ユーザージャーニー:** スケジュール作成 → 表示 → 編集 → 削除

**テストカバレッジ:**
1. スケジュール作成ページに移動
2. フォームに入力
3. スケジュールを作成
4. 作成されたスケジュールを表示
5. スケジュールを編集
6. スケジュールを削除

## 生成されたテストコード

```typescript
// e2e/schedule-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('スケジュール管理フロー', () => {
  test('ユーザーはスケジュールを作成・編集・削除できる', async ({ page }) => {
    // 1. ホームページに移動
    await page.goto('/')
    
    // 2. 新規スケジュールボタンをクリック
    await page.click('[data-testid="create-schedule-btn"]')
    
    // 3. フォームに入力
    await page.fill('[data-testid="schedule-title"]', 'テストミーティング')
    await page.selectOption('[data-testid="start-hour"]', '10')
    await page.selectOption('[data-testid="start-minute"]', '00')
    await page.selectOption('[data-testid="end-hour"]', '11')
    await page.selectOption('[data-testid="end-minute"]', '00')
    
    // 4. スケジュールを作成
    await page.click('[data-testid="submit-schedule"]')
    
    // 5. 成功メッセージを確認
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // 6. スケジュールが一覧に表示されることを確認
    const scheduleCard = page.locator('[data-testid="schedule-card"]').filter({ hasText: 'テストミーティング' })
    await expect(scheduleCard).toBeVisible()
    
    // スクリーンショットを取得
    await page.screenshot({ path: 'e2e/screenshots/schedule-created.png' })
    
    // 7. スケジュールを編集
    await scheduleCard.click()
    await page.click('[data-testid="edit-schedule-btn"]')
    await page.fill('[data-testid="schedule-title"]', 'テストミーティング（更新）')
    await page.click('[data-testid="submit-schedule"]')
    
    // 8. 更新が反映されることを確認
    await expect(page.locator('text=テストミーティング（更新）')).toBeVisible()
    
    // 9. スケジュールを削除
    await page.click('[data-testid="delete-schedule-btn"]')
    await page.click('[data-testid="confirm-delete"]')
    
    // 10. 削除されたことを確認
    await expect(page.locator('text=テストミーティング（更新）')).not.toBeVisible()
  })

  test('空のタイトルでスケジュールを作成できない', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="create-schedule-btn"]')
    
    // タイトルを空にして送信
    await page.click('[data-testid="submit-schedule"]')
    
    // エラーメッセージを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('タイトルは必須です')
  })

  test('時間重複のスケジュールを作成できない', async ({ page }) => {
    await page.goto('/')
    
    // 最初のスケジュールを作成
    await page.click('[data-testid="create-schedule-btn"]')
    await page.fill('[data-testid="schedule-title"]', '既存スケジュール')
    await page.selectOption('[data-testid="start-hour"]', '10')
    await page.selectOption('[data-testid="end-hour"]', '11')
    await page.click('[data-testid="submit-schedule"]')
    
    // 重複するスケジュールを作成しようとする
    await page.click('[data-testid="create-schedule-btn"]')
    await page.fill('[data-testid="schedule-title"]', '重複スケジュール')
    await page.selectOption('[data-testid="start-hour"]', '10')
    await page.selectOption('[data-testid="end-hour"]', '11')
    await page.click('[data-testid="submit-schedule"]')
    
    // エラーメッセージを確認
    await expect(page.locator('[data-testid="error-message"]')).toContainText('重複')
  })
})
```

## テストを実行中

```bash
npx playwright test e2e/schedule-management.spec.ts

3ワーカーで3テストを実行中

  ✓  [chromium] › schedule-management.spec.ts:5:3 › ユーザーはスケジュールを作成・編集・削除できる (6.4s)
  ✓  [chromium] › schedule-management.spec.ts:42:3 › 空のタイトルでスケジュールを作成できない (2.1s)
  ✓  [chromium] › schedule-management.spec.ts:54:3 › 時間重複のスケジュールを作成できない (3.8s)

  3テスト合格 (12.5s)

生成されたアーティファクト:
- e2e/screenshots/schedule-created.png
- playwright-report/index.html
```

## テストレポート

```
╔══════════════════════════════════════════════════════════════╗
║                    E2Eテスト結果                             ║
╠══════════════════════════════════════════════════════════════╣
║ ステータス:     ✅ すべてのテスト合格                        ║
║ 合計:          3テスト                                       ║
║ 合格:          3 (100%)                                      ║
║ 失敗:          0                                             ║
║ 不安定:        0                                             ║
║ 実行時間:      12.5s                                         ║
╚══════════════════════════════════════════════════════════════╝

アーティファクト:
📸 スクリーンショット: 1ファイル
📹 動画: 0ファイル（失敗時のみ）
🔍 トレース: 0ファイル（失敗時のみ）
📊 HTMLレポート: playwright-report/index.html

レポートを表示: npx playwright show-report
```

✅ E2Eテストスイート準備完了、CI/CD統合可能！
```

## テストアーティファクト

テスト実行時に以下のアーティファクトが取得されます:

**すべてのテスト:**
- タイムラインと結果付きHTMLレポート
- CI統合用JUnit XML

**失敗時のみ:**
- 失敗状態のスクリーンショット
- テストの動画録画
- デバッグ用トレースファイル（ステップバイステップ再生）
- ネットワークログ
- コンソールログ

## アーティファクトの表示

```bash
# ブラウザでHTMLレポートを表示
npx playwright show-report

# 特定のトレースファイルを表示
npx playwright show-trace artifacts/trace-abc123.zip

# スクリーンショットはartifacts/ディレクトリに保存
open e2e/screenshots/schedule-created.png
```

## 不安定なテスト検出

テストが断続的に失敗する場合:

```
⚠️  不安定なテスト検出: e2e/schedule-management.spec.ts

テストは10回中7回合格（70%合格率）

よくある失敗:
"要素'[data-testid="confirm-btn"]'を待機中にタイムアウト"

推奨される修正:
1. 明示的な待機を追加: await page.waitForSelector('[data-testid="confirm-btn"]')
2. タイムアウトを増やす: { timeout: 10000 }
3. コンポーネント内の競合状態を確認
4. 要素がアニメーションで隠されていないか確認

隔離の推奨: 修正されるまでtest.fixme()としてマーク
```

## ブラウザ設定

デフォルトで複数のブラウザでテストが実行されます:
- ✅ Chromium (Desktop Chrome)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (オプション)

ブラウザを調整するには`playwright.config.ts`で設定してください。

## CI/CD統合

CIパイプラインに追加:

```yaml
# .github/workflows/e2e.yml
- name: Playwrightをインストール
  run: npx playwright install --with-deps

- name: E2Eテストを実行
  run: npx playwright test

- name: アーティファクトをアップロード
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## ベストプラクティス

**すべきこと:**
- ✅ メンテナンス性のためPage Object Modelを使用
- ✅ セレクタにdata-testid属性を使用
- ✅ 任意のタイムアウトではなくAPI応答を待つ
- ✅ 重要なユーザージャーニーをエンドツーエンドでテスト
- ✅ mainにマージする前にテストを実行
- ✅ テスト失敗時にアーティファクトをレビュー

**すべきでないこと:**
- ❌ 脆弱なセレクタを使用（CSSクラスは変更される可能性）
- ❌ 実装の詳細をテストしない
- ❌ 本番環境に対してテストを実行しない
- ❌ 不安定なテストを無視しない
- ❌ 失敗時のアーティファクトレビューをスキップしない
- ❌ すべてのエッジケースをE2Eでテストしない（ユニットテストを使用）

## 重要な注意事項

**重要:**
- 実際のお金が関わるE2Eテストは、テストネット/ステージングのみで実行する必要があります
- 決して本番環境に対して取引テストを実行しない
- 金融テストには`test.skip(process.env.NODE_ENV === 'production')`を設定
- テストウォレットは少額のテスト資金のみ使用

## 他のコマンドとの統合

- `/plan`を使用してテストする重要なジャーニーを特定
- `/tdd`をユニットテスト用に使用（より高速で細分化）
- `/e2e`を統合とユーザージャーニーテスト用に使用
- `/code-review`を使用してテスト品質を検証

## 関連エージェント

このコマンドは以下の`e2e-runner`エージェントを起動します:
`~/.claude/agents/e2e-runner.md`

## クイックコマンド

```bash
# すべてのE2Eテストを実行
npx playwright test

# 特定のテストファイルを実行
npx playwright test e2e/schedule-management.spec.ts

# ブラウザを表示して実行
npx playwright test --headed

# テストをデバッグ
npx playwright test --debug

# テストコードを生成
npx playwright codegen http://localhost:3000

# レポートを表示
npx playwright show-report
```
