import { holidays } from '../data/holidays';
import type { Schedule } from '../types/schedule';

const HOLIDAY_COLOR = '#e74c3c';

/**
 * 指定した日付の祝日名を取得する
 * @param dateStr - YYYY-MM-DD形式の日付文字列
 * @returns 祝日名、祝日でない場合はnull
 */
export function getHolidayName(dateStr: string): string | null {
  return holidays[dateStr] ?? null;
}

/**
 * 指定した日付が祝日かどうかを判定する
 * @param dateStr - YYYY-MM-DD形式の日付文字列
 * @returns 祝日の場合true、それ以外はfalse
 */
export function isHoliday(dateStr: string): boolean {
  return dateStr in holidays;
}

/**
 * 指定した年月の祝日一覧を取得する
 * @param year - 年（例: 2024）
 * @param month - 月（1-12）
 * @returns 祝日の日付と名前のマップ
 */
export function getHolidaysInMonth(year: number, month: number): Record<string, string> {
  // 無効な月の場合は空オブジェクトを返す
  if (month < 1 || month > 12) {
    return {};
  }

  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}-`;

  const result: Record<string, string> = {};

  Object.entries(holidays).forEach(([dateStr, holidayName]) => {
    if (dateStr.startsWith(prefix)) {
      result[dateStr] = holidayName;
    }
  });

  return result;
}

/**
 * 指定した日付の祝日をScheduleオブジェクトとして取得する
 * @param dateStr - YYYY-MM-DD形式の日付文字列
 * @returns 祝日のSchedule配列（祝日でない場合は空配列）
 */
export function getHolidaySchedules(dateStr: string): Schedule[] {
  const name = getHolidayName(dateStr);
  if (!name) return [];

  return [
    {
      id: `holiday-${dateStr}`,
      title: name,
      description: '',
      date: dateStr,
      startTime: '00:00',
      endTime: '23:59',
      color: HOLIDAY_COLOR,
      createdAt: '',
      updatedAt: '',
      isHoliday: true,
    },
  ];
}

/**
 * 指定した年月の祝日をScheduleオブジェクトの配列として取得する
 * @param year - 年（例: 2024）
 * @param month - 月（1-12）
 * @returns 祝日のSchedule配列
 */
export function getHolidaySchedulesInMonth(year: number, month: number): Schedule[] {
  const holidaysInMonth = getHolidaysInMonth(year, month);

  return Object.keys(holidaysInMonth).map(dateStr => ({
    id: `holiday-${dateStr}`,
    title: holidaysInMonth[dateStr],
    description: '',
    date: dateStr,
    startTime: '00:00',
    endTime: '23:59',
    color: HOLIDAY_COLOR,
    createdAt: '',
    updatedAt: '',
    isHoliday: true,
  }));
}
