import { expect, test } from '@playwright/test';
import { ScheduleHelper } from './helpers/schedule-helper';

test.describe('カレンダーフリック操作の設定', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await page.goto('/');
    await expect(helper.calendar).toBeVisible();
  });

  test('aria-labelが設定されている', async ({ page }) => {
    const calendar = page.locator('.calendar-grid');
    const ariaLabel = await calendar.getAttribute('aria-label');

    expect(ariaLabel).toContain('カレンダー');
    expect(ariaLabel).toContain('スワイプ');
  });

  test('role="grid"が設定されている', async ({ page }) => {
    const calendar = page.locator('.calendar-grid');
    const role = await calendar.getAttribute('role');

    expect(role).toBe('grid');
  });

  test('touch-actionスタイルが設定されている', async ({ page }) => {
    const calendar = page.locator('.calendar-grid');
    const touchAction = await calendar.evaluate(el => window.getComputedStyle(el).touchAction);

    expect(touchAction).toBe('pan-y');
  });

  test('既存のボタン操作が正常に動作する', async () => {
    const initialMonth = await helper.monthTitle.textContent();
    expect(initialMonth).toBeTruthy();

    // 次月ボタンで移動
    await helper.nextMonthButton.click();
    await expect(helper.monthTitle).not.toHaveText(initialMonth!);
    const month1 = await helper.monthTitle.textContent();

    // 前月ボタンで戻る
    await helper.prevMonthButton.click();
    await expect(helper.monthTitle).toHaveText(initialMonth!);

    // 「今日」ボタンで今月に戻る
    // まず別の月へ移動
    await helper.nextMonthButton.click();
    await expect(helper.monthTitle).not.toHaveText(initialMonth!);
    await helper.todayButton.click();
    const todayMonth = await helper.monthTitle.textContent();
    expect(todayMonth).toBeTruthy();
  });
});

test.describe('カレンダー機能の互換性', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await page.goto('/');
    await expect(helper.calendar).toBeVisible();
  });

  test('複数月の移動が可能', async () => {
    const initialMonth = await helper.monthTitle.textContent();

    // 次月へ3回移動
    for (let i = 0; i < 3; i++) {
      await helper.nextMonthButton.click();
    }

    // 3ヶ月後は元の月と異なることを確認
    await expect(helper.monthTitle).not.toHaveText(initialMonth!);

    // 前月へ3回移動して元に戻る
    for (let i = 0; i < 3; i++) {
      await helper.prevMonthButton.click();
    }

    await expect(helper.monthTitle).toHaveText(initialMonth!);
  });

  test('日付選択が正常に動作する', async ({ page }) => {
    // 当月の日付をクリック（other-monthを避ける）
    const firstDay = helper.currentMonthDays.first();
    await firstDay.click();

    // 選択されたスタイルが適用される
    await expect(firstDay).toHaveClass(/selected/);
  });
});
