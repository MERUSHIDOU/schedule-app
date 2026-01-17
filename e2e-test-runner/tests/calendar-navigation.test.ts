import type { Page } from 'playwright';
import { beforeEach, describe, expect, test } from 'vitest';

describe('カレンダーナビゲーションテスト', () => {
  let page: Page;

  beforeEach(async (_page: Page) => {
    // このフックはテストランナーによって page が注入されます
    page = _page;
  });

  test('カレンダーが表示される', async () => {
    // トップページに遷移
    await page.goto('http://localhost:5173/');

    // 初期ロード待機（1秒）
    await page.waitForTimeout(1000);

    // カレンダー要素が表示されているか確認（ロールまたはテキストで判定）
    const calendar = page.getByRole('heading', { name: /カレンダー/ });
    const isVisible = await calendar.isVisible();
    expect(isVisible).toBe(true);

    // 追加の待機（500ms）
    await page.waitForTimeout(500);
  });
});
