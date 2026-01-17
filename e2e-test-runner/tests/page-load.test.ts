import type { Page } from 'playwright';
import { beforeEach, describe, expect, test } from 'vitest';

describe('ページ読み込みテスト', () => {
  let page: Page;

  beforeEach(async (_page: Page) => {
    // このフックはテストランナーによって page が注入されます
    page = _page;
  });

  test('トップページが正しく表示される', async () => {
    // トップページに遷移
    await page.goto('http://localhost:5173/');

    // ページの読み込みを待つ（2秒）
    await page.waitForTimeout(2000);

    // 「スケジュール」というテキストが表示されているか確認
    const scheduleText = page.getByText('スケジュール');
    const isVisible = await scheduleText.isVisible();
    expect(isVisible).toBe(true);
  });
});
