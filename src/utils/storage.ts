import type { AppSettings, Schedule } from '../types/schedule';

const STORAGE_KEY = 'schedule-app-data';
const SETTINGS_STORAGE_KEY = 'schedule-app-settings';

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

// localStorageから設定をロード
export function loadSettings(): AppSettings {
  const defaultSettings: AppSettings = {
    showHolidays: true,
  };

  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // 不完全なデータの場合はデフォルト値を使用
      if (typeof parsed.showHolidays !== 'boolean') {
        return defaultSettings;
      }
      return parsed as AppSettings;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
}

// localStorageに設定を保存
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
