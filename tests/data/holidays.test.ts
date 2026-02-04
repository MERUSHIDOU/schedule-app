import { describe, expect, it } from 'vitest';
import { holidays } from '../../src/data/holidays';

describe('holidays data', () => {
  it('2024年の祝日が定義されていること', () => {
    expect(holidays['2024-01-01']).toBe('元日');
    expect(holidays['2024-02-11']).toBe('建国記念の日');
    expect(holidays['2024-02-12']).toBe('建国記念の日 振替休日');
    expect(holidays['2024-02-23']).toBe('天皇誕生日');
    expect(holidays['2024-03-20']).toBe('春分の日');
    expect(holidays['2024-04-29']).toBe('昭和の日');
    expect(holidays['2024-05-03']).toBe('憲法記念日');
    expect(holidays['2024-05-04']).toBe('みどりの日');
    expect(holidays['2024-05-05']).toBe('こどもの日');
    expect(holidays['2024-05-06']).toBe('こどもの日 振替休日');
    expect(holidays['2024-07-15']).toBe('海の日');
    expect(holidays['2024-08-11']).toBe('山の日');
    expect(holidays['2024-08-12']).toBe('山の日 振替休日');
    expect(holidays['2024-09-16']).toBe('敬老の日');
    expect(holidays['2024-09-22']).toBe('秋分の日');
    expect(holidays['2024-09-23']).toBe('秋分の日 振替休日');
    expect(holidays['2024-10-14']).toBe('スポーツの日');
    expect(holidays['2024-11-03']).toBe('文化の日');
    expect(holidays['2024-11-04']).toBe('文化の日 振替休日');
    expect(holidays['2024-11-23']).toBe('勤労感謝の日');
  });

  it('2025年の祝日が定義されていること', () => {
    expect(holidays['2025-01-01']).toBe('元日');
    expect(holidays['2025-01-13']).toBe('成人の日');
    expect(holidays['2025-02-11']).toBe('建国記念の日');
    expect(holidays['2025-02-23']).toBe('天皇誕生日');
    expect(holidays['2025-02-24']).toBe('天皇誕生日 振替休日');
    expect(holidays['2025-03-20']).toBe('春分の日');
  });

  it('2026年の祝日が定義されていること', () => {
    expect(holidays['2026-01-01']).toBe('元日');
    expect(holidays['2026-01-12']).toBe('成人の日');
    expect(holidays['2026-02-11']).toBe('建国記念の日');
  });

  it('すべてのキーがYYYY-MM-DD形式であること', () => {
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    Object.keys(holidays).forEach(dateStr => {
      expect(dateStr).toMatch(dateFormatRegex);
    });
  });

  it('祝日でない日付が含まれていないこと', () => {
    // 通常の平日が含まれていないことを確認
    expect(holidays['2024-01-02']).toBeUndefined();
    expect(holidays['2024-06-15']).toBeUndefined();
    expect(holidays['2024-12-25']).toBeUndefined();
  });
});
