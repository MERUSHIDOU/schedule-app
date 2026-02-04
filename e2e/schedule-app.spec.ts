import { expect, test } from '@playwright/test';
import { ScheduleHelper } from './helpers/schedule-helper';

test.describe('スケジュールアプリ', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await helper.resetApp();
  });

  test('アプリが正しく表示される', async ({ page }) => {
    // ヘッダーが表示されている
    await expect(page.getByRole('heading', { name: 'スケジュール' })).toBeVisible();

    // カレンダーが表示されている
    await expect(helper.calendar).toBeVisible();

    // FABボタン（予定追加ボタン）が表示されている
    await expect(helper.addButton).toBeVisible();
  });

  test('スケジュールを追加できる', async () => {
    // FABボタンをクリック
    await helper.addButton.click();

    // フォームが表示される（モーダルのヘッダーで確認）
    await expect(helper.newScheduleHeading).toBeVisible();

    // フォームに入力
    await helper.titleInput.fill('テストスケジュール');
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('11:30');
    await helper.descriptionInput.fill('これはテストのメモです');

    // エラーメッセージがないことを確認
    await expect(helper.errorMessage).not.toBeVisible();

    // 追加ボタンが有効であることを確認してからクリック
    await expect(helper.submitButton).toBeEnabled();
    await expect(helper.submitButton).toHaveText('追加');
    await helper.submitButton.click();

    // フォームが閉じる
    await expect(helper.newScheduleHeading).not.toBeVisible();

    // 追加したスケジュールが表示される
    await expect(helper.getScheduleTitle('テストスケジュール')).toBeVisible();

    // 時刻も表示されることを確認
    await expect(helper.getScheduleTime('テストスケジュール')).toContainText('10:00 - 11:30');
  });

  test('スケジュールを編集できる', async () => {
    // まずスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '編集前のタイトル',
      startTime: '09:00',
      endTime: '10:00',
    });

    // 編集ボタンをクリック
    await helper.clickEdit('編集前のタイトル');

    // タイトルを編集
    await helper.titleInput.clear();
    await helper.titleInput.fill('編集後のタイトル');

    // 更新ボタンをクリック
    await helper.submitButton.click();

    // 編集後のタイトルが表示される
    await expect(helper.getScheduleTitle('編集後のタイトル')).toBeVisible();
    await expect(helper.getScheduleTitle('編集前のタイトル')).not.toBeVisible();
  });

  test('スケジュールを削除できる', async () => {
    // まずスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '削除するスケジュール',
      startTime: '14:00',
      endTime: '15:00',
    });

    // スケジュールを削除
    await helper.deleteSchedule('削除するスケジュール');

    // スケジュールが削除されている
    await expect(helper.getScheduleTitle('削除するスケジュール')).not.toBeVisible();
  });

  test('カレンダーで日付を選択できる', async () => {
    await expect(helper.calendar).toBeVisible();

    // 今日の日付以外の日付をクリック
    const dateButton = helper.calendar
      .locator('button.calendar-day:not(.today):not(.other-month)')
      .first();
    await dateButton.click();

    // 日付が選択された状態になる
    await expect(dateButton).toHaveClass(/selected/);
  });

  test('複数のスケジュールを追加して表示できる', async () => {
    // 1つ目のスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '朝の会議',
      startTime: '09:00',
      endTime: '10:00',
    });

    // 2つ目のスケジュールを追加
    await helper.addScheduleAndVerify({
      title: 'ランチ',
      startTime: '12:00',
      endTime: '13:00',
    });

    // スケジュールが時刻順にソートされていることを確認
    const scheduleTitles = await helper.getAllScheduleTitles();
    expect(scheduleTitles).toEqual(['朝の会議', 'ランチ']);
  });

  test('フォームをキャンセルできる', async () => {
    // FABボタンをクリック
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    // フォームに入力
    await helper.titleInput.fill('キャンセルするスケジュール');

    // キャンセルボタンをクリック
    await helper.cancelButton.click();

    // フォームが閉じる
    await expect(helper.newScheduleHeading).not.toBeVisible();

    // スケジュールは追加されていない
    await expect(helper.noSchedulesText).toBeVisible();
    await expect(helper.getScheduleTitle('キャンセルするスケジュール')).not.toBeVisible();
  });

  test('新規作成時に開始時刻を選択すると終了時刻が自動的に+1時間後に設定される', async () => {
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    // 開始時刻を14:00に設定
    await helper.startTimeSelect.selectOption('14:00');

    // 終了時刻が自動的に15:00に設定されることを確認
    await expect(helper.endTimeSelect).toHaveValue('15:00');

    // タイトルを入力して保存
    await helper.titleInput.fill('自動設定テスト');
    await helper.submitButton.click();

    // スケジュールが正しく保存される
    await expect(helper.getScheduleTime('自動設定テスト')).toContainText('14:00 - 15:00');
  });

  test('自動設定された終了時刻は手動で変更可能', async () => {
    await helper.addButton.click();

    // 開始時刻を10:00に設定（終了時刻は自動的に11:00になる）
    await helper.startTimeSelect.selectOption('10:00');
    await expect(helper.endTimeSelect).toHaveValue('11:00');

    // 終了時刻を手動で12:30に変更
    await helper.endTimeSelect.selectOption('12:30');
    await expect(helper.endTimeSelect).toHaveValue('12:30');

    // タイトルを入力して保存
    await helper.titleInput.fill('手動変更テスト');
    await helper.submitButton.click();

    // 手動変更した時刻で保存される
    await expect(helper.getScheduleTime('手動変更テスト')).toContainText('10:00 - 12:30');
  });

  test('24時をまたぐケースでも終了時刻が正しく設定される', async () => {
    await helper.addButton.click();

    // 開始時刻を23:30に設定
    await helper.startTimeSelect.selectOption('23:30');

    // 終了時刻が自動的に00:30に設定されることを確認
    await expect(helper.endTimeSelect).toHaveValue('00:30');

    // タイトルを入力して保存
    await helper.titleInput.fill('深夜のスケジュール');
    await helper.submitButton.click();

    // スケジュールが正しく保存される
    await expect(helper.getScheduleTime('深夜のスケジュール')).toContainText('23:30 - 00:30');
  });

  test('編集モードでは開始時刻を変更しても終了時刻は自動変更されない', async () => {
    // まずスケジュールを追加
    await helper.addButton.click();
    await helper.titleInput.fill('編集モードテスト');
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('12:00');
    await helper.submitButton.click();

    await expect(helper.getScheduleTitle('編集モードテスト')).toBeVisible();

    // 編集ボタンをクリック
    await helper.clickEdit('編集モードテスト');

    // 現在の終了時刻が12:00であることを確認
    await expect(helper.endTimeSelect).toHaveValue('12:00');

    // 開始時刻を09:00に変更
    await helper.startTimeSelect.selectOption('09:00');

    // 終了時刻は12:00のまま（自動変更されない）
    await expect(helper.endTimeSelect).toHaveValue('12:00');

    // エラーメッセージは表示されない
    await expect(helper.errorMessage).not.toBeVisible();

    // 更新ボタンをクリック
    await helper.submitButton.click();

    // 変更が保存される
    await expect(helper.getScheduleTime('編集モードテスト')).toContainText('09:00 - 12:00');
  });
});

