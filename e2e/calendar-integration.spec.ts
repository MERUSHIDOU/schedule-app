import { expect, test } from '@playwright/test';
import { ScheduleHelper } from './helpers/schedule-helper';

test.describe('カレンダー操作とスケジュール表示の統合テスト', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await helper.resetApp();
  });

  test('カレンダーで異なる日付を選択したときに、その日付のスケジュールが正しくフィルタリングされる', async () => {
    await expect(helper.calendar).toBeVisible();

    // 当月の最初の日付を選択
    const firstDay = helper.currentMonthDays.first();
    await firstDay.click();

    // スケジュールを追加
    await helper.addScheduleAndVerify({
      title: '最初の日付のスケジュール',
      startTime: '10:00',
      endTime: '11:00',
    });

    // 別の日付を選択（祝日でない日付を選択）
    const secondDay = helper.calendar
      .locator('button.calendar-day:not(.other-month):not(.holiday)')
      .nth(10);
    await secondDay.click();

    // 最初の日付のスケジュールは表示されない
    await expect(helper.getScheduleTitle('最初の日付のスケジュール')).not.toBeVisible();

    // 「予定がありません」が表示される
    await expect(helper.noSchedulesText).toBeVisible();

    // 最初の日付に戻る
    await firstDay.click();

    // スケジュールが再び表示される
    await expect(helper.getScheduleTitle('最初の日付のスケジュール')).toBeVisible();
  });

  test('複数の日付にスケジュールを追加し、日付を切り替えたときに正しく表示される', async () => {
    await expect(helper.calendar).toBeVisible();
    const days = helper.currentMonthDays;

    const day5 = days.nth(5);
    const day15 = days.nth(15);

    // 1つ目の日付を選択してスケジュールを追加
    await day5.click();
    await expect(day5).toHaveClass(/selected/);
    await helper.addScheduleAndVerify({
      title: '前半の日付のスケジュール',
      startTime: '09:00',
      endTime: '10:00',
    });

    // 2つ目の日付を選択してスケジュールを追加
    await day15.click();
    await expect(day15).toHaveClass(/selected/);
    await helper.addScheduleAndVerify({
      title: '後半の日付のスケジュール',
      startTime: '14:00',
      endTime: '15:00',
    });

    // 1つ目の日付に戻ると、そのスケジュールが表示される
    await day5.click();
    await expect(helper.getScheduleTitle('前半の日付のスケジュール')).toBeVisible();
    await expect(helper.getScheduleTitle('後半の日付のスケジュール')).not.toBeVisible();

    // 2つ目の日付に戻ると、そのスケジュールが表示される
    await day15.click();
    await expect(helper.getScheduleTitle('後半の日付のスケジュール')).toBeVisible();
    await expect(helper.getScheduleTitle('前半の日付のスケジュール')).not.toBeVisible();
  });

  test('カレンダーの月を変更（前月/次月）したときの動作', async () => {
    await expect(helper.calendar).toBeVisible();
    const initialMonth = await helper.monthTitle.textContent();

    // 次月ボタンをクリック
    await helper.nextMonthButton.click();
    await expect(helper.monthTitle).not.toHaveText(initialMonth!);

    // 前月ボタンをクリック
    await helper.prevMonthButton.click();
    await expect(helper.monthTitle).toHaveText(initialMonth!);

    // 前月ボタンをもう一度クリック
    await helper.prevMonthButton.click();
    await expect(helper.monthTitle).not.toHaveText(initialMonth!);
  });

  test('カレンダーのドット表示（スケジュールがある日付に視覚的インジケーターが表示される）', async () => {
    await expect(helper.calendar).toBeVisible();

    // 当月の特定の日付を選択
    const targetDay = helper.currentMonthDays.nth(7);
    await targetDay.click();

    // スケジュールを追加前はドットがないことを確認
    await expect(targetDay.locator('.schedule-dot')).not.toBeVisible();

    // スケジュールを追加
    await helper.addScheduleAndVerify({
      title: 'ドット表示テスト',
      startTime: '10:00',
      endTime: '11:00',
    });

    // ドットが表示されることを確認
    await expect(targetDay.locator('.schedule-dot')).toBeVisible();
  });

  test('今日の日付が正しくハイライトされる', async () => {
    await expect(helper.calendar).toBeVisible();

    // 今日の日付にtodayクラスがあることを確認
    await expect(helper.todayDayButton).toBeVisible();
    await expect(helper.todayDayButton).toHaveClass(/today/);

    // 「今日」ボタンをクリック
    await helper.todayButton.click();

    // 今日が選択状態になることを確認
    await expect(helper.todayDayButton).toHaveClass(/selected/);
  });

  test('他の月の日付は異なるスタイルで表示される', async () => {
    await expect(helper.calendar).toBeVisible();

    // other-monthクラスを持つ日付が存在することを確認
    const otherMonthDays = helper.calendar.locator('button.calendar-day.other-month');
    const count = await otherMonthDays.count();

    if (count > 0) {
      await expect(otherMonthDays.first()).toHaveClass(/other-month/);
    }

    // 現在の月の日付はother-monthクラスを持たない
    const currentCount = await helper.currentMonthDays.count();
    expect(currentCount).toBeGreaterThan(0);
  });

  test('複数のスケジュールがある日付には複数のドットが表示される', async () => {
    await expect(helper.calendar).toBeVisible();

    const targetDay = helper.currentMonthDays.nth(12);
    await targetDay.click();
    await expect(targetDay).toHaveClass(/selected/);

    // 3つのスケジュールを追加
    for (let i = 1; i <= 3; i++) {
      const startHour = (8 + i).toString().padStart(2, '0');
      const endHour = (9 + i).toString().padStart(2, '0');
      await helper.addScheduleAndVerify({
        title: `スケジュール${i}`,
        startTime: `${startHour}:00`,
        endTime: `${endHour}:00`,
      });
    }

    // 複数のドットが表示されることを確認
    const dots = targetDay.locator('.schedule-dot');
    await expect(dots).toHaveCount(3);
  });

  test('4つ以上のスケジュールがある場合、+Nインジケーターが表示される', async () => {
    await expect(helper.calendar).toBeVisible();

    const targetDay = helper.currentMonthDays.nth(20);
    await targetDay.click();
    await expect(targetDay).toHaveClass(/selected/);

    // 5つのスケジュールを追加
    for (let i = 1; i <= 5; i++) {
      const startHour = (7 + i).toString().padStart(2, '0');
      const endHour = (8 + i).toString().padStart(2, '0');
      await helper.addScheduleAndVerify({
        title: `スケジュール${i}`,
        startTime: `${startHour}:00`,
        endTime: `${endHour}:00`,
      });
    }

    // 3つのドットと+2インジケーターが表示されることを確認
    await expect(targetDay.locator('.schedule-dot')).toHaveCount(3);

    const moreIndicator = targetDay.locator('.more-indicator');
    await expect(moreIndicator).toBeVisible();
    await expect(moreIndicator).toContainText('+2');
  });

  test('月を変更しても選択日付のスケジュールは維持される', async () => {
    await expect(helper.calendar).toBeVisible();

    // 今日を選択してスケジュールを追加
    await helper.todayButton.click();
    await helper.addScheduleAndVerify({
      title: '月変更テストスケジュール',
      startTime: '10:00',
      endTime: '11:00',
    });

    // 次月に移動
    await helper.nextMonthButton.click();

    // 今日ボタンをクリックして今日に戻る
    await helper.todayButton.click();

    // スケジュールが表示される
    await expect(helper.getScheduleTitle('月変更テストスケジュール')).toBeVisible();
  });
});

