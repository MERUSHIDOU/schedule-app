import { expect, test } from '@playwright/test';
import { ScheduleHelper } from './helpers/schedule-helper';

/**
 * モバイル/レスポンシブテスト
 *
 * 注: 基本的なCRUD操作テストは schedule-app.spec.ts でカバーされているため、
 * このファイルではモバイル固有の以下のテストに焦点を当てる:
 * - ビューポートへのフィット
 * - タッチ（タップ）操作
 * - タップ可能なサイズの確認
 */
test.describe('モバイル/レスポンシブテスト', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await helper.resetApp();
  });

  test('モバイルビューポートでアプリが正しく表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'スケジュール' })).toBeVisible();
    await expect(helper.calendar).toBeVisible();
    await expect(helper.addButton).toBeVisible();

    // FABボタンが画面内に収まっていることを確認
    const fabBox = await helper.addButton.boundingBox();
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
    await expect(helper.calendar).toBeVisible();

    const calendarBox = await helper.calendar.boundingBox();
    const viewportSize = page.viewportSize();

    expect(calendarBox).not.toBeNull();
    if (calendarBox && viewportSize) {
      expect(calendarBox.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });

  test('タッチ操作でFABボタンをタップしてフォームを開ける', async () => {
    await helper.addButton.tap();
    await expect(helper.newScheduleHeading).toBeVisible();
  });

  test('タッチ操作でカレンダーの日付を選択できる', async () => {
    await expect(helper.calendar).toBeVisible();

    const dateButton = helper.calendar
      .locator('button.calendar-day:not(.today):not(.other-month)')
      .first();
    await dateButton.tap();
    await expect(dateButton).toHaveClass(/selected/);
  });

  test('モバイルでスケジュールをタップ操作で追加できる', async () => {
    await helper.addScheduleByTap({
      title: 'モバイルテストスケジュール',
      startTime: '10:00',
      endTime: '11:00',
    });

    await expect(helper.getScheduleTitle('モバイルテストスケジュール')).toBeVisible();
  });

  test('モーダルがモバイル画面に適切に表示される', async ({ page }) => {
    await helper.addButton.tap();
    await expect(helper.newScheduleHeading).toBeVisible();

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

  test('スケジュールリストがモバイルで画面幅を超えない', async ({ page }) => {
    await helper.addScheduleByTap({
      title: 'リスト表示テスト',
      startTime: '10:00',
      endTime: '11:00',
    });

    const scheduleItem = helper.getScheduleItem('リスト表示テスト');
    await expect(scheduleItem).toBeVisible();

    const itemBox = await scheduleItem.boundingBox();
    const viewportSize = page.viewportSize();

    expect(itemBox).not.toBeNull();
    if (itemBox && viewportSize) {
      expect(itemBox.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });

  test('編集・削除ボタンがモバイルでタップ可能なサイズである', async () => {
    await helper.addScheduleByTap({
      title: 'ボタンサイズテスト',
      startTime: '10:00',
      endTime: '11:00',
    });

    const scheduleItem = helper.getScheduleItem('ボタンサイズテスト');

    // 編集ボタンのサイズを確認（最小タップ可能サイズ: 20px以上）
    const editButton = scheduleItem.getByRole('button', { name: '編集' });
    const editBox = await editButton.boundingBox();
    expect(editBox).not.toBeNull();
    if (editBox) {
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

  test('モバイルで編集ボタンをタップして編集できる', async () => {
    await helper.addScheduleByTap({
      title: '編集前のタイトル',
      startTime: '10:00',
      endTime: '11:00',
    });

    // 編集ボタンをタップ
    await helper.getScheduleItem('編集前のタイトル').getByRole('button', { name: '編集' }).tap();
    await expect(helper.editScheduleHeading).toBeVisible();

    // タイトルを変更
    await helper.titleInput.clear();
    await helper.titleInput.fill('編集後のタイトル');
    await helper.submitButton.tap();

    await expect(helper.getScheduleTitle('編集後のタイトル')).toBeVisible();
  });

  test('モバイルで削除ボタンをタップして削除できる', async ({ page }) => {
    await helper.addScheduleByTap({
      title: '削除するスケジュール',
      startTime: '10:00',
      endTime: '11:00',
    });

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await helper
      .getScheduleItem('削除するスケジュール')
      .getByRole('button', { name: '削除' })
      .tap();

    await expect(helper.getScheduleTitle('削除するスケジュール')).not.toBeVisible();
    await expect(helper.noSchedulesText).toBeVisible();
  });

  test('モーダルオーバーレイをタップするとモーダルが閉じる', async ({ page }) => {
    await helper.addButton.tap();
    await expect(helper.newScheduleHeading).toBeVisible();

    // オーバーレイをタップ（左上隅）
    await page.locator('.modal-overlay').tap({ position: { x: 10, y: 10 } });
    await expect(helper.newScheduleHeading).not.toBeVisible();
  });

  test('モバイルで長いタイトルが画面幅を超えない', async ({ page }) => {
    const longTitle =
      'これは非常に長いタイトルです。モバイル画面でも正しく表示されることを確認します。';

    await helper.addScheduleByTap({
      title: longTitle,
      startTime: '10:00',
      endTime: '11:00',
    });

    const scheduleItem = helper.getScheduleItem(longTitle);
    await expect(scheduleItem).toBeVisible();

    const itemBox = await scheduleItem.boundingBox();
    const viewportSize = page.viewportSize();

    expect(itemBox).not.toBeNull();
    if (itemBox && viewportSize) {
      expect(itemBox.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });
});
