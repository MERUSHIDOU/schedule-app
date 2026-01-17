import type { Page } from 'playwright';
import { beforeEach, describe, expect, test } from 'vitest';

describe('スケジュール追加テスト', () => {
  let page: Page;

  beforeEach(async (_page: Page) => {
    // このフックはテストランナーによって page が注入されます
    page = _page;
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

    // 入力反映待機（500ms）
    await page.waitForTimeout(500);

    // タイトル欄に「会議」が入力されているか確認
    const value = await titleInput.inputValue();
    expect(value).toBe('会議');
  });
});
