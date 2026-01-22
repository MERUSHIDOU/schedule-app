import { expect, test } from '@playwright/test';

test.describe('スケジュールアプリ', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('アプリが正しく表示される', async ({ page }) => {
    // ヘッダーが表示されている
    await expect(page.getByRole('heading', { name: 'スケジュール' })).toBeVisible();

    // カレンダーが表示されている
    await expect(page.locator('.calendar')).toBeVisible();

    // FABボタン（予定追加ボタン）が表示されている
    await expect(page.getByRole('button', { name: '予定を追加' })).toBeVisible();
  });

  test('スケジュールを追加できる', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // フォームが表示される（モーダルのヘッダーで確認）
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();

    // フォームに入力
    await page.getByLabel('タイトル *').fill('テストスケジュール');

    // 開始時間と終了時間を選択
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:30');

    // 説明を入力（オプション）
    await page.getByLabel('説明').fill('これはテストのメモです');

    // エラーメッセージがないことを確認
    await expect(page.locator('.error-message')).not.toBeVisible();

    // 追加ボタンが有効であることを確認してからクリック
    const addButton = page.locator('.modal-content .btn-submit');
    await expect(addButton).toBeEnabled();
    await expect(addButton).toHaveText('追加');
    await addButton.click();

    // フォームが閉じる
    await expect(page.getByRole('heading', { name: '新しい予定' })).not.toBeVisible();

    // 追加したスケジュールが表示される（スケジュールリスト内で確認）
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'テストスケジュール' })
    ).toBeVisible();

    // 時刻も表示されることを確認
    await expect(
      page.locator('.schedule-item', { hasText: 'テストスケジュール' }).locator('.schedule-time')
    ).toContainText('10:00 - 11:30');
  });

  test('スケジュールを編集できる', async ({ page }) => {
    // まずスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('編集前のタイトル');
    await page.getByLabel('開始時刻').selectOption('09:00');
    await page.getByLabel('終了時刻').selectOption('10:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されるまで待つ
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '編集前のタイトル' })
    ).toBeVisible();

    // 編集ボタンをクリック
    const scheduleItem = page.locator('.schedule-item', { hasText: '編集前のタイトル' });
    await scheduleItem.getByRole('button', { name: '編集' }).click();

    // フォームが表示される（編集モードのヘッダーで確認）
    await expect(page.getByRole('heading', { name: '予定を編集' })).toBeVisible();

    // タイトルを編集
    const titleInput = page.getByLabel('タイトル *');
    await titleInput.clear();
    await titleInput.fill('編集後のタイトル');

    // 更新ボタンをクリック
    await page.locator('.modal-content .btn-submit').click();

    // 編集後のタイトルが表示される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '編集後のタイトル' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '編集前のタイトル' })
    ).not.toBeVisible();
  });

  test('スケジュールを削除できる', async ({ page }) => {
    // まずスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('削除するスケジュール');
    await page.getByLabel('開始時刻').selectOption('14:00');
    await page.getByLabel('終了時刻').selectOption('15:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されるまで待つ
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '削除するスケジュール' })
    ).toBeVisible();

    // 削除の確認ダイアログのハンドラを設定
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('削除');
      await dialog.accept();
    });

    // 削除ボタンをクリック
    const scheduleItem = page.locator('.schedule-item', { hasText: '削除するスケジュール' });
    await scheduleItem.getByRole('button', { name: '削除' }).click();

    // スケジュールが削除されている
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '削除するスケジュール' })
    ).not.toBeVisible();
  });

  test('カレンダーで日付を選択できる', async ({ page }) => {
    // カレンダーの日付をクリック
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 今日の日付以外の日付をクリック
    const dateButtons = calendar
      .locator('button.calendar-day:not(.today):not(.other-month)')
      .first();
    await dateButtons.click();

    // 日付が選択された状態になる（selectedクラスが付く）
    await expect(dateButtons).toHaveClass(/selected/);
  });

  test('複数のスケジュールを追加して表示できる', async ({ page }) => {
    // 1つ目のスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('朝の会議');
    await page.getByLabel('開始時刻').selectOption('09:00');
    await page.getByLabel('終了時刻').selectOption('10:00');
    await page.locator('.modal-content .btn-submit').click();

    // 1つ目のスケジュールが表示されるまで待つ
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '朝の会議' })
    ).toBeVisible();

    // 2つ目のスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('ランチ');
    await page.getByLabel('開始時刻').selectOption('12:00');
    await page.getByLabel('終了時刻').selectOption('13:00');
    await page.locator('.modal-content .btn-submit').click();

    // 両方のスケジュールが表示される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '朝の会議' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'ランチ' })
    ).toBeVisible();

    // スケジュールが時刻順にソートされていることを確認
    const scheduleTitles = await page.locator('.schedule-item .schedule-title').allTextContents();
    expect(scheduleTitles).toEqual(['朝の会議', 'ランチ']);
  });

  test('フォームをキャンセルできる', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // フォームが表示される
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();

    // フォームに入力
    await page.getByLabel('タイトル *').fill('キャンセルするスケジュール');

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // フォームが閉じる
    await expect(page.getByRole('heading', { name: '新しい予定' })).not.toBeVisible();

    // スケジュールは追加されていない（「予定がありません」が表示される）
    await expect(page.getByText('予定がありません')).toBeVisible();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'キャンセルするスケジュール' })
    ).not.toBeVisible();
  });

  test('新規作成時に開始時刻を選択すると終了時刻が自動的に+1時間後に設定される', async ({
    page,
  }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // フォームが表示される
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();

    // 開始時刻を14:00に設定
    await page.getByLabel('開始時刻').selectOption('14:00');

    // 終了時刻が自動的に15:00に設定されることを確認
    const endTimeSelect = page.getByLabel('終了時刻');
    await expect(endTimeSelect).toHaveValue('15:00');

    // タイトルを入力して保存
    await page.getByLabel('タイトル *').fill('自動設定テスト');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが正しく保存される
    await expect(
      page.locator('.schedule-item', { hasText: '自動設定テスト' }).locator('.schedule-time')
    ).toContainText('14:00 - 15:00');
  });

  test('自動設定された終了時刻は手動で変更可能', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // 開始時刻を10:00に設定（終了時刻は自動的に11:00になる）
    await page.getByLabel('開始時刻').selectOption('10:00');
    await expect(page.getByLabel('終了時刻')).toHaveValue('11:00');

    // 終了時刻を手動で12:30に変更
    await page.getByLabel('終了時刻').selectOption('12:30');
    await expect(page.getByLabel('終了時刻')).toHaveValue('12:30');

    // タイトルを入力して保存
    await page.getByLabel('タイトル *').fill('手動変更テスト');
    await page.locator('.modal-content .btn-submit').click();

    // 手動変更した時刻で保存される
    await expect(
      page.locator('.schedule-item', { hasText: '手動変更テスト' }).locator('.schedule-time')
    ).toContainText('10:00 - 12:30');
  });

  test('24時をまたぐケースでも終了時刻が正しく設定される', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // 開始時刻を23:30に設定
    await page.getByLabel('開始時刻').selectOption('23:30');

    // 終了時刻が自動的に00:30に設定されることを確認
    const endTimeSelect = page.getByLabel('終了時刻');
    await expect(endTimeSelect).toHaveValue('00:30');

    // タイトルを入力して保存
    await page.getByLabel('タイトル *').fill('深夜のスケジュール');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが正しく保存される
    await expect(
      page.locator('.schedule-item', { hasText: '深夜のスケジュール' }).locator('.schedule-time')
    ).toContainText('23:30 - 00:30');
  });

  test('編集モードでは開始時刻を変更しても終了時刻は自動変更されない', async ({ page }) => {
    // まずスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('編集モードテスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    // 終了時刻は自動的に11:00になるが、手動で12:00に変更
    await page.getByLabel('終了時刻').selectOption('12:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されるまで待つ
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '編集モードテスト' })
    ).toBeVisible();

    // 編集ボタンをクリック
    const scheduleItem = page.locator('.schedule-item', { hasText: '編集モードテスト' });
    await scheduleItem.getByRole('button', { name: '編集' }).click();

    // 編集フォームが表示される
    await expect(page.getByRole('heading', { name: '予定を編集' })).toBeVisible();

    // 現在の終了時刻が12:00であることを確認
    await expect(page.getByLabel('終了時刻')).toHaveValue('12:00');

    // 開始時刻を09:00に変更
    await page.getByLabel('開始時刻').selectOption('09:00');

    // 終了時刻は12:00のまま（自動変更されない）
    await expect(page.getByLabel('終了時刻')).toHaveValue('12:00');

    // エラーメッセージは表示されない
    await expect(page.locator('.error-message')).not.toBeVisible();

    // 更新ボタンをクリック
    await page.locator('.modal-content .btn-submit').click();

    // 変更が保存される
    await expect(
      page.locator('.schedule-item', { hasText: '編集モードテスト' }).locator('.schedule-time')
    ).toContainText('09:00 - 12:00');
  });
});

