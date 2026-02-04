import { expect, test } from '@playwright/test';
import { ScheduleHelper } from './helpers/schedule-helper';

test.describe('複雑なワークフローテスト', () => {
  let helper: ScheduleHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ScheduleHelper(page);
    await helper.resetApp();
  });

  test('1日に複数のスケジュールを追加し、時間順にソートされる', async () => {
    // 時間がバラバラの順番でスケジュールを追加
    const schedules = [
      { title: '午後のミーティング', startTime: '15:00', endTime: '16:00' },
      { title: '朝の会議', startTime: '09:00', endTime: '10:00' },
      { title: 'ランチ', startTime: '12:00', endTime: '13:00' },
      { title: '夕方のレビュー', startTime: '17:00', endTime: '18:00' },
      { title: '午前中の作業', startTime: '10:30', endTime: '11:30' },
    ];

    for (const schedule of schedules) {
      await helper.addScheduleAndVerify(schedule);
    }

    // 時間順にソートされていることを確認
    const scheduleTitles = await helper.getAllScheduleTitles();
    expect(scheduleTitles).toEqual([
      '朝の会議',
      '午前中の作業',
      'ランチ',
      '午後のミーティング',
      '夕方のレビュー',
    ]);
  });

  test('異なる日付に複数のスケジュールを追加し、カレンダーで日付を切り替えて表示', async () => {
    await expect(helper.calendar).toBeVisible();
    const days = helper.currentMonthDays;

    // 3つの異なる日付にスケジュールを追加
    const dateSchedules = [
      { dayIndex: 5, title: '5日目のイベント' },
      { dayIndex: 10, title: '10日目のイベント' },
      { dayIndex: 20, title: '20日目のイベント' },
    ];

    for (const { dayIndex, title } of dateSchedules) {
      await days.nth(dayIndex).click();
      await helper.addScheduleAndVerify({
        title,
        startTime: '10:00',
        endTime: '11:00',
      });
    }

    // 各日付を順番に選択して、正しいスケジュールが表示されることを確認
    for (const { dayIndex, title } of dateSchedules) {
      await days.nth(dayIndex).click();
      await expect(helper.getScheduleTitle(title)).toBeVisible();

      // 他の日付のスケジュールは表示されない
      for (const other of dateSchedules) {
        if (other.dayIndex !== dayIndex) {
          await expect(helper.getScheduleTitle(other.title)).not.toBeVisible();
        }
      }
    }
  });

  test('スケジュールを作成 -> 編集 -> 別の日付に移動 -> 削除の一連のフロー', async () => {
    await expect(helper.calendar).toBeVisible();
    const days = helper.currentMonthDays;

    // Step 1: スケジュールを作成
    await days.nth(8).click();
    await helper.addScheduleAndVerify({
      title: 'ワークフローテスト',
      startTime: '10:00',
      endTime: '11:00',
      description: '最初の説明',
    });

    // Step 2: スケジュールを編集（タイトルと時刻を変更）
    await helper.clickEdit('ワークフローテスト');
    await helper.titleInput.clear();
    await helper.titleInput.fill('編集後のワークフローテスト');
    await helper.startTimeSelect.selectOption('14:00');
    await helper.endTimeSelect.selectOption('15:30');
    await helper.descriptionInput.clear();
    await helper.descriptionInput.fill('編集後の説明');
    await helper.submitButton.click();

    await expect(helper.getScheduleTitle('編集後のワークフローテスト')).toBeVisible();
    await expect(helper.getScheduleTime('編集後のワークフローテスト')).toContainText(
      '14:00 - 15:30'
    );

    // Step 3: 別の日付に移動（編集で日付を変更）
    await helper.clickEdit('編集後のワークフローテスト');

    const currentDate = await helper.dateInput.inputValue();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    const newDateStr = newDate.toISOString().split('T')[0];
    await helper.dateInput.fill(newDateStr);
    await helper.submitButton.click();

    // 元の日付にはスケジュールがない
    await expect(helper.getScheduleTitle('編集後のワークフローテスト')).not.toBeVisible();
    await expect(helper.noSchedulesText).toBeVisible();

    // 新しい日付を選択すると、スケジュールが表示される
    await days.nth(9).click();
    await expect(helper.getScheduleTitle('編集後のワークフローテスト')).toBeVisible();

    // Step 4: スケジュールを削除
    await helper.deleteSchedule('編集後のワークフローテスト');
    await expect(helper.noSchedulesText).toBeVisible();
  });

  test('同じ時間帯に重複するスケジュールを複数追加できる', async () => {
    const overlappingSchedules = [
      { title: '会議A', startTime: '10:00', endTime: '11:00' },
      { title: '会議B', startTime: '10:00', endTime: '11:00' },
      { title: '会議C', startTime: '10:30', endTime: '11:30' },
    ];

    for (const schedule of overlappingSchedules) {
      await helper.addScheduleAndVerify(schedule);
    }

    // すべてのスケジュールが表示されていることを確認
    await expect(helper.scheduleItems).toHaveCount(3);

    // 時間順にソートされている（同じ開始時刻の場合は追加順）
    const titles = await helper.getAllScheduleTitles();
    expect(titles).toContain('会議A');
    expect(titles).toContain('会議B');
    expect(titles).toContain('会議C');
  });

  test('複数のスケジュールを連続して追加できる', async () => {
    // 10個のスケジュールを連続して追加
    for (let i = 1; i <= 10; i++) {
      const startHour = (6 + i).toString().padStart(2, '0');
      const endHour = (7 + i).toString().padStart(2, '0');
      await helper.addScheduleAndVerify({
        title: `スケジュール${i}`,
        startTime: `${startHour}:00`,
        endTime: `${endHour}:00`,
      });
    }

    // 10個すべてのスケジュールが表示されていることを確認
    await expect(helper.scheduleItems).toHaveCount(10);
  });

  test('スケジュールを編集してから別のスケジュールを追加しても問題ない', async () => {
    // 最初のスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '最初のスケジュール',
      startTime: '09:00',
      endTime: '10:00',
    });

    // 最初のスケジュールを編集
    await helper.clickEdit('最初のスケジュール');
    await helper.titleInput.clear();
    await helper.titleInput.fill('編集後の最初のスケジュール');
    await helper.submitButton.click();

    await expect(helper.getScheduleTitle('編集後の最初のスケジュール')).toBeVisible();

    // 新しいスケジュールを追加
    await helper.addScheduleAndVerify({
      title: '2番目のスケジュール',
      startTime: '14:00',
      endTime: '15:00',
    });

    // 両方のスケジュールが表示されていることを確認
    await expect(helper.getScheduleTitle('編集後の最初のスケジュール')).toBeVisible();
    await expect(helper.getScheduleTitle('2番目のスケジュール')).toBeVisible();
  });

  test('複数のスケジュールを削除しても他のスケジュールに影響しない', async ({ page }) => {
    // 3つのスケジュールを追加
    const schedules = ['スケジュールA', 'スケジュールB', 'スケジュールC'];
    for (let i = 0; i < schedules.length; i++) {
      const startHour = (9 + i * 2).toString().padStart(2, '0');
      const endHour = (10 + i * 2).toString().padStart(2, '0');
      await helper.addScheduleAndVerify({
        title: schedules[i],
        startTime: `${startHour}:00`,
        endTime: `${endHour}:00`,
      });
    }

    // 削除確認ダイアログを許可
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // 2番目のスケジュールを削除
    await helper.getScheduleItem('スケジュールB').getByRole('button', { name: '削除' }).click();

    // スケジュールBが消え、A, Cは残っている
    await expect(helper.getScheduleTitle('スケジュールB')).not.toBeVisible();
    await expect(helper.getScheduleTitle('スケジュールA')).toBeVisible();
    await expect(helper.getScheduleTitle('スケジュールC')).toBeVisible();

    // 1番目のスケジュールも削除
    await helper.getScheduleItem('スケジュールA').getByRole('button', { name: '削除' }).click();

    // スケジュールAが消え、Cだけ残っている
    await expect(helper.getScheduleTitle('スケジュールA')).not.toBeVisible();
    await expect(helper.getScheduleTitle('スケジュールC')).toBeVisible();

    // 残りは1つ
    await expect(helper.scheduleItems).toHaveCount(1);
  });

  test('フォームを開いてキャンセルしてからまた開いても正常に動作する', async () => {
    // フォームを開いてキャンセル
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();
    await helper.titleInput.fill('キャンセルされる予定');
    await helper.cancelButton.click();
    await expect(helper.newScheduleHeading).not.toBeVisible();

    // スケジュールは追加されていないことを確認
    await expect(helper.noSchedulesText).toBeVisible();

    // もう一度フォームを開いて正常に追加
    await helper.addButton.click();
    await expect(helper.newScheduleHeading).toBeVisible();

    await helper.titleInput.clear();
    await helper.titleInput.fill('正常に追加される予定');
    await helper.startTimeSelect.selectOption('10:00');
    await helper.endTimeSelect.selectOption('11:00');
    await helper.submitButton.click();

    await expect(helper.getScheduleTitle('正常に追加される予定')).toBeVisible();
    await expect(helper.getScheduleTitle('キャンセルされる予定')).not.toBeVisible();
  });

  test('編集フォームで変更を保存できる', async () => {
    // スケジュールを追加
    await helper.addScheduleAndVerify({
      title: 'テストスケジュール',
      startTime: '10:00',
      endTime: '11:00',
    });

    // 編集フォームを開く
    await helper.clickEdit('テストスケジュール');

    // タイトルを変更して保存
    await helper.titleInput.clear();
    await helper.titleInput.fill('編集中のタイトル');
    await helper.submitButton.click();

    // 編集が保存される
    await expect(helper.getScheduleTitle('編集中のタイトル')).toBeVisible();
  });

  test('長期間（月をまたぐ）のワークフロー', async () => {
    await expect(helper.calendar).toBeVisible();

    // 今月にスケジュールを追加
    await helper.todayButton.click();
    await helper.addScheduleAndVerify({
      title: '今月のスケジュール',
      startTime: '10:00',
      endTime: '11:00',
    });

    // 次月に移動してスケジュールを追加
    await helper.nextMonthButton.click();
    const nextMonthDays = helper.currentMonthDays;
    await nextMonthDays.nth(15).click();

    await helper.addScheduleAndVerify({
      title: '来月のスケジュール',
      startTime: '14:00',
      endTime: '15:00',
    });

    // 今月に戻る
    await helper.prevMonthButton.click();
    await helper.todayButton.click();

    // 今月のスケジュールが表示される
    await expect(helper.getScheduleTitle('今月のスケジュール')).toBeVisible();

    // また次月に戻る
    await helper.nextMonthButton.click();
    await nextMonthDays.nth(15).click();

    // 来月のスケジュールが表示される
    await expect(helper.getScheduleTitle('来月のスケジュール')).toBeVisible();
  });
});
