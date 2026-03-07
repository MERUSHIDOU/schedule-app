import { calculateReminderTime, validateScheduleReminderInput } from '../../src/utils/validators';

describe('validateScheduleReminderInput', () => {
  const validInput = {
    scheduleId: 'schedule-123',
    title: '会議のリマインダー',
    body: '14:00 - 15:00 会議',
    reminderTiming: '30min',
    scheduleDate: '2026-02-10',
    scheduleStartTime: '14:00',
    timezone: 'Asia/Tokyo',
  };

  it('正常な入力を受け付ける', () => {
    expect(() => validateScheduleReminderInput(validInput)).not.toThrow();
    const result = validateScheduleReminderInput(validInput);
    expect(result.scheduleId).toBe('schedule-123');
    expect(result.reminderTiming).toBe('30min');
  });

  it('nullを渡すとエラー', () => {
    expect(() => validateScheduleReminderInput(null)).toThrow();
  });

  it('必須フィールドが欠けているとエラー', () => {
    const { scheduleId: _removed, ...withoutId } = validInput;
    expect(() => validateScheduleReminderInput(withoutId)).toThrow('scheduleId');
  });

  it("reminderTiming が 'none' の場合はエラー", () => {
    expect(() => validateScheduleReminderInput({ ...validInput, reminderTiming: 'none' })).toThrow(
      'reminderTiming'
    );
  });

  it('無効な reminderTiming はエラー', () => {
    expect(() =>
      validateScheduleReminderInput({
        ...validInput,
        reminderTiming: 'invalid',
      })
    ).toThrow('reminderTiming');
  });

  it('scheduleDate のフォーマット不正はエラー', () => {
    expect(() =>
      validateScheduleReminderInput({
        ...validInput,
        scheduleDate: '2026/02/10',
      })
    ).toThrow('scheduleDate');
  });

  it('scheduleStartTime のフォーマット不正はエラー', () => {
    expect(() =>
      validateScheduleReminderInput({
        ...validInput,
        scheduleStartTime: '14:00:00',
      })
    ).toThrow('scheduleStartTime');
  });

  it('全ての有効な reminderTiming を受け付ける', () => {
    const validTimings = ['atStart', '5min', '10min', '15min', '30min', '1hour', '1day'];
    for (const timing of validTimings) {
      expect(() =>
        validateScheduleReminderInput({ ...validInput, reminderTiming: timing })
      ).not.toThrow();
    }
  });
});

describe('calculateReminderTime', () => {
  it('Asia/Tokyo (UTC+9) で 14:00 の atStart は 05:00 UTC', () => {
    const result = calculateReminderTime('2026-02-10', '14:00', 'Asia/Tokyo', 'atStart');
    // 14:00 JST = 05:00 UTC
    expect(result.toISOString()).toBe('2026-02-10T05:00:00.000Z');
  });

  it('30min 前の場合は 04:30 UTC', () => {
    const result = calculateReminderTime('2026-02-10', '14:00', 'Asia/Tokyo', '30min');
    // 14:00 JST - 30min = 13:30 JST = 04:30 UTC
    expect(result.toISOString()).toBe('2026-02-10T04:30:00.000Z');
  });

  it('1hour 前の場合は 04:00 UTC', () => {
    const result = calculateReminderTime('2026-02-10', '14:00', 'Asia/Tokyo', '1hour');
    expect(result.toISOString()).toBe('2026-02-10T04:00:00.000Z');
  });

  it('1day 前の場合は前日の 05:00 UTC', () => {
    const result = calculateReminderTime('2026-02-10', '14:00', 'Asia/Tokyo', '1day');
    expect(result.toISOString()).toBe('2026-02-09T05:00:00.000Z');
  });

  it('5min 前', () => {
    const result = calculateReminderTime('2026-02-10', '14:00', 'Asia/Tokyo', '5min');
    expect(result.toISOString()).toBe('2026-02-10T04:55:00.000Z');
  });

  it('UTC タイムゾーンでも正しく計算される', () => {
    const result = calculateReminderTime('2026-02-10', '14:00', 'UTC', '30min');
    // 14:00 UTC - 30min = 13:30 UTC
    expect(result.toISOString()).toBe('2026-02-10T13:30:00.000Z');
  });
});