test.describe('スケジュールアプリ - 異常系', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('開始時刻が終了時刻より後の場合、翌日のスケジュールとして扱われる', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // フォームが表示される
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();

    // タイトルを入力
    await page.getByLabel('タイトル *').fill('翌日のスケジュール');

    // 開始時刻を終了時刻より後に設定（翌日として扱われる）
    await page.getByLabel('開始時刻').selectOption('14:00');
    await page.getByLabel('終了時刻').selectOption('13:00');

    // エラーメッセージは表示されない（翌日と解釈される）
    await expect(page.locator('.error-message')).not.toBeVisible();

    // 送信ボタンが有効
    const submitButton = page.locator('.modal-content .btn-submit');
    await expect(submitButton).toBeEnabled();

    // スケジュールを保存
    await submitButton.click();

    // スケジュールが保存される
    await expect(
      page.locator('.schedule-item', { hasText: '翌日のスケジュール' }).locator('.schedule-time')
    ).toContainText('14:00 - 13:00');
  });

  test('開始時刻と終了時刻が同じ場合、エラーメッセージが表示される', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // タイトルを入力
    await page.getByLabel('タイトル *').fill('同じ時刻のテスト');

    // 開始時刻と終了時刻を同じに設定
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('10:00');

    // エラーメッセージが表示される
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText(
      '開始時刻は終了時刻よりも前に設定してください'
    );

    // 送信ボタンがdisabledになる
    await expect(page.locator('.modal-content .btn-submit')).toBeDisabled();
  });

  test('タイトルが空白文字のみの場合、送信できない', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // タイトルに空白のみを入力
    await page.getByLabel('タイトル *').fill('   ');

    // 時刻を設定
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 送信ボタンをクリック
    await page.locator('.modal-content .btn-submit').click();

    // フォームが閉じない（送信が実行されない）
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();

    // スケジュールは追加されていない
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.getByText('予定がありません')).toBeVisible();
  });

  test('削除確認ダイアログでキャンセルすると、スケジュールが削除されない', async ({ page }) => {
    // まずスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('削除キャンセルのテスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されるまで待つ
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '削除キャンセルのテスト' })
    ).toBeVisible();

    // 削除確認ダイアログでキャンセルを選択
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('削除');
      await dialog.dismiss(); // キャンセルを選択
    });

    // 削除ボタンをクリック
    const scheduleItem = page.locator('.schedule-item', { hasText: '削除キャンセルのテスト' });
    await scheduleItem.getByRole('button', { name: '削除' }).click();

    // スケジュールが削除されず、まだ表示されている
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '削除キャンセルのテスト' })
    ).toBeVisible();
  });

  test('編集中にキャンセルすると、変更が保存されない', async ({ page }) => {
    // まずスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('元のタイトル');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されるまで待つ
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '元のタイトル' })
    ).toBeVisible();

    // 編集ボタンをクリック
    const scheduleItem = page.locator('.schedule-item', { hasText: '元のタイトル' });
    await scheduleItem.getByRole('button', { name: '編集' }).click();

    // 編集フォームが表示される
    await expect(page.getByRole('heading', { name: '予定を編集' })).toBeVisible();

    // タイトルを変更
    const titleInput = page.getByLabel('タイトル *');
    await titleInput.clear();
    await titleInput.fill('変更後のタイトル');

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // フォームが閉じる
    await expect(page.getByRole('heading', { name: '予定を編集' })).not.toBeVisible();

    // 元のタイトルがそのまま表示されている
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '元のタイトル' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '変更後のタイトル' })
    ).not.toBeVisible();
  });

  test('モーダル外をクリックすると、フォームが閉じる', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // フォームが表示される
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();

    // タイトルを入力
    await page.getByLabel('タイトル *').fill('モーダル外クリックのテスト');

    // モーダルの外側（オーバーレイ）をクリック
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });

    // フォームが閉じる
    await expect(page.getByRole('heading', { name: '新しい予定' })).not.toBeVisible();

    // スケジュールは追加されていない
    await expect(page.getByText('予定がありません')).toBeVisible();
  });

  test('非常に長いタイトルでもスケジュールを追加できる', async ({ page }) => {
    // 1000文字のタイトルを生成
    const longTitle = 'あ'.repeat(1000);

    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // 長いタイトルを入力
    await page.getByLabel('タイトル *').fill(longTitle);

    // 時刻を設定
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 送信ボタンをクリック
    await page.locator('.modal-content .btn-submit').click();

    // フォームが閉じる
    await expect(page.getByRole('heading', { name: '新しい予定' })).not.toBeVisible();

    // スケジュールが追加される（最初の一部が表示されることを確認）
    await expect(page.locator('.schedule-item .schedule-title').first()).toContainText('あああ');
  });

  test('非常に長い説明文でもスケジュールを追加できる', async ({ page }) => {
    // 5000文字の説明を生成
    const longDescription = 'これはテストです。'.repeat(500);

    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // タイトルと説明を入力
    await page.getByLabel('タイトル *').fill('長い説明のテスト');
    await page.getByLabel('説明').fill(longDescription);

    // 時刻を設定
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 送信ボタンをクリック
    await page.locator('.modal-content .btn-submit').click();

    // フォームが閉じる
    await expect(page.getByRole('heading', { name: '新しい予定' })).not.toBeVisible();

    // スケジュールが追加される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '長い説明のテスト' })
    ).toBeVisible();
  });
});
