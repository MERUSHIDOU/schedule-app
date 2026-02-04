import { expect, type Page } from '@playwright/test';

/**
 * スケジュール追加のためのデータ型
 */
export interface ScheduleData {
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  colorIndex?: number;
}

/**
 * スケジュール操作のヘルパー関数群
 * Page Object Modelパターンに基づいた共通処理
 */
export class ScheduleHelper {
  constructor(private readonly page: Page) {}

  // --- ロケータ ---

  /** FABボタン（予定追加） */
  get addButton() {
    return this.page.getByRole('button', { name: '予定を追加' });
  }

  /** カレンダー要素 */
  get calendar() {
    return this.page.locator('.calendar');
  }

  /** 月タイトル */
  get monthTitle() {
    return this.page.locator('.month-title');
  }

  /** 前月ボタン */
  get prevMonthButton() {
    return this.page.getByRole('button', { name: '前月' });
  }

  /** 次月ボタン */
  get nextMonthButton() {
    return this.page.getByRole('button', { name: '次月' });
  }

  /** 今日ボタン */
  get todayButton() {
    return this.page.getByRole('button', { name: '今日' });
  }

  /** 送信ボタン（追加/更新） */
  get submitButton() {
    return this.page.locator('.modal-content .btn-submit');
  }

  /** キャンセルボタン */
  get cancelButton() {
    return this.page.getByRole('button', { name: 'キャンセル' });
  }

  /** タイトル入力フィールド */
  get titleInput() {
    return this.page.getByLabel('タイトル *');
  }

  /** 開始時刻セレクト */
  get startTimeSelect() {
    return this.page.getByLabel('開始時刻');
  }

  /** 終了時刻セレクト */
  get endTimeSelect() {
    return this.page.getByLabel('終了時刻');
  }

  /** 説明テキストエリア */
  get descriptionInput() {
    return this.page.getByLabel('説明');
  }

  /** 日付入力フィールド */
  get dateInput() {
    return this.page.getByLabel('日付');
  }

  /** カラーピッカーオプション */
  get colorOptions() {
    return this.page.locator('.color-picker .color-option');
  }

  /** 「新しい予定」モーダル見出し */
  get newScheduleHeading() {
    return this.page.getByRole('heading', { name: '新しい予定' });
  }

  /** 「予定を編集」モーダル見出し */
  get editScheduleHeading() {
    return this.page.getByRole('heading', { name: '予定を編集' });
  }

  /** エラーメッセージ */
  get errorMessage() {
    return this.page.locator('.error-message');
  }

  /** 「予定がありません」テキスト */
  get noSchedulesText() {
    return this.page.getByText('予定がありません');
  }

  /** 全スケジュールアイテム */
  get scheduleItems() {
    return this.page.locator('.schedule-item');
  }

  /** 当月の日付ボタン（前後月を除く） */
  get currentMonthDays() {
    return this.calendar.locator('button.calendar-day:not(.other-month)');
  }

  /** 今日の日付ボタン */
  get todayDayButton() {
    return this.calendar.locator('button.calendar-day.today');
  }

  /** 祝日の日付ボタン */
  get holidayDayButtons() {
    return this.calendar.locator('button.calendar-day.holiday');
  }

  // --- 操作メソッド ---

  /**
   * ローカルストレージをクリアして初期状態にする
   */
  async resetApp() {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload();
  }

  /**
   * スケジュールを追加する
   */
  async addSchedule(data: ScheduleData) {
    await this.addButton.click();
    await expect(this.newScheduleHeading).toBeVisible();

    await this.titleInput.fill(data.title);
    await this.startTimeSelect.selectOption(data.startTime);
    await this.endTimeSelect.selectOption(data.endTime);

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }

    if (data.colorIndex !== undefined) {
      await this.colorOptions.nth(data.colorIndex).click();
    }

    await this.submitButton.click();
    await expect(this.newScheduleHeading).not.toBeVisible();
  }

  /**
   * スケジュールを追加してタップ操作を使用する（モバイルテスト用）
   */
  async addScheduleByTap(data: ScheduleData) {
    await this.addButton.tap();
    await expect(this.newScheduleHeading).toBeVisible();

    await this.titleInput.fill(data.title);
    await this.startTimeSelect.selectOption(data.startTime);
    await this.endTimeSelect.selectOption(data.endTime);

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }

    if (data.colorIndex !== undefined) {
      await this.colorOptions.nth(data.colorIndex).tap();
    }

    await this.submitButton.tap();
    await expect(this.newScheduleHeading).not.toBeVisible();
  }

  /**
   * スケジュールを追加し、リストに表示されるまで待つ
   */
  async addScheduleAndVerify(data: ScheduleData) {
    await this.addSchedule(data);
    await expect(this.getScheduleTitle(data.title)).toBeVisible();
  }

  /**
   * 特定のスケジュールアイテムを取得する
   */
  getScheduleItem(title: string) {
    return this.page.locator('.schedule-item', { hasText: title });
  }

  /**
   * 特定のスケジュールのタイトル要素を取得する
   */
  getScheduleTitle(title: string) {
    return this.page.locator('.schedule-item .schedule-title', { hasText: title });
  }

  /**
   * 特定のスケジュールの時刻要素を取得する
   */
  getScheduleTime(title: string) {
    return this.getScheduleItem(title).locator('.schedule-time');
  }

  /**
   * 特定のスケジュールのカラーバー要素を取得する
   */
  getScheduleColorBar(title: string) {
    return this.getScheduleItem(title).locator('.schedule-color-bar');
  }

  /**
   * 特定のスケジュールの編集ボタンをクリックする
   */
  async clickEdit(title: string) {
    await this.getScheduleItem(title).getByRole('button', { name: '編集' }).click();
    await expect(this.editScheduleHeading).toBeVisible();
  }

  /**
   * 特定のスケジュールの削除ボタンをクリックする（確認ダイアログ自動承認）
   */
  async deleteSchedule(title: string) {
    this.page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await this.getScheduleItem(title).getByRole('button', { name: '削除' }).click();
    await expect(this.getScheduleTitle(title)).not.toBeVisible();
  }

  /**
   * 指定された年月に移動する
   */
  async navigateToMonth(targetYear: number, targetMonth: number) {
    const monthTitle = this.monthTitle;

    for (let attempts = 0; attempts < 24; attempts++) {
      const currentText = await monthTitle.textContent();
      if (!currentText) continue;

      const yearMatch = currentText.match(/(\d{4})/);
      const monthMatch = currentText.match(/(\d+)月/);
      if (!yearMatch || !monthMatch) continue;

      const currentYear = parseInt(yearMatch[1]);
      const currentMonth = parseInt(monthMatch[1]);

      if (currentYear === targetYear && currentMonth === targetMonth) {
        return;
      }

      // 目標が現在より未来なら次月、過去なら前月
      const currentTotal = currentYear * 12 + currentMonth;
      const targetTotal = targetYear * 12 + targetMonth;

      if (targetTotal > currentTotal) {
        await this.nextMonthButton.click();
      } else {
        await this.prevMonthButton.click();
      }
    }

    throw new Error(`${targetYear}年${targetMonth}月への移動に失敗しました`);
  }

  /**
   * カラーバーの背景色を取得する
   */
  async getColorBarColor(title: string): Promise<string> {
    return await this.getScheduleColorBar(title).evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
  }

  /**
   * すべてのスケジュールタイトルを取得する（表示順）
   */
  async getAllScheduleTitles(): Promise<string[]> {
    return await this.page.locator('.schedule-item .schedule-title').allTextContents();
  }
}
