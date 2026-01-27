import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// テスト用のグローバル定数をモック
beforeEach(() => {
  vi.stubGlobal('__APP_VERSION__', '1.2.3');
  vi.stubGlobal('__BUILD_DATE__', '2026-01-28T12:34:56.789Z');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getVersionInfo', () => {
  it('version と buildDate を含むオブジェクトを返す', async () => {
    const { getVersionInfo } = await import('../../src/utils/version');
    const info = getVersionInfo();

    expect(info).toEqual({
      version: '1.2.3',
      buildDate: '2026-01-28T12:34:56.789Z',
    });
  });

  it('version プロパティが文字列である', async () => {
    const { getVersionInfo } = await import('../../src/utils/version');
    const info = getVersionInfo();

    expect(typeof info.version).toBe('string');
  });

  it('buildDate プロパティが ISO 8601 形式の文字列である', async () => {
    const { getVersionInfo } = await import('../../src/utils/version');
    const info = getVersionInfo();

    expect(info.buildDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('getFormattedVersion', () => {
  it('"v" プレフィックス付きのバージョン文字列を返す', async () => {
    const { getFormattedVersion } = await import('../../src/utils/version');
    const result = getFormattedVersion();

    expect(result).toBe('v1.2.3');
  });
});

describe('getFormattedBuildDate', () => {
  it('ISO 日時を "YYYY/MM/DD HH:MM" 形式にフォーマットする', async () => {
    const { getFormattedBuildDate } = await import('../../src/utils/version');
    const result = getFormattedBuildDate();

    // タイムゾーンに依存しない検証: フォーマットが正しいことを確認
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
  });

  it('UTC の日時を正しくフォーマットする', async () => {
    vi.stubGlobal('__BUILD_DATE__', '2026-06-15T09:05:00.000Z');

    // モジュールキャッシュをリセットして再読み込み
    vi.resetModules();
    const { getFormattedBuildDate } = await import('../../src/utils/version');
    const result = getFormattedBuildDate();

    // フォーマットパターンの検証
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
  });
});

describe('logVersionToConsole', () => {
  it('console.log にバージョン情報を出力する', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.resetModules();
    const { logVersionToConsole } = await import('../../src/utils/version');
    logVersionToConsole();

    expect(consoleSpy).toHaveBeenCalled();

    // バージョン番号が出力に含まれることを確認
    const allArgs = consoleSpy.mock.calls.flat().join(' ');
    expect(allArgs).toContain('1.2.3');

    consoleSpy.mockRestore();
  });

  it('ビルド日時が出力に含まれる', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.resetModules();
    const { logVersionToConsole } = await import('../../src/utils/version');
    logVersionToConsole();

    const allArgs = consoleSpy.mock.calls.flat().join(' ');
    expect(allArgs).toContain('2026');

    consoleSpy.mockRestore();
  });
});
