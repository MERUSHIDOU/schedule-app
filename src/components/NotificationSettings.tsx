import type { NotificationConfig, NotificationTiming } from '../types/notification';
import './NotificationSettings.css';

interface NotificationSettingsProps {
  value: NotificationConfig;
  onChange: (config: NotificationConfig) => void;
  disabled?: boolean;
}

function NotificationSettings({ value, onChange, disabled = false }: NotificationSettingsProps) {
  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      enabled: e.target.checked,
    });
  };

  const handleTimingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const timing = e.target.value as NotificationTiming;
    onChange({
      ...value,
      timing,
      customMinutes: timing === 'custom' ? value.customMinutes || 15 : undefined,
    });
  };

  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customMinutes = parseInt(e.target.value, 10);
    onChange({
      ...value,
      customMinutes: isNaN(customMinutes) ? 0 : customMinutes,
    });
  };

  return (
    <div className="notification-settings">
      <label className="notification-toggle">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={handleEnabledChange}
          disabled={disabled}
        />
        <span>通知を有効にする</span>
      </label>

      <div className="notification-timing">
        <label htmlFor="notification-timing-select">通知タイミング</label>
        <select
          id="notification-timing-select"
          value={value.timing}
          onChange={handleTimingChange}
          disabled={disabled || !value.enabled}
        >
          <option value="onTime">開始時刻ちょうど</option>
          <option value="5min">5分前</option>
          <option value="15min">15分前</option>
          <option value="30min">30分前</option>
          <option value="1hour">1時間前</option>
          <option value="custom">カスタム</option>
        </select>
      </div>

      {value.timing === 'custom' && (
        <div className="notification-custom">
          <label htmlFor="custom-minutes">通知時刻（分前）</label>
          <input
            id="custom-minutes"
            type="number"
            min="0"
            max="1440"
            value={value.customMinutes || 0}
            onChange={handleCustomMinutesChange}
            disabled={disabled || !value.enabled}
          />
        </div>
      )}
    </div>
  );
}

export default NotificationSettings;
