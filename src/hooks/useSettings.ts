import { useCallback, useEffect, useState } from 'react';
import type { AppSettings } from '../types/schedule';
import { loadSettings, saveSettings } from '../utils/storage';

/**
 * アプリケーション設定を管理するカスタムフック
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
  }, []);

  return {
    settings,
    updateSettings,
  };
}
