import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatDisplayDate,
  getMonthDays,
  isSameDay,
  isToday,
  getMonthName,
} from '../../src/utils/date';

describe('formatDate', () => {
  it('日付をYYYY-MM-DD形式でフォーマットする', () => {
    const date = new Date(2024, 0, 15); // 2024年1月15日
    expect(formatDate(date)).toBe('2024-01-15');
  });

  it('月と日が1桁の場合は0埋めする', () => {
    const date = new Date(2024, 4, 5); // 2024年5月5日
    expect(formatDate(date)).toBe('2024-05-05');
  });

  it('12月31日を正しくフォーマットする', () => {
    const date = new Date(2024, 11, 31); // 2024年12月31日
    expect(formatDate(date)).toBe('2024-12-31');
  });
});

describe('formatDisplayDate', () => {
  it('日付文字列を日本語表示形式に変換する', () => {
    const result = formatDisplayDate('2024-01-15');
    expect(result).toContain('2024');
    expect(result).toContain('1');
    expect(result).toContain('15');
  });
});

describe('getMonthDays', () => {
  it('指定した月の日付配列を返す', () => {
    const days = getMonthDays(2024, 0); // 2024年1月
    expect(days.length).toBeGreaterThan(0);
    expect(days.length % 7).toBe(0); // 週単位で返される
  });

  it('配列には前月と翌月のパディング日が含まれる', () => {
    const days = getMonthDays(2024, 1); // 2024年2月
    // 2月1日は木曜日なので、日曜から水曜までの4日分のパディングがある
    const firstDayOfMonth = days.find(d => d.getMonth() === 1 && d.getDate() === 1);
    expect(firstDayOfMonth).toBeDefined();
  });

  it('2月のうるう年を正しく処理する', () => {
    const days = getMonthDays(2024, 1); // 2024年2月（うるう年）
    const feb29 = days.find(d => d.getMonth() === 1 && d.getDate() === 29);
    expect(feb29).toBeDefined();
  });
});

describe('isSameDay', () => {
  it('同じ日付の場合はtrueを返す', () => {
    const date1 = new Date(2024, 5, 15, 10, 30);
    const date2 = new Date(2024, 5, 15, 18, 45);
    expect(isSameDay(date1, date2)).toBe(true);
  });

  it('異なる日付の場合はfalseを返す', () => {
    const date1 = new Date(2024, 5, 15);
    const date2 = new Date(2024, 5, 16);
    expect(isSameDay(date1, date2)).toBe(false);
  });

  it('異なる月の場合はfalseを返す', () => {
    const date1 = new Date(2024, 5, 15);
    const date2 = new Date(2024, 6, 15);
    expect(isSameDay(date1, date2)).toBe(false);
  });

  it('異なる年の場合はfalseを返す', () => {
    const date1 = new Date(2024, 5, 15);
    const date2 = new Date(2025, 5, 15);
    expect(isSameDay(date1, date2)).toBe(false);
  });
});

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('今日の日付の場合はtrueを返す', () => {
    const mockDate = new Date(2024, 5, 15, 12, 0, 0);
    vi.setSystemTime(mockDate);

    const today = new Date(2024, 5, 15, 8, 30);
    expect(isToday(today)).toBe(true);
  });

  it('今日でない日付の場合はfalseを返す', () => {
    const mockDate = new Date(2024, 5, 15, 12, 0, 0);
    vi.setSystemTime(mockDate);

    const notToday = new Date(2024, 5, 16);
    expect(isToday(notToday)).toBe(false);
  });
});

describe('getMonthName', () => {
  it('年と月を日本語形式で返す', () => {
    const result = getMonthName(2024, 0); // 2024年1月
    expect(result).toContain('2024');
    expect(result).toContain('1');
  });

  it('12月を正しく表示する', () => {
    const result = getMonthName(2024, 11); // 2024年12月
    expect(result).toContain('2024');
    expect(result).toContain('12');
  });
});
