// Firebase Messaging Service Worker
// Firebase compat SDK を使用（importScripts で読み込み）
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js');

// Firebase 設定はビルド時または self.__firebase_config__ 経由で取得
// Service Worker は環境変数にアクセスできないため、
// アプリ側から postMessage で設定を受け取るか、ハードコードする必要がある
const firebaseConfig = self.__firebase_config__ || {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// Firebase初期化（未初期化時のみ）
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// バックグラウンドメッセージ受信時の処理
messaging.onBackgroundMessage(payload => {
  const notificationTitle = payload.notification?.title || 'スケジュールリマインダー';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/schedule-app/pwa-192x192.png',
    badge: '/schedule-app/pwa-192x192.png',
    data: payload.data || {},
    tag: payload.data?.scheduleId || 'reminder',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック時にアプリを開く
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = new URL('/schedule-app/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // 既存のウィンドウがあればフォーカスする
      for (const client of clientList) {
        if (client.url.startsWith(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // なければ新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
