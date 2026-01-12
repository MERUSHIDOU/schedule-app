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
