import type { Schedule } from '../types/schedule';

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
