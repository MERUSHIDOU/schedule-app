// カスタムService Worker拡張
// このファイルはvite-plugin-pwaが生成するService Workerにインポートされます

// 通知クリック時のハンドリング
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // 既に開いているウィンドウがあればフォーカス
      for (const client of clientList) {
        if (client.url.includes('/schedule-app') && 'focus' in client) {
          return client.focus();
        }
      }

      // 開いているウィンドウがなければ新しく開く
      if (clients.openWindow) {
        return clients.openWindow('/schedule-app/');
      }
    })
  );
});
