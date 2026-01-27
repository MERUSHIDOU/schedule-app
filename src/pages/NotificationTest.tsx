import { useEffect, useState } from 'react';
import {
  getNotificationPermission,
  isNotificationSupported,
  isPWAMode,
  requestNotificationPermission,
  showNotification,
} from '../utils/notification';

export function NotificationTest() {
  const [permission, setPermission] = useState<string>('unknown');
  const [supported, setSupported] = useState(false);
  const [pwaMode, setPwaMode] = useState(false);

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
    setPwaMode(isPWAMode());
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const handleShowNotification = () => {
    showNotification('テスト通知', {
      body: 'これはテスト通知です',
      icon: '/pwa-192x192.png',
      tag: 'test-notification',
      requireInteraction: false,
    });
  };

  const handleShowScheduleNotification = () => {
    showNotification('スケジュール通知', {
      body: '「会議」が5分後に開始されます',
      icon: '/pwa-192x192.png',
      tag: 'schedule-reminder',
      requireInteraction: true,
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>通知機能テストページ</h1>

      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <h2>環境情報</h2>
        <p>
          <strong>通知API対応:</strong>{' '}
          {supported ? '✅ サポートされています' : '❌ サポートされていません'}
        </p>
        <p>
          <strong>現在の許可状態:</strong> {permission}
        </p>
        <p>
          <strong>PWAモード:</strong> {pwaMode ? '✅ PWAとして起動中' : '❌ ブラウザで表示中'}
        </p>
        <p>
          <strong>ブラウザ:</strong> {navigator.userAgent}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>アクション</h2>

        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={handleRequestPermission}
            disabled={!supported || permission === 'granted'}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: supported && permission !== 'granted' ? 'pointer' : 'not-allowed',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            通知許可をリクエスト
          </button>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={handleShowNotification}
            disabled={permission !== 'granted'}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: permission === 'granted' ? 'pointer' : 'not-allowed',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            テスト通知を表示
          </button>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={handleShowScheduleNotification}
            disabled={permission !== 'granted'}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: permission === 'granted' ? 'pointer' : 'not-allowed',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            スケジュール通知を表示
          </button>
        </div>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
        <h3>ℹ️ 使い方</h3>
        <ol>
          <li>「通知許可をリクエスト」ボタンをクリック</li>
          <li>ブラウザのポップアップで「許可」を選択</li>
          <li>「テスト通知を表示」ボタンで通知をテスト</li>
        </ol>
        <p>
          <small>
            ※ 通知が表示されない場合、ブラウザの通知設定（システム設定）を確認してください
          </small>
        </p>
      </div>
    </div>
  );
}
