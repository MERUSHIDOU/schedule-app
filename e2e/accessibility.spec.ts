import { expect, test } from '@playwright/test';
import { ScheduleHelper } from './helpers/schedule-helper';

test.describe('アクセシビリティテスト', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await helper.resetApp();
  });

  test('Tabキーでフォーカスが適切に移動する', async ({ page }) => {
    // FABボタンにフォーカスを当てる
    await helper.addButton.focus();
    await expect(helper.addButton).toBeFocused();

    // フォームを開く
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    // タイトルフィールドにフォーカス
    await helper.titleInput.focus();
    await expect(helper.titleInput).toBeFocused();

    // Tabキーで次のフィールドに移動
    await page.keyboard.press('Tab');
    await expect(helper.dateInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(helper.startTimeSelect).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(helper.endTimeSelect).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(helper.descriptionInput).toBeFocused();
  });

  test('Enterキーでフォームを送信できる', async ({ page }) => {
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    await helper.titleInput.fill('Enterキーテスト');
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('11:00');

    // 追加ボタンにフォーカスを当ててEnterで送信
    await helper.submitButton.focus();
    await page.keyboard.press('Enter');

    // フォームが閉じて、スケジュールが追加される
    await expect(helper.newScheduleHeading).not.toBeVisible();
    await expect(helper.getScheduleTitle('Enterキーテスト')).toBeVisible();
  });

  test('Escapeキーまたはキャンセルボタンでモーダルを閉じることができる', async () => {
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    await helper.titleInput.fill('Escapeキーテスト');

    // キャンセルボタンでの動作を確認
    await helper.cancelButton.click();
    await expect(helper.newScheduleHeading).not.toBeVisible();
  });

  test('aria-label属性が適切に設定されている', async () => {
    // FABボタンのaria-label
    await expect(helper.addButton).toHaveAttribute('aria-label', '予定を追加');

    // カレンダーナビゲーションボタンのaria-label
    await expect(helper.prevMonthButton).toHaveAttribute('aria-label', '前月');
    await expect(helper.nextMonthButton).toHaveAttribute('aria-label', '次月');

    // スケジュールを追加してアクションボタンを確認
    await helper.addScheduleAndVerify({
      title: 'アクセシビリティテスト',
      startTime: '10:00',
      endTime: '11:00',
    });

    const scheduleItem = helper.getScheduleItem('アクセシビリティテスト');
    await expect(scheduleItem.getByRole('button', { name: '編集' })).toHaveAttribute(
      'aria-label',
      '編集'
    );
    await expect(scheduleItem.getByRole('button', { name: '削除' })).toHaveAttribute(
      'aria-label',
      '削除'
    );
  });

  test('フォームのラベルが入力フィールドと正しく関連付けられている', async ({ page }) => {
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    // ラベルをクリックすると対応する入力フィールドにフォーカスが移る
    await page.locator('label[for="title"]').click();
    await expect(page.locator('#title')).toBeFocused();

    await page.locator('label[for="startTime"]').click();
    await expect(page.locator('#startTime')).toBeFocused();

    await page.locator('label[for="endTime"]').click();
    await expect(page.locator('#endTime')).toBeFocused();

    await page.locator('label[for="description"]').click();
    await expect(page.locator('#description')).toBeFocused();
  });

  test('エラーメッセージにrole="alert"が設定されている', async () => {
    await helper.addButton.click();

    await helper.titleInput.fill('エラーテスト');
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('10:00');

    // エラーメッセージが表示される
    await expect(helper.errorMessage).toBeVisible();
    await expect(helper.errorMessage).toHaveAttribute('role', 'alert');
  });

  test('フォーカスがモーダルを開いたときに適切に管理される', async () => {
    await helper.addButton.focus();
    await helper.addButton.click();

    // モーダルが開く
    await expect(helper.newScheduleHeading).toBeVisible();

    // モーダル内の要素にフォーカスを移動して操作可能か確認
    await helper.titleInput.focus();
    await expect(helper.titleInput).toBeFocused();

    // モーダルを閉じる
    await helper.cancelButton.click();
    await expect(helper.newScheduleHeading).not.toBeVisible();
  });

  test('カレンダーの日付ボタンがキーボードで操作できる', async () => {
    await expect(helper.calendar).toBeVisible();

    // 今日ボタンにフォーカスを当てる
    await helper.todayButton.focus();
    await expect(helper.todayButton).toBeFocused();

    // Enterキーで今日を選択
    await helper.todayButton.press('Enter');

    // 今日が選択状態になる
    await expect(helper.todayDayButton).toHaveClass(/selected/);
  });

  test('モーダルの閉じるボタンが適切に動作する', async ({ page }) => {
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    // 閉じるボタン（Xボタン）をクリック
    const closeButton = page.locator('.close-btn');
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toHaveAttribute('aria-label', '閉じる');

    await closeButton.click();
    await expect(helper.newScheduleHeading).not.toBeVisible();
  });

  test('必須フィールドにrequired属性が設定されている', async () => {
    await helper.addButton.click();

    await expect(helper.titleInput).toHaveAttribute('required', '');
    await expect(helper.dateInput).toHaveAttribute('required', '');
    await expect(helper.startTimeSelect).toHaveAttribute('required', '');
    await expect(helper.endTimeSelect).toHaveAttribute('required', '');
  });

  test('見出し階層が適切に設定されている', async ({ page }) => {
    // ページのメインh1見出し
    await expect(page.getByRole('heading', { level: 1, name: 'スケジュール' })).toBeVisible();

    // カレンダーのh2見出し（月タイトル）
    await expect(page.locator('h2.month-title')).toBeVisible();

    // モーダルを開いてh2見出しを確認
    await helper.addButton.click();
    await expect(page.getByRole('heading', { level: 2, name: '新しい予定' })).toBeVisible();
  });

  test('色選択ボタンにaria-labelが設定されている', async () => {
    await helper.addButton.click();

    const count = await helper.colorOptions.count();

    for (let i = 0; i < count; i++) {
      const ariaLabel = await helper.colorOptions.nth(i).getAttribute('aria-label');
      expect(ariaLabel).not.toBeNull();
      expect(ariaLabel).toContain('色:');
    }
  });

  test('スケジュールアイテムの各情報が視覚的に識別可能', async () => {
    await helper.addScheduleAndVerify({
      title: '情報識別テスト',
      startTime: '10:00',
      endTime: '11:00',
      description: 'テスト説明文',
    });

    const scheduleItem = helper.getScheduleItem('情報識別テスト');

    // 時刻表示が存在する
    await expect(scheduleItem.locator('.schedule-time')).toBeVisible();
    await expect(scheduleItem.locator('.schedule-time')).toContainText('10:00 - 11:00');

    // タイトルが存在する
    await expect(scheduleItem.locator('.schedule-title')).toBeVisible();
    await expect(scheduleItem.locator('.schedule-title')).toContainText('情報識別テスト');

    // 説明が存在する
    await expect(scheduleItem.locator('.schedule-description')).toBeVisible();
    await expect(scheduleItem.locator('.schedule-description')).toContainText('テスト説明文');

    // カラーバーが存在する
    await expect(scheduleItem.locator('.schedule-color-bar')).toBeVisible();
  });

  test('キーボードのみでスケジュールを追加できる', async ({ page }) => {
    // FABボタンを見つけてフォーカス
    await helper.addButton.focus();
    await expect(helper.addButton).toBeFocused();

    // Enterでフォームを開く
    await page.keyboard.press('Enter');
    await expect(helper.newScheduleHeading).toBeVisible();

    // タイトルを入力
    await helper.titleInput.focus();
    await helper.titleInput.fill('キーボード操作テスト');

    // 時刻を設定
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('11:00');

    // 追加ボタンにフォーカスを移動してEnterで送信
    await helper.submitButton.focus();
    await page.keyboard.press('Enter');

    // スケジュールが追加される
    await expect(helper.getScheduleTitle('キーボード操作テスト')).toBeVisible();
  });
});
