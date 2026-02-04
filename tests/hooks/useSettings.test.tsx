import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../../src/hooks/useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('初期値がlocalStorageから読み込まれること（デフォルト）', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({ showHolidays: true });
  });

  it('初期値がlocalStorageから読み込まれること（保存済みデータ）', () => {
    localStorage.setItem('schedule-app-settings', JSON.stringify({ showHolidays: false }));

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({ showHolidays: false });
  });

  it('設定変更時にlocalStorageが更新されること', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ showHolidays: false });
    });

    expect(result.current.settings).toEqual({ showHolidays: false });

    const saved = localStorage.getItem('schedule-app-settings');
    expect(saved).toBe(JSON.stringify({ showHolidays: false }));
  });

  it('設定を複数回変更できること', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ showHolidays: false });
    });
    expect(result.current.settings.showHolidays).toBe(false);

    act(() => {
      result.current.updateSettings({ showHolidays: true });
    });
    expect(result.current.settings.showHolidays).toBe(true);

    const saved = localStorage.getItem('schedule-app-settings');
    expect(saved).toBe(JSON.stringify({ showHolidays: true }));
  });
});
