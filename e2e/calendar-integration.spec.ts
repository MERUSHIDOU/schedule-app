import { expect, test } from '@playwright/test';

test.describe('カレンダー操作とスケジュール表示の統合テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('カレンダーで異なる日付を選択したときに、その日付のスケジュールが正しくフィルタリングされる', async ({
    page,
  }) => {
    // 最初の日付を選択
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 当月の最初の日付（other-monthでない）を選択
    const firstDay = calendar.locator('button.calendar-day:not(.other-month)').first();
    await firstDay.click();

    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('最初の日付のスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '最初の日付のスケジュール' })
    ).toBeVisible();

    // 別の日付を選択
    const secondDay = calendar.locator('button.calendar-day:not(.other-month)').nth(10);
    await secondDay.click();

    // 最初の日付のスケジュールは表示されない
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '最初の日付のスケジュール' })
    ).not.toBeVisible();

    // 「予定がありません」が表示される
    await expect(page.getByText('予定がありません')).toBeVisible();

    // 最初の日付に戻る
    await firstDay.click();

    // スケジュールが再び表示される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '最初の日付のスケジュール' })
    ).toBeVisible();
  });

  test('複数の日付にスケジュールを追加し、日付を切り替えたときに正しく表示される', async ({
    page,
  }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 当月の日付を取得
    const days = calendar.locator('button.calendar-day:not(.other-month)');

    // 日付インデックスを取得（カレンダー構造により変動するため、より安定した選択方法を使用）
    const day5 = days.nth(5);
    const day15 = days.nth(15);

    // 1つ目の日付を選択してスケジュールを追加
    await day5.click();
    await expect(day5).toHaveClass(/selected/);

    await page.getByRole('button', { name: '予定を追加' }).click();
    // 部分一致の問題を避けるため、識別しやすいタイトルを使用
    await page.getByLabel('タイトル *').fill('前半の日付のスケジュール');
    await page.getByLabel('開始時刻').selectOption('09:00');
    await page.getByLabel('終了時刻').selectOption('10:00');
    await page.locator('.modal-content .btn-submit').click();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '前半の日付のスケジュール' })
    ).toBeVisible();

    // 2つ目の日付を選択してスケジュールを追加
    await day15.click();
    await expect(day15).toHaveClass(/selected/);

    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('後半の日付のスケジュール');
    await page.getByLabel('開始時刻').selectOption('14:00');
    await page.getByLabel('終了時刻').selectOption('15:00');
    await page.locator('.modal-content .btn-submit').click();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '後半の日付のスケジュール' })
    ).toBeVisible();

    // 1つ目の日付に戻ると、そのスケジュールが表示される
    await day5.click();
    await expect(day5).toHaveClass(/selected/);
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '前半の日付のスケジュール' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '後半の日付のスケジュール' })
    ).not.toBeVisible();

    // 2つ目の日付に戻ると、そのスケジュールが表示される
    await day15.click();
    await expect(day15).toHaveClass(/selected/);
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '後半の日付のスケジュール' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '前半の日付のスケジュール' })
    ).not.toBeVisible();
  });

  test('カレンダーの月を変更（前月/次月）したときの動作', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 現在の月タイトルを取得
    const monthTitle = page.locator('.month-title');
    const initialMonth = await monthTitle.textContent();

    // 次月ボタンをクリック
    await page.getByRole('button', { name: '次月' }).click();

    // 月が変わったことを確認
    const nextMonth = await monthTitle.textContent();
    expect(nextMonth).not.toBe(initialMonth);

    // 前月ボタンをクリック
    await page.getByRole('button', { name: '前月' }).click();

    // 元の月に戻ったことを確認
    const currentMonth = await monthTitle.textContent();
    expect(currentMonth).toBe(initialMonth);

    // 前月ボタンをもう一度クリック
    await page.getByRole('button', { name: '前月' }).click();

    // 別の月になったことを確認
    const prevMonth = await monthTitle.textContent();
    expect(prevMonth).not.toBe(initialMonth);
  });

  test('カレンダーのドット表示（スケジュールがある日付に視覚的インジケーターが表示される）', async ({
    page,
  }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 当月の特定の日付を選択
    const targetDay = calendar.locator('button.calendar-day:not(.other-month)').nth(7);
    await targetDay.click();

    // スケジュールを追加前はドットがないことを確認
    await expect(targetDay.locator('.schedule-dot')).not.toBeVisible();

    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('ドット表示テスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが追加されたことを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'ドット表示テスト' })
    ).toBeVisible();

    // ドットが表示されることを確認
    await expect(targetDay.locator('.schedule-dot')).toBeVisible();
  });

  test('今日の日付が正しくハイライトされる', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 今日の日付にtodayクラスがあることを確認
    const todayButton = calendar.locator('button.calendar-day.today');
    await expect(todayButton).toBeVisible();
    await expect(todayButton).toHaveClass(/today/);

    // 「今日」ボタンをクリック
    await page.getByRole('button', { name: '今日' }).click();

    // 今日が選択状態になることを確認
    await expect(todayButton).toHaveClass(/selected/);
  });

  test('他の月の日付は異なるスタイルで表示される', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // other-monthクラスを持つ日付が存在することを確認
    const otherMonthDays = calendar.locator('button.calendar-day.other-month');
    const count = await otherMonthDays.count();

    // カレンダーには前後の月の日付が含まれる場合がある
    if (count > 0) {
      // other-monthクラスを持つことを確認
      await expect(otherMonthDays.first()).toHaveClass(/other-month/);
    }

    // 現在の月の日付はother-monthクラスを持たない
    const currentMonthDays = calendar.locator('button.calendar-day:not(.other-month)');
    const currentCount = await currentMonthDays.count();
    expect(currentCount).toBeGreaterThan(0);
  });

  test('複数のスケジュールがある日付には複数のドットが表示される', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 当月の特定の日付を選択
    const targetDay = calendar.locator('button.calendar-day:not(.other-month)').nth(12);
    await targetDay.click();
    await expect(targetDay).toHaveClass(/selected/);

    // 3つのスケジュールを追加
    for (let i = 1; i <= 3; i++) {
      await page.getByRole('button', { name: '予定を追加' }).click();
      await page.getByLabel('タイトル *').fill(`スケジュール${i}`);
      // 時刻を正しいフォーマット(HH:MM)で設定
      const startHour = (8 + i).toString().padStart(2, '0');
      const endHour = (9 + i).toString().padStart(2, '0');
      await page.getByLabel('開始時刻').selectOption(`${startHour}:00`);
      await page.getByLabel('終了時刻').selectOption(`${endHour}:00`);
      await page.locator('.modal-content .btn-submit').click();
      await expect(
        page.locator('.schedule-item .schedule-title', { hasText: `スケジュール${i}` })
      ).toBeVisible();
    }

    // 複数のドットが表示されることを確認
    const dots = targetDay.locator('.schedule-dot');
    await expect(dots).toHaveCount(3);
  });

  test('4つ以上のスケジュールがある場合、+Nインジケーターが表示される', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 当月の特定の日付を選択
    const targetDay = calendar.locator('button.calendar-day:not(.other-month)').nth(20);
    await targetDay.click();
    await expect(targetDay).toHaveClass(/selected/);

    // 5つのスケジュールを追加
    for (let i = 1; i <= 5; i++) {
      await page.getByRole('button', { name: '予定を追加' }).click();
      await page.getByLabel('タイトル *').fill(`スケジュール${i}`);
      // 時刻を正しいフォーマット(HH:MM)で設定
      const startHour = (7 + i).toString().padStart(2, '0');
      const endHour = (8 + i).toString().padStart(2, '0');
      await page.getByLabel('開始時刻').selectOption(`${startHour}:00`);
      await page.getByLabel('終了時刻').selectOption(`${endHour}:00`);
      await page.locator('.modal-content .btn-submit').click();
      await expect(
        page.locator('.schedule-item .schedule-title', { hasText: `スケジュール${i}` })
      ).toBeVisible();
    }

    // 3つのドットと+2インジケーターが表示されることを確認
    const dots = targetDay.locator('.schedule-dot');
    await expect(dots).toHaveCount(3);

    const moreIndicator = targetDay.locator('.more-indicator');
    await expect(moreIndicator).toBeVisible();
    await expect(moreIndicator).toContainText('+2');
  });

  test('月を変更しても選択日付のスケジュールは維持される', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 今日を選択してスケジュールを追加
    await page.getByRole('button', { name: '今日' }).click();
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('月変更テストスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();

    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '月変更テストスケジュール' })
    ).toBeVisible();

    // 次月に移動
    await page.getByRole('button', { name: '次月' }).click();

    // スケジュールリストにはまだ今日のスケジュールが表示される（選択日付が変わっていないため）
    // または「予定がありません」が表示される（実装による）

    // 今日ボタンをクリックして今日に戻る
    await page.getByRole('button', { name: '今日' }).click();

    // スケジュールが表示される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '月変更テストスケジュール' })
    ).toBeVisible();
  });
});
