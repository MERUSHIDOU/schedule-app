import { describe, expect, it } from 'vitest';
import { getHolidayName, getHolidaysInMonth, isHoliday } from '../../src/utils/holidays';

describe('holidays utils', () => {
  describe('getHolidayName', () => {
    it('祝日の日付で祝日名を返すこと', () => {
      expect(getHolidayName('2024-01-01')).toBe('元日');
      expect(getHolidayName('2024-02-11')).toBe('建国記念の日');
      expect(getHolidayName('2025-01-13')).toBe('成人の日');
    });

    it('祝日でない日付でnullを返すこと', () => {
      expect(getHolidayName('2024-01-02')).toBeNull();
      expect(getHolidayName('2024-06-15')).toBeNull();
      expect(getHolidayName('2024-12-25')).toBeNull();
    });

    it('範囲外の年（2023年）でnullを返すこと', () => {
      expect(getHolidayName('2023-01-01')).toBeNull();
    });

    it('範囲外の年（2031年）でnullを返すこと', () => {
      expect(getHolidayName('2031-01-01')).toBeNull();
    });

    it('無効な日付形式でnullを返すこと', () => {
      expect(getHolidayName('invalid-date')).toBeNull();
      expect(getHolidayName('2024/01/01')).toBeNull();
    });
  });

  describe('isHoliday', () => {
    it('祝日の日付でtrueを返すこと', () => {
      expect(isHoliday('2024-01-01')).toBe(true);
      expect(isHoliday('2024-02-11')).toBe(true);
      expect(isHoliday('2025-01-13')).toBe(true);
    });

    it('祝日でない日付でfalseを返すこと', () => {
      expect(isHoliday('2024-01-02')).toBe(false);
      expect(isHoliday('2024-06-15')).toBe(false);
      expect(isHoliday('2024-12-25')).toBe(false);
    });

    it('範囲外の年でfalseを返すこと', () => {
      expect(isHoliday('2023-01-01')).toBe(false);
      expect(isHoliday('2031-01-01')).toBe(false);
    });

    it('無効な日付形式でfalseを返すこと', () => {
      expect(isHoliday('invalid-date')).toBe(false);
      expect(isHoliday('2024/01/01')).toBe(false);
    });
  });

  describe('getHolidaysInMonth', () => {
    it('2024年1月の祝日を返すこと', () => {
      const result = getHolidaysInMonth(2024, 1);
      expect(result).toEqual({
        '2024-01-01': '元日',
        '2024-01-08': '成人の日',
      });
    });

    it('2024年5月の祝日を返すこと（複数の祝日）', () => {
      const result = getHolidaysInMonth(2024, 5);
      expect(result).toEqual({
        '2024-05-03': '憲法記念日',
        '2024-05-04': 'みどりの日',
        '2024-05-05': 'こどもの日',
        '2024-05-06': 'こどもの日 振替休日',
      });
    });

    it('祝日がない月で空オブジェクトを返すこと', () => {
      const result = getHolidaysInMonth(2024, 6);
      expect(result).toEqual({});
    });

    it('範囲外の年で空オブジェクトを返すこと', () => {
      const result = getHolidaysInMonth(2023, 1);
      expect(result).toEqual({});
    });

    it('無効な月（0）で空オブジェクトを返すこと', () => {
      const result = getHolidaysInMonth(2024, 0);
      expect(result).toEqual({});
    });

    it('無効な月（13）で空オブジェクトを返すこと', () => {
      const result = getHolidaysInMonth(2024, 13);
      expect(result).toEqual({});
    });
  });
});