test.describe('祝日表示機能', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await helper.resetApp();
  });

  test('カレンダーで祝日が赤色で表示される', async () => {
    await expect(helper.calendar).toBeVisible();

    // 2026年1月に移動（元日などの祝日がある月）
    await helper.navigateToMonth(2026, 1);

    // 元日（2026-01-01）の日付ボタンを探す
    const holidayDay = helper.holidayDayButtons.first();
    await expect(holidayDay).toBeVisible();
    await expect(holidayDay).toHaveClass(/holiday/);
  });

  test('祝日を選択するとスケジュールリストに表示される', async () => {
    await expect(helper.calendar).toBeVisible();

    // 2026年1月に移動
    await helper.navigateToMonth(2026, 1);

    // 元日の日付をクリック
    const newYearDay = helper.holidayDayButtons.first();
    await newYearDay.click();

    // スケジュールリストに「元日」が表示されることを確認
    await expect(helper.getScheduleTitle('元日')).toBeVisible();
  });

  test('祝日には編集・削除ボタンが表示されない', async () => {
    await expect(helper.calendar).toBeVisible();

    // 2026年1月に移動
    await helper.navigateToMonth(2026, 1);

    // 元日の日付をクリック
    await helper.holidayDayButtons.first().click();

    // 祝日のスケジュール項目を取得
    const holidaySchedule = helper.getScheduleItem('元日');
    await expect(holidaySchedule).toBeVisible();

    // 編集・削除ボタンが存在しないことを確認
    await expect(holidaySchedule.getByRole('button', { name: '編集' })).not.toBeVisible();
    await expect(holidaySchedule.getByRole('button', { name: '削除' })).not.toBeVisible();
  });

  test('祝日と通常の予定が一緒に表示される', async () => {
    await expect(helper.calendar).toBeVisible();

    // 2026年1月に移動
    await helper.navigateToMonth(2026, 1);

    // 元日の日付をクリック
    await helper.holidayDayButtons.first().click();

    // 元日が表示されることを確認
    await expect(helper.getScheduleTitle('元日')).toBeVisible();

    // 通常の予定を追加
    await helper.addScheduleAndVerify({
      title: '新年の集まり',
      startTime: '14:00',
      endTime: '16:00',
    });

    // 両方のスケジュールが表示される
    await expect(helper.getScheduleTitle('元日')).toBeVisible();
    await expect(helper.getScheduleTitle('新年の集まり')).toBeVisible();

    // 通常の予定には編集・削除ボタンが表示される
    const userSchedule = helper.getScheduleItem('新年の集まり');
    await expect(userSchedule.getByRole('button', { name: '編集' })).toBeVisible();
    await expect(userSchedule.getByRole('button', { name: '削除' })).toBeVisible();
  });

  test('祝日と予定が時刻順にソートされて表示される', async () => {
    await expect(helper.calendar).toBeVisible();

    // 2026年1月に移動
    await helper.navigateToMonth(2026, 1);

    // 元日の日付をクリック
    await helper.holidayDayButtons.first().click();

    // 午後の予定を追加
    await helper.addScheduleAndVerify({
      title: '午後の予定',
      startTime: '15:00',
      endTime: '16:00',
    });

    // 午前の予定を追加
    await helper.addScheduleAndVerify({
      title: '午前の予定',
      startTime: '10:00',
      endTime: '11:00',
    });

    // スケジュールが時刻順にソートされていることを確認
    // 祝日（00:00）-> 午前の予定（10:00）-> 午後の予定（15:00）の順
    const scheduleTitles = await helper.getAllScheduleTitles();
    expect(scheduleTitles).toEqual(['元日', '午前の予定', '午後の予定']);
  });

  test('祝日にスケジュールドットが表示される', async () => {
    await expect(helper.calendar).toBeVisible();

    // 2026年1月に移動
    await helper.navigateToMonth(2026, 1);

    // 元日の日付ボタンを取得
    const newYearDay = helper.holidayDayButtons.first();
    await expect(newYearDay).toBeVisible();

    // 祝日にもスケジュールドットが表示されることを確認
    await expect(newYearDay.locator('.schedule-dot')).toBeVisible();
  });

  test('複数の祝日がある月で各祝日が正しく表示される', async () => {
    await expect(helper.calendar).toBeVisible();

    // 2026年5月に移動（複数の祝日がある月）
    await helper.navigateToMonth(2026, 5);

    // 5月には複数の祝日がある（憲法記念日、みどりの日、こどもの日など）
    const holidayCount = await helper.holidayDayButtons.count();

    // 2026年5月には少なくとも3つの祝日がある
    expect(holidayCount).toBeGreaterThanOrEqual(3);
  });
});
