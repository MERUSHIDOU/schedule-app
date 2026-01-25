/**
 * 通知機能のユーティリティ関数
 */

/**
 * Notification APIがサポートされているかチェック
 */
export function isNotificationSupported(): boolean {
  return typeof Notification !== 'undefined';
}

/**
 * PWAモード（ホーム画面追加）で実行されているかチェック
 */
export function isPWAMode(): boolean {
  // display-mode: standalone のメディアクエリをチェック
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // iOS Safari の standalone モードをチェック
  // @ts-expect-error - iOS Safari専用プロパティ
  const isIOSStandalone = navigator.standalone === true;

  return isStandalone || isIOSStandalone;
}

/**
 * 現在の通知許可状態を取得
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  return Notification.permission;
}

/**
 * 通知許可をリクエスト
 */
export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * 通知を表示
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationSupported()) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  new Notification(title, options);
}
