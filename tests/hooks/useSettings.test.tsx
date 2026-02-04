import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../../src/hooks/useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('空の設定オブジェクトを返す', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({});
  });

  it('設定の更新は何も行わない', () => {
    const { result } = renderHook(() => useSettings());

    // updateSettingsは存在するが何もしない
    result.current.updateSettings({});

    expect(result.current.settings).toEqual({});
  });
});
