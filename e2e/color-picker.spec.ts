import { expect, test } from '@playwright/test';

test.describe('スケジュールの色変更機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('スケジュール作成時に色を選択できる', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // フォームが表示される
    await expect(page.getByRole('heading', { name: '新しい予定' })).toBeVisible();

    // カラーピッカーが表示されることを確認
    const colorPicker = page.locator('.color-picker');
    await expect(colorPicker).toBeVisible();

    // 色オプションが8つあることを確認
    const colorOptions = colorPicker.locator('.color-option');
    await expect(colorOptions).toHaveCount(8);

    // 2番目の色（緑）を選択
    await colorOptions.nth(1).click();

    // 選択した色にselectedクラスが付くことを確認
    await expect(colorOptions.nth(1)).toHaveClass(/selected/);

    // タイトルと時刻を入力
    await page.getByLabel('タイトル *').fill('緑色のスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 追加
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '緑色のスケジュール' })
    ).toBeVisible();

    // カラーバーが緑色であることを確認
    const scheduleItem = page.locator('.schedule-item', { hasText: '緑色のスケジュール' });
    const colorBar = scheduleItem.locator('.schedule-color-bar');
    await expect(colorBar).toBeVisible();

    // カラーバーの背景色を確認（緑色: #10b981）
    const bgColor = await colorBar.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // rgb(16, 185, 129) は #10b981 のRGB値
    expect(bgColor).toBe('rgb(16, 185, 129)');
  });

  test('スケジュール編集時に色を変更できる', async ({ page }) => {
    // まずデフォルトの色でスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('色変更テスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');
    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示されることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '色変更テスト' })
    ).toBeVisible();

    // 最初の色（デフォルトは青: #3b82f6）を確認
    const scheduleItem = page.locator('.schedule-item', { hasText: '色変更テスト' });
    const colorBar = scheduleItem.locator('.schedule-color-bar');
    const initialColor = await colorBar.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // rgb(59, 130, 246) は #3b82f6 のRGB値
    expect(initialColor).toBe('rgb(59, 130, 246)');

    // 編集ボタンをクリック
    await scheduleItem.getByRole('button', { name: '編集' }).click();

    // 編集フォームが表示される
    await expect(page.getByRole('heading', { name: '予定を編集' })).toBeVisible();

    // 4番目の色（赤: #ef4444）を選択
    const colorOptions = page.locator('.color-picker .color-option');
    await colorOptions.nth(3).click();

    // 更新
    await page.locator('.modal-content .btn-submit').click();

    // 色が変更されていることを確認
    const newColor = await colorBar.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // rgb(239, 68, 68) は #ef4444 のRGB値
    expect(newColor).toBe('rgb(239, 68, 68)');
  });

  test('選択した色がスケジュールリストに反映される', async ({ page }) => {
    // スケジュールを追加（紫色を選択）
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('紫色のスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 5番目の色（紫: #8b5cf6）を選択
    const colorOptions = page.locator('.color-picker .color-option');
    await colorOptions.nth(4).click();

    await page.locator('.modal-content .btn-submit').click();

    // スケジュールが表示される
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: '紫色のスケジュール' })
    ).toBeVisible();

    // カラーバーが紫色であることを確認
    const scheduleItem = page.locator('.schedule-item', { hasText: '紫色のスケジュール' });
    const colorBar = scheduleItem.locator('.schedule-color-bar');
    const bgColor = await colorBar.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // rgb(139, 92, 246) は #8b5cf6 のRGB値
    expect(bgColor).toBe('rgb(139, 92, 246)');
  });

  test('異なる色のスケジュールを複数作成できる', async ({ page }) => {
    const colors = [
      { index: 0, name: '青', rgb: 'rgb(59, 130, 246)' },
      { index: 2, name: 'オレンジ', rgb: 'rgb(245, 158, 11)' },
      { index: 5, name: 'ピンク', rgb: 'rgb(236, 72, 153)' },
    ];

    // 各色でスケジュールを追加
    for (let i = 0; i < colors.length; i++) {
      await page.getByRole('button', { name: '予定を追加' }).click();
      await page.getByLabel('タイトル *').fill(`${colors[i].name}のスケジュール`);
      // 時刻を正しいフォーマット(HH:MM)で設定
      const startHour = (9 + i * 2).toString().padStart(2, '0');
      const endHour = (10 + i * 2).toString().padStart(2, '0');
      await page.getByLabel('開始時刻').selectOption(`${startHour}:00`);
      await page.getByLabel('終了時刻').selectOption(`${endHour}:00`);

      // 色を選択
      const colorOptions = page.locator('.color-picker .color-option');
      await colorOptions.nth(colors[i].index).click();

      await page.locator('.modal-content .btn-submit').click();

      // スケジュールが表示されることを確認
      await expect(
        page.locator('.schedule-item .schedule-title', {
          hasText: `${colors[i].name}のスケジュール`,
        })
      ).toBeVisible();
    }

    // 各スケジュールの色を確認
    for (const color of colors) {
      const scheduleItem = page.locator('.schedule-item', {
        hasText: `${color.name}のスケジュール`,
      });
      const colorBar = scheduleItem.locator('.schedule-color-bar');
      const bgColor = await colorBar.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(bgColor).toBe(color.rgb);
    }
  });

  test('カラーピッカーで現在選択されている色が視覚的に表示される', async ({ page }) => {
    // FABボタンをクリック
    await page.getByRole('button', { name: '予定を追加' }).click();

    // カラーピッカーが表示される
    const colorOptions = page.locator('.color-picker .color-option');

    // デフォルトで最初の色が選択されている
    await expect(colorOptions.first()).toHaveClass(/selected/);

    // 他の色は選択されていない
    for (let i = 1; i < 8; i++) {
      await expect(colorOptions.nth(i)).not.toHaveClass(/selected/);
    }

    // 3番目の色をクリック
    await colorOptions.nth(2).click();

    // 3番目の色が選択状態になる
    await expect(colorOptions.nth(2)).toHaveClass(/selected/);

    // 最初の色は選択解除される
    await expect(colorOptions.first()).not.toHaveClass(/selected/);
  });

  test('編集フォームを開いたときに現在の色が選択状態で表示される', async ({ page }) => {
    // 特定の色でスケジュールを作成
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('色確認テスト');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 6番目の色（シアン: #06b6d4）を選択
    const colorOptions = page.locator('.color-picker .color-option');
    await colorOptions.nth(6).click();

    await page.locator('.modal-content .btn-submit').click();

    // 編集ボタンをクリック
    const scheduleItem = page.locator('.schedule-item', { hasText: '色確認テスト' });
    await scheduleItem.getByRole('button', { name: '編集' }).click();

    // 編集フォームで6番目の色が選択状態であることを確認
    const editColorOptions = page.locator('.color-picker .color-option');
    await expect(editColorOptions.nth(6)).toHaveClass(/selected/);

    // 他の色は選択されていない
    for (let i = 0; i < 8; i++) {
      if (i !== 6) {
        await expect(editColorOptions.nth(i)).not.toHaveClass(/selected/);
      }
    }
  });

  test('カレンダーのドットにも選択した色が反映される', async ({ page }) => {
    const calendar = page.locator('.calendar');
    await expect(calendar).toBeVisible();

    // 今日を選択
    await page.getByRole('button', { name: '今日' }).click();
    const todayButton = calendar.locator('button.calendar-day.today');

    // オレンジ色のスケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('オレンジスケジュール');
    await page.getByLabel('開始時刻').selectOption('10:00');
    await page.getByLabel('終了時刻').selectOption('11:00');

    // 3番目の色（オレンジ: #f59e0b）を選択
    const colorOptions = page.locator('.color-picker .color-option');
    await colorOptions.nth(2).click();

    await page.locator('.modal-content .btn-submit').click();

    // カレンダーのドットの色を確認
    const dot = todayButton.locator('.schedule-dot');
    await expect(dot).toBeVisible();

    const dotColor = await dot.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // rgb(245, 158, 11) は #f59e0b のRGB値
    expect(dotColor).toBe('rgb(245, 158, 11)');
  });

  test('色を変更してもスケジュールの他のデータは維持される', async ({ page }) => {
    // スケジュールを追加
    await page.getByRole('button', { name: '予定を追加' }).click();
    await page.getByLabel('タイトル *').fill('データ維持テスト');
    await page.getByLabel('開始時刻').selectOption('14:30');
    await page.getByLabel('終了時刻').selectOption('16:00');
    await page.getByLabel('説明').fill('説明文がここに入ります');
    await page.locator('.modal-content .btn-submit').click();

    // 編集して色だけ変更
    const scheduleItem = page.locator('.schedule-item', { hasText: 'データ維持テスト' });
    await scheduleItem.getByRole('button', { name: '編集' }).click();

    // 色を変更
    const colorOptions = page.locator('.color-picker .color-option');
    await colorOptions.nth(7).click();

    await page.locator('.modal-content .btn-submit').click();

    // 他のデータが維持されていることを確認
    await expect(
      page.locator('.schedule-item .schedule-title', { hasText: 'データ維持テスト' })
    ).toBeVisible();
    await expect(
      page.locator('.schedule-item', { hasText: 'データ維持テスト' }).locator('.schedule-time')
    ).toContainText('14:30 - 16:00');
    await expect(
      page
        .locator('.schedule-item', { hasText: 'データ維持テスト' })
        .locator('.schedule-description')
    ).toContainText('説明文がここに入ります');
  });

  test('すべての色オプションにaria-labelが設定されている', async ({ page }) => {
    await page.getByRole('button', { name: '予定を追加' }).click();

    const colorOptions = page.locator('.color-picker .color-option');
    const count = await colorOptions.count();

    for (let i = 0; i < count; i++) {
      const ariaLabel = await colorOptions.nth(i).getAttribute('aria-label');
      expect(ariaLabel).not.toBeNull();
      expect(ariaLabel).toContain('色:');
    }
  });
});
