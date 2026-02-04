import { useCallback, useState } from 'react';
import type { AppSettings } from '../types/schedule';
import { loadSettings } from '../utils/storage';

/**
 * アプリケーション設定を管理するカスタムフック
 * 設定項目がなくなったため、空オブジェクトを返すのみ
 */
export function useSettings() {
  const [settings] = useState<AppSettings>(() => loadSettings());

  // 設定項目がなくなったため、更新機能は無効化
  const updateSettings = useCallback((_newSettings: AppSettings) => {
    // 何もしない
  }, []);

  return {
    settings,
    updateSettings,
  };
}
