import type { NotificationConfig } from './notification';

// スケジュールデータ
export interface Schedule {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  notification?: NotificationConfig; // 通知設定（オプショナル）
}

// スケジュール編集フォームで取り扱う
export interface ScheduleFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  notification?: NotificationConfig; // 通知設定（オプショナル）
}

// 表示モード(月/週/日)
export type ViewMode = 'month' | 'week' | 'day';
