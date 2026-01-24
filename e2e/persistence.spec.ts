import { expect, test } from '@playwright/test';

test.describe('データ永続化テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('スケジュールを追加後、ページをリロードしてもデータが保持される', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('永続化テストスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.getByLabel('説明').fill('リロード後も保持されるはず');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '永続化テストスケジュール' })
    ).toBeVisible();

    // ページをリロード
    await page.reload();

    // リロード後もスケジュールが表示されることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '永続化テストスケジュール' })
    ).toBeVisible();

    // 時刻も正しく保持されていることを確認
    await expect(
      page
        .locator('.schedule-item', { hasText: '永続化テストスケジュール' })
        .locator('.schedule-time')
    ).toContainText('10:00 - 11:00');
  });

  test('複数のスケジュールを追加し、リロード後もすべて保持される', async ({ page }) => {
    // 1つ目のスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('朝のミーティング');
    await page.getByLabel('開始時刻').selectOption('09:00');
    await page.getByLabel('終了時刻').selectOption('10:00');
    await page.locator('.modal-content .btn-submit').click();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '朝のミーティング' })
    ).toBeVisible();

    // 2つ目のスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('ランチミーティング');
    await page.getByLabel('開始時刻').selectOption('12:00');
    await page.getByLabel('終了時刻').selectOption('13:00');
    await page.locator('.modal-content .btn-submit').click();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'ランチミーティング' })
    ).toBeVisible();

    // 3つ目のスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('夕方のレビュー');
    await page.getByLabel('開始時刻').selectOption('17:00');
    await page.getByLabel('終了時刻').selectOption('18:00');
    await page.locator('.modal-content .btn-submit').click();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '夕方のレビュー' })
    ).toBeVisible();

    // ページをリロード
    await page.reload();

    // すべてのスケジュールが保持されていることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '朝のミーティング' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'ランチミーティング' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '夕方のレビュー' })
    ).toBeVisible();

    // スケジュールの数を確認
    const scheduleItems = page.locator('.schedule-item');
    await expect(scheduleItems).toHaveCount(3);
  });

  test('スケジュールを編集し、リロード後も編集内容が保持される', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('編集前のタイトル');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '編集前のタイトル' })
    ).toBeVisible();

    // スケジュールを編集
    const scheduleItem = page.locator('.schedule-item', { hasText: '編集前のタイトル' });
    await scheduleItem.getByRole('button', { name: '編集' }).click();

    // タイトルを変更
    const titleInput = page.getByLabel('タイトル *');
    await titleInput.clear();
    await titleInput.fill('編集後のタイトル');

    // 時刻も変更
    await page.getByLabel('開始時刻').selectOption('14:00');
    await page.getByLabel('終了時刻').selectOption('15:30');

    // 保存
    await page.locator('.modal-content .btn-submit').click();

    // 編集内容が反映されていることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '編集後のタイトル' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '編集前のタイトル' })
    ).not.toBeVisible();

    // ページをリロード
    await page.reload();

    // リロード後も編集内容が保持されていることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '編集後のタイトル' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item', { hasText: '編集後のタイトル' }).locator('.schedule-time')
    ).toContainText('14:00 - 15:30');
  });

  test('スケジュールを削除し、リロード後も削除が保持される', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('削除するスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '削除するスケジュール' })
    ).toBeVisible();

    // 削除確認ダイアログを許可
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // スケジュールを削除
    const scheduleItem = page.locator('.schedule-item', { hasText: '削除するスケジュール' });
    await scheduleItem.getByRole('button', { name: '削除' }).click();

    // 削除されていることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '削除するスケジュール' })
    ).not.toBeVisible();
    await expect(page.getByText('予定がありません')).toBeVisible();

    // ページをリロード
    await page.reload();

    // リロード後も削除が保持されていることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '削除するスケジュール' })
    ).not.toBeVisible();
    await expect(page.getByText('予定がありません')).toBeVisible();
  });

  test('localStorageが正しく使用されている', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('ストレージテスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'ストレージテスト' })
    ).toBeVisible();

    // localStorageの内容を確認
    const storageData = await page.evaluate(() => {
      return localStorage.getItem('schedule-app-data');
    });

    // データが存在することを確認
    expect(storageData).not.toBeNull();

    // JSON形式であることを確認
    const parsedData = JSON.parse(storageData as string);
    expect(Array.isArray(parsedData)).toBe(true);
    expect(parsedData.length).toBe(1);
    expect(parsedData[0].title).toBe('ストレージテスト');
    expect(parsedData[0].startTime).toBe('10:00');
    expect(parsedData[0].endTime).toBe('11:00');
  });

  test('localStorageにスケジュールデータの全フィールドが保存される', async ({ page }) => {
    // スケジュールを追加（全フィールドを入力）
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('フィールドテスト');
    await page.getByLabel('開始時刻').selectOption('14:30');
    await page.getByLabel('終了時刻').selectOption('16:00');
    await page.getByLabel('説明').fill('これは説明文です');

    // 色を選択（2番目の色）
    const colorOptions = page.locator('.color-picker .color-option');
    await colorOptions.nth(1).click();

    await page.locator('.modal-content .btn-submit').click();

    // localStorageの内容を確認
    const storageData = await page.evaluate(() => {
      return localStorage.getItem('schedule-app-data');
    });

    const parsedData = JSON.parse(storageData as string);
    const schedule = parsedData[0];

    // 全フィールドが存在することを確認
    expect(schedule).toHaveProperty('id');
    expect(schedule).toHaveProperty('title', 'フィールドテスト');
    expect(schedule).toHaveProperty('description', 'これは説明文です');
    expect(schedule).toHaveProperty('date');
    expect(schedule).toHaveProperty('startTime', '14:30');
    expect(schedule).toHaveProperty('endTime', '16:00');
    expect(schedule).toHaveProperty('color');
    expect(schedule).toHaveProperty('createdAt');
    expect(schedule).toHaveProperty('updatedAt');
  });

  test('localStorageをクリアするとスケジュールも消える', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('クリアテスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'クリアテスト' })
    ).toBeVisible();

    // localStorageをクリアしてリロード
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // スケジュールが消えていることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'クリアテスト' })
    ).not.toBeVisible();
    await expect(page.getByText('予定がありません')).toBeVisible();
  });

  test('不正なlocalStorageデータでもアプリがクラッシュしない', async ({ page }) => {
    // 不正なデータをlocalStorageに設定（キーは 'schedule-app-data'）
    await page.evaluate(() => {
      localStorage.setItem('schedule-app-data', 'invalid json data');
    });

    // ページをリロード
    await page.reload();

    // アプリが正常に表示されることを確認
    await expect(page.getByRole('heading', { name: 'スケジュール' })).toBeVisible();
    await expect(page.locator('.calendar')).toBeVisible();
    await expect(page.getByRole('button', { name: '予定を追加' })).toBeVisible();
  });

  test('異なる日付のスケジュールも正しく永続化される', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 今日の日付を選択
    await page.getByRole('button', { name: '今日' }).click();

    // 今日にスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('今日のスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();

    // 別の日付を選択
    const otherDay = calendar.locator('button.calendar-day:not(.other-month):not(.today)').first();
    await otherDay.click();

    // その日付にスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('別の日のスケジュール');
    await page.getByLabel('開始時刻').selectOption('14:00');
    await page.getByLabel('終了時刻').selectOption('15:00');
    await page.locator('.modal-content .btn-submit').click();

    // ページをリロード
    await page.reload();

    // 今日を選択
    await page.getByRole('button', { name: '今日' }).click();

    // 今日のスケジュールが表示される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '今日のスケジュール' })
    ).toBeVisible();

    // 別の日付を選択
    await otherDay.click();

    // その日のスケジュールが表示される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '別の日のスケジュール' })
    ).toBeVisible();
  });
});
