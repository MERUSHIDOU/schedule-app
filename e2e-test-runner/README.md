# E2E Test Runner

vitest + Playwrightを使用したE2Eテストランナー。3つのブラウザセッションを並列実行し、リアルタイムで画面を表示します。

## 特徴

- ⚡ **vitest**: 高速なテストランナーで型安全なテスト記述
- 🎭 **Playwright**: 強力なブラウザ自動化フレームワークを使用
- 🔄 **並列実行**: 最大3つのテストケースを同時実行
- 📺 **リアルタイム表示**: WebSocketで3画面を同時に監視
- 📊 **結果レポート**: JSON形式でテスト結果を保存
- 💬 **コメント付きテスト**: 各操作に日本語コメントで説明を追加

## インストール

```bash
cd e2e-test-runner
npm install
```

## テストの書き方

`tests/` ディレクトリに `*.test.ts` ファイルを作成します。

```typescript
import { describe, test, beforeEach, expect } from 'vitest';
import type { Page } from 'playwright';

describe('ログインフロー', () => {
  let page: Page;

  beforeEach(async () => {
    // テストランナーが自動的に page を注入します
  });

  test('正常系：ログインが成功する', async () => {
    // ログインページに遷移
    await page.goto('https://example.com/login');

    // メールアドレスを入力
    const emailInput = page.getByLabel('メールアドレス');
    await emailInput.fill('user@example.com');

    // パスワードを入力
    const passwordInput = page.getByLabel('パスワード');
    await passwordInput.fill('password123');

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await loginButton.click();

    // ダッシュボードが表示されることを確認
    const dashboard = page.getByRole('heading', { name: 'ダッシュボード' });
    const isVisible = await dashboard.isVisible();
    expect(isVisible).toBe(true);
  });
});
```

### ポイント

- vitestから`describe`, `test`, `beforeEach`, `expect`をインポート
- `page`変数はテストランナーが自動注入するため、初期化不要
- アサーションはvitest標準の`expect().toBe()`形式を使用

## 実行方法

### 開発モード（TypeScript直接実行）

```bash
npm test
```

### プロダクションモード

```bash
npm run build
npm start
```

### オプション

```bash
npm test -- --tests <path>       # テストディレクトリまたはファイルのパス（デフォルト: tests）
npm test -- --port <number>      # WebSocket集約サーバーのポート（デフォルト: 8080）
npm test -- --results <dir>      # 結果出力ディレクトリ（デフォルト: results）
```

### 複数のテストファイルを指定

```bash
npm test -- --tests tests/login.test.ts,tests/signup.test.ts
```

## ダッシュボード

テスト実行中、3つのブラウザ画面をリアルタイムで表示できます。

1. テストを実行
2. ブラウザで `viewer/index.html` を開く
3. 3つのセッション（test1, test2, test3）の画面が表示される

WebSocket URL: `ws://localhost:8080`

## ディレクトリ構造

```
e2e-test-runner/
├── src/
│   ├── index.ts              # エントリーポイント
│   ├── orchestrator.ts       # 並列実行の制御
│   ├── session-runner.ts     # 個別セッションの実行
│   ├── test-loader.ts        # テストファイルの読み込み
│   ├── websocket-aggregator.ts # WebSocket集約サーバー
│   └── types.ts              # 型定義
├── tests/                    # テストファイル（*.test.ts）
│   ├── page-load.test.ts
│   ├── schedule-add.test.ts
│   └── calendar-navigation.test.ts
├── viewer/                   # リアルタイム表示用ダッシュボード
│   └── index.html
└── results/                  # テスト結果（自動生成）
    └── results_*.json
```

## Playwright API

### ページ遷移

```typescript
// URLに遷移
await page.goto('http://localhost:5173');

// 待機
await page.waitForTimeout(1000); // 1秒待機
```

### 要素の取得

```typescript
// ロールで取得（推奨）
const button = page.getByRole('button', { name: 'ログイン' });
const heading = page.getByRole('heading', { name: 'ダッシュボード' });

// ラベルで取得（フォーム入力）
const input = page.getByLabel('メールアドレス');

// テキストで取得
const text = page.getByText('スケジュール');

// プレースホルダーで取得
const search = page.getByPlaceholder('検索');
```

### 操作

```typescript
// クリック
await button.click();

// 入力（クリア + 入力）
await input.fill('test@example.com');

// テキスト入力（追加入力）
await input.type('追加テキスト');

// 選択
await page.selectOption('select#prefecture', '東京');

// チェックボックス
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');
```

### アサーション

vitestのexpectを使用します。Playwrightの`isVisible()`等のメソッドを呼び出してから、結果を検証します。

```typescript
// 表示確認
const isVisible = await element.isVisible();
expect(isVisible).toBe(true);

// 入力値確認
const value = await input.inputValue();
expect(value).toBe('test@example.com');

// テキスト確認
const text = await element.textContent();
expect(text).toBe('ダッシュボード');

// URL確認
const url = page.url();
expect(url).toContain('dashboard');
```

### コメント付きテストの例

```typescript
import { describe, test, beforeEach, expect } from 'vitest';
import type { Page } from 'playwright';

describe('スケジュール追加テスト', () => {
  let page: Page;

  beforeEach(async () => {
    // このフックはテストランナーによって page が注入されます
  });

  test('予定を追加できる', async () => {
    // トップページに遷移
    await page.goto('http://localhost:5173/');

    // 初期ロード待機（1秒）
    await page.waitForTimeout(1000);

    // 「予定を追加」ボタンを探してクリック
    const addButton = page.getByRole('button', { name: '予定を追加' });
    await addButton.click();

    // モーダル表示待機（500ms）
    await page.waitForTimeout(500);

    // タイトル入力欄を探して「会議」と入力
    const titleInput = page.getByLabel('タイトル');
    await titleInput.fill('会議');

    // タイトル欄に「会議」が入力されているか確認
    const value = await titleInput.inputValue();
    expect(value).toBe('会議');
  });
});
```

## トラブルシューティング

### WebSocket接続失敗

テスト自体は継続しますが、リアルタイム表示ができません。agent-browserの設定を確認してください。

### テストが見つからない

- `tests/` ディレクトリに `*.test.ts` ファイルがあることを確認
- `--tests` オプションで正しいパスを指定

### 並列実行の制限

現在、最大3つのテストケースを並列実行できます。それ以上のテストがある場合は、先頭3つのみが実行されます。
