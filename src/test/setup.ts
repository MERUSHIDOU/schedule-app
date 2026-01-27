import '@testing-library/jest-dom';

// Notification API のモック
class MockNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = async (): Promise<NotificationPermission> => {
    return MockNotification.permission;
  };

  title: string;
  options?: NotificationOptions;

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options;
  }
}

// グローバルに Notification をモック
globalThis.Notification = MockNotification as unknown as typeof Notification;
