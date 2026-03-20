import { useState } from 'react';
import type { UseFCMResult } from '../hooks/useFCM';
import type { Schedule } from '../types/schedule';
import { isIOSSafari, isPWA } from '../utils/fcm';
import { isFirebaseConfigured } from '../utils/firebase';
import './FCMPermissionBanner.css';

const SESSION_STORAGE_KEY = 'fcm-banner-dismissed';

interface FCMPermissionBannerProps {
  schedules: Schedule[];
  useFCMResult: UseFCMResult;
}

// FCM通知権限を促すバナーコンポーネント
export function FCMPermissionBanner({ schedules, useFCMResult }: FCMPermissionBannerProps) {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true'
  );

  const { isRegistered, isLoading, requestPermissionAndRegister } = useFCMResult;

  // 表示条件チェック
  if (!isFirebaseConfigured()) {
    return null;
  }

  // Notification API が利用不可
  if (typeof Notification === 'undefined') {
    return null;
  }

  // 既に権限が決定済み（granted または denied）
  if (Notification.permission !== 'default') {
    return null;
  }

  // 既に登録済み
  if (isRegistered) {
    return null;
  }

  // ユーザーが「後で」を押した
  if (dismissed) {
    return null;
  }

  // リマインダーが設定されているスケジュールが1件もない
  const hasReminderSchedule = schedules.some(
    s => s.reminder !== undefined && s.reminder !== 'none'
  );
  if (!hasReminderSchedule) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setDismissed(true);
  };

  const handleEnable = () => {
    requestPermissionAndRegister();
  };

  // iOS Safari で PWA でない場合はホーム画面追加の案内を表示
  const showIOSGuide = !isPWA() && isIOSSafari();

  return (
    <div className="fcm-permission-banner">
      <p className="fcm-permission-banner__message">
        リマインダー通知を受け取るには通知を有効にしてください。
      </p>
      {showIOSGuide && (
        <p className="fcm-permission-banner__ios-guide">
          iOSでバックグラウンド通知を受け取るには、ホーム画面に追加してアプリとして起動してください。
        </p>
      )}
      <div className="fcm-permission-banner__actions">
        <button
          type="button"
          className="fcm-permission-banner__enable-btn"
          onClick={handleEnable}
          disabled={isLoading}
        >
          通知を有効にする
        </button>
        <button type="button" className="fcm-permission-banner__later-btn" onClick={handleDismiss}>
          後で
        </button>
      </div>
    </div>
  );
}
