import { expect, test } from '@playwright/test';
import { ScheduleHelper } from './helpers/schedule-helper';

test.describe('スケジュールの色変更機能テスト', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await helper.resetApp();
  });

  test('スケジュール作成時に色を選択できる', async () => {
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    // カラーピッカーが表示されることを確認
    const colorPicker = helper.colorOptions;
    await expect(colorPicker.first()).toBeVisible();

    // 色オプションが8つあることを確認
    await expect(colorPicker).toHaveCount(8);

    // 2番目の色（緑）を選択
    await colorPicker.nth(1).click();
    await expect(colorPicker.nth(1)).toHaveClass(/selected/);

    // タイトルと時刻を入力して追加
    await helper.titleInput.fill('緑色のスケジュール');
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('11:00');
    await helper.submitButton.click();

    await expect(helper.getScheduleTitle('緑色のスケジュール')).toBeVisible();

    // カラーバーが緑色であることを確認
    const bgColor = await helper.getColorBarColor('緑色のスケジュール');
    expect(bgColor).toBe('rgb(16, 185, 129)');
  });

  test('スケジュール編集時に色を変更できる', async () => {
    // デフォルトの色でスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '色変更テスト',
      startTime: '10:00',
      endTime: '11:00',
    });

    // 最初の色（デフォルトは青: #3b82f6）を確認
    const initialColor = await helper.getColorBarColor('色変更テスト');
    expect(initialColor).toBe('rgb(59, 130, 246)');

    // 編集ボタンをクリック
    await helper.clickEdit('色変更テスト');

    // 4番目の色（赤: #ef4444）を選択
    await helper.colorOptions.nth(3).click();
    await helper.submitButton.click();

    // 色が変更されていることを確認
    const newColor = await helper.getColorBarColor('色変更テスト');
    expect(newColor).toBe('rgb(239, 68, 68)');
  });

  test('異なる色のスケジュールを複数作成できる', async () => {
    const colors = [
      { index: 0, name: '青', rgb: 'rgb(59, 130, 246)' },
      { index: 2, name: 'オレンジ', rgb: 'rgb(245, 158, 11)' },
      { index: 5, name: 'ピンク', rgb: 'rgb(236, 72, 153)' },
    ];

    // 各色でスケジュールを追加
    for (let i = 0; i < colors.length; i++) {
      const startHour = (9 + i * 2).toString().padStart(2, '0');
      const endHour = (10 + i * 2).toString().padStart(2, '0');
      await helper.addScheduleAndVerify({
        title: `${colors[i].name}のスケジュール`,
        startTime: `${startHour}:00`,
        endTime: `${endHour}:00`,
        colorIndex: colors[i].index,
      });
    }

    // 各スケジュールの色を確認
    for (const color of colors) {
      const bgColor = await helper.getColorBarColor(`${color.name}のスケジュール`);
      expect(bgColor).toBe(color.rgb);
    }
  });

  test('カラーピッカーで現在選択されている色が視覚的に表示される', async () => {
    await helper.addButton.click();

    // デフォルトで最初の色が選択されている
    await expect(helper.colorOptions.first()).toHaveClass(/selected/);

    // 他の色は選択されていない
    for (let i = 1; i < 8; i++) {
      await expect(helper.colorOptions.nth(i)).not.toHaveClass(/selected/);
    }

    // 3番目の色をクリック
    await helper.colorOptions.nth(2).click();

    // 3番目の色が選択状態になる
    await expect(helper.colorOptions.nth(2)).toHaveClass(/selected/);
    // 最初の色は選択解除される
    await expect(helper.colorOptions.first()).not.toHaveClass(/selected/);
  });

  test('編集フォームを開いたときに現在の色が選択状態で表示される', async () => {
    // 特定の色でスケジュールを作成
    await helper.addScheduleAndVerify({
      title: '色確認テスト',
      startTime: '10:00',
      endTime: '11:00',
      colorIndex: 6,
    });

    // 編集ボタンをクリック
    await helper.clickEdit('色確認テスト');

    // 編集フォームで6番目の色が選択状態であることを確認
    await expect(helper.colorOptions.nth(6)).toHaveClass(/selected/);

    // 他の色は選択されていない
    for (let i = 0; i < 8; i++) {
      if (i !== 6) {
        await expect(helper.colorOptions.nth(i)).not.toHaveClass(/selected/);
      }
    }
  });

  test('カレンダーのドットにも選択した色が反映される', async () => {
    await expect(helper.calendar).toBeVisible();

    // 今日を選択
    await helper.todayButton.click();

    // オレンジ色のスケジュールを追加
    await helper.addScheduleAndVerify({
      title: 'オレンジスケジュール',
      startTime: '10:00',
      endTime: '11:00',
      colorIndex: 2,
    });

    // カレンダーのドットの色を確認
    const dot = helper.todayDayButton.locator('.schedule-dot');
    await expect(dot).toBeVisible();

    const dotColor = await dot.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(dotColor).toBe('rgb(245, 158, 11)');
  });

  test('色を変更してもスケジュールの他のデータは維持される', async () => {
    await helper.addScheduleAndVerify({
      title: 'データ維持テスト',
      startTime: '14:30',
      endTime: '16:00',
      description: '説明文がここに入ります',
    });

    // 編集して色だけ変更
    await helper.clickEdit('データ維持テスト');
    await helper.colorOptions.nth(7).click();
    await helper.submitButton.click();

    // 他のデータが維持されていることを確認
    await expect(helper.getScheduleTitle('データ維持テスト')).toBeVisible();
    await expect(helper.getScheduleTime('データ維持テスト')).toContainText('14:30 - 16:00');
    await expect(
      helper.getScheduleItem('データ維持テスト').locator('.schedule-description')
    ).toContainText('説明文がここに入ります');
  });
});
