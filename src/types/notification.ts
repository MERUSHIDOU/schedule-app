// 通知タイミングの種類
export type NotificationTiming = 'onTime' | '5min' | '15min' | '30min' | '1hour' | 'custom';

// 通知設定
export interface NotificationConfig {
  enabled: boolean;
  timing: NotificationTiming;
  customMinutes?: number; // customの場合のみ使用
}

// スケジュールされた通知
export interface ScheduledNotification {
  scheduleId: string;
  notificationTime: string; // ISO形式
  title: string;
  body: string;
}