test.describe('スケジュールアプリ - 異常系', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await helper.resetApp();
  });

  test('開始時刻が終了時刻より後の場合、翌日のスケジュールとして扱われる', async () => {
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    await helper.titleInput.fill('翌日のスケジュール');
    await helper.startTimeSelect.selectOption('14:00');
    await helper.endTimeSelect.selectOption('13:00');

    // エラーメッセージは表示されない（翌日と解釈される）
    await expect(helper.errorMessage).not.toBeVisible();
    await expect(helper.submitButton).toBeEnabled();

    // スケジュールを保存
    await helper.submitButton.click();

    // スケジュールが保存される
    await expect(helper.getScheduleTime('翌日のスケジュール')).toContainText('14:00 - 13:00');
  });

  test('開始時刻と終了時刻が同じ場合、エラーメッセージが表示される', async () => {
    await helper.addButton.click();

    await helper.titleInput.fill('同じ時刻のテスト');
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('10:00');

    // エラーメッセージが表示される
    await expect(helper.errorMessage).toBeVisible();
    await expect(helper.errorMessage).toContainText('開始時刻は終了時刻よりも前に設定してください');

    // 送信ボタンがdisabledになる
    await expect(helper.submitButton).toBeDisabled();
  });

  test('タイトルが空白文字のみの場合、送信できない', async () => {
    await helper.addButton.click();

    await helper.titleInput.fill('   ');
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('11:00');

    // 送信ボタンをクリック
    await helper.submitButton.click();

    // フォームが閉じない（送信が実行されない）
    await expect(helper.newScheduleHeading).toBeVisible();

    // スケジュールは追加されていない
    await helper.cancelButton.click();
    await expect(helper.noSchedulesText).toBeVisible();
  });

  test('削除確認ダイアログでキャンセルすると、スケジュールが削除されない', async ({ page }) => {
    // まずスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '削除キャンセルのテスト',
      startTime: '10:00',
      endTime: '11:00',
    });

    // 削除確認ダイアログでキャンセルを選択
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('削除');
      await dialog.dismiss();
    });

    // 削除ボタンをクリック
    await helper
      .getScheduleItem('削除キャンセルのテスト')
      .getByRole('button', { name: '削除' })
      .click();

    // スケジュールが削除されず、まだ表示されている
    await expect(helper.getScheduleTitle('削除キャンセルのテスト')).toBeVisible();
  });

  test('編集中にキャンセルすると、変更が保存されない', async () => {
    // まずスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '元のタイトル',
      startTime: '10:00',
      endTime: '11:00',
    });

    // 編集ボタンをクリック
    await helper.clickEdit('元のタイトル');

    // タイトルを変更
    await helper.titleInput.clear();
    await helper.titleInput.fill('変更後のタイトル');

    // キャンセルボタンをクリック
    await helper.cancelButton.click();

    // フォームが閉じる
    await expect(helper.editScheduleHeading).not.toBeVisible();

    // 元のタイトルがそのまま表示されている
    await expect(helper.getScheduleTitle('元のタイトル')).toBeVisible();
    await expect(helper.getScheduleTitle('変更後のタイトル')).not.toBeVisible();
  });

  test('モーダル外をクリックすると、フォームが閉じる', async ({ page }) => {
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    await helper.titleInput.fill('モーダル外クリックのテスト');

    // モーダルの外側（オーバーレイ）をクリック
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });

    // フォームが閉じる
    await expect(helper.newScheduleHeading).not.toBeVisible();

    // スケジュールは追加されていない
    await expect(helper.noSchedulesText).toBeVisible();
  });

  test('非常に長いタイトルでもスケジュールを追加できる', async ({ page }) => {
    const longTitle = 'あ'.repeat(1000);

    await helper.addButton.click();
    await helper.titleInput.fill(longTitle);
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('11:00');
    await helper.submitButton.click();

    // フォームが閉じる
    await expect(helper.newScheduleHeading).not.toBeVisible();

    // スケジュールが追加される
    await expect(page.locator('.schedule-item .schedule-title').first()).toContainText('あああ');
  });

  test('非常に長い説明文でもスケジュールを追加できる', async () => {
    const longDescription = 'これはテストです。'.repeat(500);

    await helper.addButton.click();
    await helper.titleInput.fill('長い説明のテスト');
    await helper.descriptionInput.fill(longDescription);
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('11:00');
    await helper.submitButton.click();

    // フォームが閉じる
    await expect(helper.newScheduleHeading).not.toBeVisible();

    // スケジュールが追加される
    await expect(helper.getScheduleTitle('長い説明のテスト')).toBeVisible();
  });
});
