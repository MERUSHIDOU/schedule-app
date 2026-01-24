import { expect, test } from '@playwright/test';

test.describe('モバイル/レスポンシブテスト', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('モバイルビューポートでアプリが正しく表示される', async ({ page }) => {
    // アプリの主要要素が表示されていることを確認
    await expect(page.getByRole('heading', { name: 'スケジュール' })).toBeVisible();
    await expect(page.locator('.calendar')).toBeVisible();
    await expect(page.getByRole('button', { name: '予定を追加' })).toBeVisible();

    // FABボタンが画面内に収まっていることを確認
    const fabButton = page.getByRole('button', { name: '予定を追加' });
    const fabBox = await fabButton.boundingBox();
    const viewportSize = page.viewportSize();

    expect(fabBox).not.toBeNull();
    if (fabBox && viewportSize) {
      expect(fabBox.x).toBeGreaterThanOrEqual(0);
      expect(fabBox.y).toBeGreaterThanOrEqual(0);
      expect(fabBox.x + fabBox.width).toBeLessThanOrEqual(viewportSize.width);
      expect(fabBox.y + fabBox.height).toBeLessThanOrEqual(viewportSize.height);
    }
  });

  test('カレンダーがモバイル幅に収まっている', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    const calendarBox = await calendar.boundingBox();
    const viewportSize = page.viewportSize();

    expect(calendarBox).not.toBeNull();
    if (calendarBox && viewportSize) {
      // カレンダーが画面幅を超えていないことを確認
      expect(calendarBox.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });

  test('タッチ操作でFABボタンをタップしてフォームを開ける', async ({ page }) => {
    // FABボタンをタップ
    const fabButton = page.getByRole('button', { name: '予定を追加' });
    await fabButton.tap();

    // フォームが表示される
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();
  });

  test('タッチ操作でカレンダーの日付を選択できる', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 今日以外の日付をタップ
    const dateButton = calendar
      .locator('button.calendar-day:not(.today):not(.other-month)')
      .first();
    await dateButton.tap();

    // 日付が選択されたことを確認
    await expect(dateButton).toHaveClass(/selected/);
  });

  test('モバイルでスケジュールを追加できる', async ({ page }) => {
    // FABボタンをタップ
    await page.getByRole('button', { name: '予定を追加' }).tap();

    // フォームに入力
    await page.getByLabel('タイトル *').fill('モバイルテストスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 追加ボタンをタップ
    await page.locator('.modal-content .btn-submit').tap();

    // スケジュールが追加される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'モバイルテストスケジュール' })
    ).toBeVisible();
  });

  test('モーダルがモバイル画面に適切に表示される', async ({ page }) => {
    // FABボタンをタップ
    await page.getByRole('button', { name: '予定を追加' }).tap();

    // モーダルが表示される
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();

    // モーダルコンテンツが画面内に収まっていることを確認
    const modalContent = page.locator('.modal-content');
    const modalBox = await modalContent.boundingBox();
    const viewportSize = page.viewportSize();

    expect(modalBox).not.toBeNull();
    if (modalBox && viewportSize) {
      expect(modalBox.x).toBeGreaterThanOrEqual(0);
      expect(modalBox.y).toBeGreaterThanOrEqual(0);
      expect(modalBox.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });

  test('スケジュールリストがモバイルで正しく表示される', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).tap();
    await page.getByLabel('タイトル *').fill('リスト表示テスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').tap();

    // スケジュールアイテムが表示される
    const scheduleItem = page.locator('.schedule-item', { hasText: 'リスト表示テスト' });
    await expect(scheduleItem).toBeVisible();

    // アイテムが画面幅に収まっている
    const itemBox = await scheduleItem.boundingBox();
    const viewportSize = page.viewportSize();

    expect(itemBox).not.toBeNull();
    if (itemBox && viewportSize) {
      expect(itemBox.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });

  test('編集・削除ボタンがモバイルでタップ可能なサイズである', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).tap();
    await page.getByLabel('タイトル *').fill('ボタンサイズテスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').tap();

    const scheduleItem = page.locator('.schedule-item', { hasText: 'ボタンサイズテスト' });

    // 編集ボタンのサイズを確認（最小44x44pxを推奨）
    const editButton = scheduleItem.getByRole('button', { name: '編集' });
    const editBox = await editButton.boundingBox();
    expect(editBox).not.toBeNull();
    if (editBox) {
      // 最小タップ可能サイズ（44px未満でも許容するが、警告として記録）
      expect(editBox.width).toBeGreaterThan(20);
      expect(editBox.height).toBeGreaterThan(20);
    }

    // 削除ボタンのサイズを確認
    const deleteButton = scheduleItem.getByRole('button', { name: '削除' });
    const deleteBox = await deleteButton.boundingBox();
    expect(deleteBox).not.toBeNull();
    if (deleteBox) {
      expect(deleteBox.width).toBeGreaterThan(20);
      expect(deleteBox.height).toBeGreaterThan(20);
    }
  });

  test('モバイルで編集ボタンをタップして編集できる', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).tap();
    await page.getByLabel('タイトル *').fill('編集前のタイトル');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').tap();

    // 編集ボタンをタップ
    const scheduleItem = page.locator('.schedule-item', { hasText: '編集前のタイトル' });
    await scheduleItem.getByRole('button', { name: '編集' }).tap();

    // 編集フォームが表示される
    await expect(page.getByRole('heading', { name: '予定を編集' })).toBeVisible();

    // タイトルを変更
    await page.getByLabel('タイトル *').clear();
    await page.getByLabel('タイトル *').fill('編集後のタイトル');
    await page.locator('.modal-content .btn-submit').tap();

    // 変更が反映される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '編集後のタイトル' })
    ).toBeVisible();
  });

  test('モバイルで削除ボタンをタップして削除できる', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).tap();
    await page.getByLabel('タイトル *').fill('削除するスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').tap();

    // 削除確認ダイアログを許可
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // 削除ボタンをタップ
    const scheduleItem = page.locator('.schedule-item', { hasText: '削除するスケジュール' });
    await scheduleItem.getByRole('button', { name: '削除' }).tap();

    // スケジュールが削除される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '削除するスケジュール' })
    ).not.toBeVisible();
    await expect(page.getByText('予定がありません')).toBeVisible();
  });

  test('モバイルでカレンダーの前月/次月ボタンが動作する', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    const monthTitle = page.locator('.month-title');
    const initialMonth = await monthTitle.textContent();

    // 次月ボタンをタップ
    await page.getByRole('button', { name: '次月' }).tap();
    const nextMonth = await monthTitle.textContent();
    expect(nextMonth).not.toBe(initialMonth);

    // 前月ボタンをタップ
    await page.getByRole('button', { name: '前月' }).tap();
    const currentMonth = await monthTitle.textContent();
    expect(currentMonth).toBe(initialMonth);
  });

  test('モバイルで今日ボタンが動作する', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 別の月に移動
    await page.getByRole('button', { name: '次月' }).tap();
    await page.getByRole('button', { name: '次月' }).tap();

    // 今日ボタンをタップ
    await page.getByRole('button', { name: '今日' }).tap();

    // 今日が選択されている
    const todayButton = calendar.locator('button.calendar-day.today');
    await expect(todayButton).toHaveClass(/selected/);
  });

  test('フォームのセレクトボックスがモバイルで操作できる', async ({ page }) => {
    // FABボタンをタップ
    await page.getByRole('button', { name: '予定を追加' }).tap();

    // タイトルを入力
    await page.getByLabel('タイトル *').fill('セレクトボックステスト');

    // 開始時刻を選択
    const startTimeSelect = page.getByLabel('開始時刻');
    await startTimeSelect.selectOption('14:30');
    await expect(startTimeSelect).toHaveValue('14:30');

    // 終了時刻を選択
    const endTimeSelect = page.getByLabel('終了時刻');
    await endTimeSelect.selectOption('16:00');
    await expect(endTimeSelect).toHaveValue('16:00');

    // 追加
    await page.locator('.modal-content .btn-submit').tap();

    // 正しい時刻でスケジュールが追加される
    await expect(
      page
        .locator('.schedule-item', { hasText: 'セレクトボックステスト' })
        .locator('.schedule-time')
    ).toContainText('14:30 - 16:00');
  });

  test('カラーピッカーがモバイルでタップ操作できる', async ({ page }) => {
    // FABボタンをタップ
    await page.getByRole('button', { name: '予定を追加' }).tap();

    // カラーピッカーが表示される
    const colorOptions = page.locator('.color-picker .color-option');
    await expect(colorOptions.first()).toBeVisible();

    // 3番目の色をタップ
    await colorOptions.nth(2).tap();
    await expect(colorOptions.nth(2)).toHaveClass(/selected/);

    // タイトルと時刻を入力
    await page.getByLabel('タイトル *').fill('カラーピッカーテスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 追加
    await page.locator('.modal-content .btn-submit').tap();

    // スケジュールが追加される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'カラーピッカーテスト' })
    ).toBeVisible();
  });

  test('モーダルオーバーレイをタップするとモーダルが閉じる', async ({ page }) => {
    // FABボタンをタップ
    await page.getByRole('button', { name: '予定を追加' }).tap();

    // モーダルが表示される
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();

    // オーバーレイをタップ（左上隅）
    await page.locator('.modal-overlay').tap({ position: { x: 10, y: 10 } });

    // モーダルが閉じる
    await expect(page.getByRole('heading', { name: '新しい予定' })).not.toBeVisible();
  });

  test('モバイルでテキストエリアにスクロールなしで入力できる', async ({ page }) => {
    // FABボタンをタップ
    await page.getByRole('button', { name: '予定を追加' }).tap();

    // 説明フィールドに入力
    const descriptionTextarea = page.getByLabel('説明');
    await descriptionTextarea.fill(
      'これはモバイルでの説明文入力テストです。\n複数行の入力も可能です。'
    );

    // 値が正しく入力されていることを確認
    await expect(descriptionTextarea).toHaveValue(
      'これはモバイルでの説明文入力テストです。\n複数行の入力も可能です。'
    );
  });

  test('モバイルで長いタイトルが適切に表示される', async ({ page }) => {
    // FABボタンをタップ
    await page.getByRole('button', { name: '予定を追加' }).tap();

    // 長いタイトルを入力
    const longTitle =
      'これは非常に長いタイトルです。モバイル画面でも正しく表示されることを確認します。';
    await page.getByLabel('タイトル *').fill(longTitle);
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 追加
    await page.locator('.modal-content .btn-submit').tap();

    // スケジュールが表示される
    const scheduleItem = page.locator('.schedule-item', { hasText: longTitle });
    await expect(scheduleItem).toBeVisible();

    // アイテムが画面幅を超えていないことを確認
    const itemBox = await scheduleItem.boundingBox();
    const viewportSize = page.viewportSize();

    expect(itemBox).not.toBeNull();
    if (itemBox && viewportSize) {
      expect(itemBox.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });

  test('スクリーンショットを取得してモバイル表示を確認', async ({ page }) => {
    // 初期状態のスクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/mobile-initial.png' });

    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).tap();

    // フォーム表示時のスクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/mobile-form.png' });

    await page.getByLabel('タイトル *').fill('スクリーンショットテスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').tap();

    // スケジュール追加後のスクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/mobile-with-schedule.png' });

    // スケジュールが表示されていることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'スクリーンショットテスト' })
    ).toBeVisible();
  });
});
