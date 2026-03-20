// リマインダータイミング
export type ReminderTiming =
  | 'none'
  | 'atStart'
  | '5min'
  | '10min'
  | '15min'
  | '30min'
  | '1hour'
  | '1day';

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
  isHoliday?: boolean;
  reminder?: ReminderTiming;
  reminderId?: string;
}

// スケジュール編集フォームで取り扱う
export interface ScheduleFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

// 表示モード(月/週/日)
export type ViewMode = 'month' | 'week' | 'day';

// アプリケーション設定
export type AppSettings = {};
