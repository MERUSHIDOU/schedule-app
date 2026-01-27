import './NotificationPermissionBanner.css';

interface NotificationPermissionBannerProps {
  onPermissionGranted: () => void;
  onDismiss: () => void;
}

function NotificationPermissionBanner({
  onPermissionGranted,
  onDismiss,
}: NotificationPermissionBannerProps) {
  return (
    <div className="notification-permission-banner">
      <div className="banner-content">
        <p className="banner-message">
          通知を有効にすると、スケジュールの開始時刻前にリマインダーを受け取れます
        </p>
        <div className="banner-actions">
          <button className="btn-enable" onClick={onPermissionGranted}>
            通知を有効にする
          </button>
          <button className="btn-dismiss" onClick={onDismiss}>
            後で
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPermissionBanner;
