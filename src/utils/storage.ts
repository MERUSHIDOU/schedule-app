import type { AppSettings, Schedule } from '../types/schedule';

const STORAGE_KEY = 'schedule-app-data';

// localStorageからスケジュールをロード
export function loadSchedules(): Schedule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load schedules:', error);
  }
  return [];
}

// localStorageにスケジュールを保存
export function saveSchedules(schedules: Schedule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  } catch (error) {
    console.error('Failed to save schedules:', error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// localStorageにスケジュールデータが存在するかチェック
export function hasStorageData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// localStorageから設定をロード（設定項目がなくなったため空オブジェクトを返す）
export function loadSettings(): AppSettings {
  return {};
}

// localStorageに設定を保存（設定項目がなくなったため何もしない）
export function saveSettings(_settings: AppSettings): void {
  // 設定項目がないため何もしない
}
