import { expect, test } from '@playwright/test';
import { ScheduleHelper } from './helpers/schedule-helper';

test.describe('データ永続化テスト', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await helper.resetApp();
  });

  test('スケジュールを追加後、ページをリロードしてもデータが保持される', async ({ page }) => {
    await helper.addScheduleAndVerify({
      title: '永続化テストスケジュール',
      startTime: '10:00',
      endTime: '11:00',
      description: 'リロード後も保持されるはず',
    });

    // ページをリロード
    await page.reload();

    // リロード後もスケジュールが表示されることを確認
    await expect(helper.getScheduleTitle('永続化テストスケジュール')).toBeVisible();
    await expect(helper.getScheduleTime('永続化テストスケジュール')).toContainText('10:00 - 11:00');
  });

  test('複数のスケジュールを追加し、リロード後もすべて保持される', async ({ page }) => {
    const schedules = [
      { title: '朝のミーティング', startTime: '09:00', endTime: '10:00' },
      { title: 'ランチミーティング', startTime: '12:00', endTime: '13:00' },
      { title: '夕方のレビュー', startTime: '17:00', endTime: '18:00' },
    ];

    for (const schedule of schedules) {
      await helper.addScheduleAndVerify(schedule);
    }

    // ページをリロード
    await page.reload();

    // すべてのスケジュールが保持されていることを確認
    for (const schedule of schedules) {
      await expect(helper.getScheduleTitle(schedule.title)).toBeVisible();
    }

    // スケジュールの数を確認
    await expect(helper.scheduleItems).toHaveCount(3);
  });

  test('スケジュールを編集し、リロード後も編集内容が保持される', async ({ page }) => {
    await helper.addScheduleAndVerify({
      title: '編集前のタイトル',
      startTime: '10:00',
      endTime: '11:00',
    });

    // スケジュールを編集
    await helper.clickEdit('編集前のタイトル');

    await helper.titleInput.clear();
    await helper.titleInput.fill('編集後のタイトル');
    await helper.startTimeSelect.selectOption('14:00');
    await helper.endTimeSelect.selectOption('15:30');
    await helper.submitButton.click();

    // 編集内容が反映されていることを確認
    await expect(helper.getScheduleTitle('編集後のタイトル')).toBeVisible();
    await expect(helper.getScheduleTitle('編集前のタイトル')).not.toBeVisible();

    // ページをリロード
    await page.reload();

    // リロード後も編集内容が保持されていることを確認
    await expect(helper.getScheduleTitle('編集後のタイトル')).toBeVisible();
    await expect(helper.getScheduleTime('編集後のタイトル')).toContainText('14:00 - 15:30');
  });

  test('スケジュールを削除し、リロード後も削除が保持される', async ({ page }) => {
    await helper.addScheduleAndVerify({
      title: '削除するスケジュール',
      startTime: '10:00',
      endTime: '11:00',
    });

    // スケジュールを削除
    await helper.deleteSchedule('削除するスケジュール');
    await expect(helper.noSchedulesText).toBeVisible();

    // ページをリロード
    await page.reload();

    // リロード後も削除が保持されていることを確認
    await expect(helper.getScheduleTitle('削除するスケジュール')).not.toBeVisible();
    await expect(helper.noSchedulesText).toBeVisible();
  });

  test('localStorageが正しく使用されている', async ({ page }) => {
    await helper.addScheduleAndVerify({
      title: 'ストレージテスト',
      startTime: '10:00',
      endTime: '11:00',
    });

    // localStorageの内容を確認
    const storageData = await page.evaluate(() => {
      return localStorage.getItem('schedule-app-data');
    });

    expect(storageData).not.toBeNull();

    const parsedData = JSON.parse(storageData as string);
    expect(Array.isArray(parsedData)).toBe(true);
    expect(parsedData.length).toBe(1);
    expect(parsedData[0].title).toBe('ストレージテスト');
    expect(parsedData[0].startTime).toBe('10:00');
    expect(parsedData[0].endTime).toBe('11:00');
  });

  test('localStorageにスケジュールデータの全フィールドが保存される', async ({ page }) => {
    await helper.addScheduleAndVerify({
      title: 'フィールドテスト',
      startTime: '14:30',
      endTime: '16:00',
      description: 'これは説明文です',
      colorIndex: 1,
    });

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
    await helper.addScheduleAndVerify({
      title: 'クリアテスト',
      startTime: '10:00',
      endTime: '11:00',
    });

    // localStorageをクリアしてリロード
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // スケジュールが消えていることを確認
    await expect(helper.getScheduleTitle('クリアテスト')).not.toBeVisible();
    await expect(helper.noSchedulesText).toBeVisible();
  });

  test('不正なlocalStorageデータでもアプリがクラッシュしない', async ({ page }) => {
    // 不正なデータをlocalStorageに設定
    await page.evaluate(() => {
      localStorage.setItem('schedule-app-data', 'invalid json data');
    });

    await page.reload();

    // アプリが正常に表示されることを確認
    await expect(page.getByRole('heading', { name: 'スケジュール' })).toBeVisible();
    await expect(helper.calendar).toBeVisible();
    await expect(helper.addButton).toBeVisible();
  });

  test('異なる日付のスケジュールも正しく永続化される', async ({ page }) => {
    await expect(helper.calendar).toBeVisible();

    // 今日の日付を選択
    await helper.todayButton.click();

    // 今日にスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '今日のスケジュール',
      startTime: '10:00',
      endTime: '11:00',
    });

    // 別の日付を選択
    const otherDay = helper.currentMonthDays.locator(':not(.today)').first();
    await otherDay.click();

    // その日付にスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '別の日のスケジュール',
      startTime: '14:00',
      endTime: '15:00',
    });

    // ページをリロード
    await page.reload();

    // 今日を選択
    await helper.todayButton.click();
    await expect(helper.getScheduleTitle('今日のスケジュール')).toBeVisible();

    // 別の日付を選択
    await otherDay.click();
    await expect(helper.getScheduleTitle('別の日のスケジュール')).toBeVisible();
  });
});
