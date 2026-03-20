import { HttpsError } from 'firebase-functions/v2/https';

export type ReminderTiming =
  | 'none'
  | 'atStart'
  | '5min'
  | '10min'
  | '15min'
  | '30min'
  | '1hour'
  | '1day';

export const VALID_TIMINGS: ReminderTiming[] = [
  'none',
  'atStart',
  '5min',
  '10min',
  '15min',
  '30min',
  '1hour',
  '1day',
];

// リマインダータイミングのオフセット (ミリ秒)
export const REMINDER_TIMING_OFFSETS: Record<Exclude<ReminderTiming, 'none'>, number> = {
  atStart: 0,
  '5min': 5 * 60 * 1000,
  '10min': 10 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000,
};

export interface ScheduleReminderInput {
  scheduleId: string;
  title: string;
  body: string;
  reminderTiming: Exclude<ReminderTiming, 'none'>;
  scheduleDate: string;
  scheduleStartTime: string;
  timezone: string;
}

/**
 * スケジュールリマインダーの入力データをバリデーションする
 * @param {unknown} data バリデーション対象のデータ
 * @return {ScheduleReminderInput} バリデーション済みの入力データ
 */
export function validateScheduleReminderInput(data: unknown): ScheduleReminderInput {
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'リクエストボディはオブジェクトである必要があります');
  }

  const input = data as Record<string, unknown>;
  const requiredFields = [
    'scheduleId',
    'title',
    'body',
    'reminderTiming',
    'scheduleDate',
    'scheduleStartTime',
    'timezone',
  ];

  for (const field of requiredFields) {
    if (!input[field] || typeof input[field] !== 'string') {
      throw new HttpsError('invalid-argument', `必須フィールドが不正です: ${field}`);
    }
  }

  if (
    input.reminderTiming === 'none' ||
    !VALID_TIMINGS.includes(input.reminderTiming as ReminderTiming)
  ) {
    throw new HttpsError('invalid-argument', `reminderTimingが不正です: ${input.reminderTiming}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.scheduleDate as string)) {
    throw new HttpsError('invalid-argument', 'scheduleDateはYYYY-MM-DD形式である必要があります');
  }

  if (!/^\d{2}:\d{2}$/.test(input.scheduleStartTime as string)) {
    throw new HttpsError('invalid-argument', 'scheduleStartTimeはHH:MM形式である必要があります');
  }

  return input as unknown as ScheduleReminderInput;
}

/**
 * スケジュール日時とリマインダータイミングからリマインダー送信時刻 (UTC) を計算する
 * @param {string} scheduleDate スケジュール日付 (YYYY-MM-DD)
 * @param {string} scheduleStartTime スケジュール開始時刻 (HH:MM)
 * @param {string} timezone タイムゾーン識別子
 * @param {Exclude<ReminderTiming, "none">} reminderTiming リマインダータイミング
 * @return {Date} リマインダー送信時刻 (UTC)
 */
export function calculateReminderTime(
  scheduleDate: string,
  scheduleStartTime: string,
  timezone: string,
  reminderTiming: Exclude<ReminderTiming, 'none'>
): Date {
  // ローカル時刻文字列をUTCとして仮に解釈し、タイムゾーンオフセットを計算する
  const naiveUTC = new Date(`${scheduleDate}T${scheduleStartTime}:00Z`);

  // naiveUTCを対象タイムゾーンで表示した場合の文字列を取得
  const tzFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const localStr = tzFormatter.format(naiveUTC).replace(' ', 'T');
  const naiveLocal = new Date(`${localStr}Z`);

  // オフセット (ms) = naiveLocal - naiveUTC
  const offset = naiveLocal.getTime() - naiveUTC.getTime();

  // 実際のUTC時刻 = ローカル時刻 (仮UTC) - オフセット
  const scheduleUTC = new Date(naiveUTC.getTime() - offset);

  // リマインダーオフセットを減算
  return new Date(scheduleUTC.getTime() - REMINDER_TIMING_OFFSETS[reminderTiming]);
}
