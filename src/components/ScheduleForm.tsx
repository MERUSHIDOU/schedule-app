import { useEffect, useState } from 'react';
import type { NotificationConfig } from '../types/notification';
import type { Schedule, ScheduleFormData } from '../types/schedule';
import NotificationSettings from './NotificationSettings';
import './ScheduleForm.css';

interface ScheduleFormProps {
  isOpen: boolean;
  schedule?: Schedule | null;
  selectedDate: string;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => void;
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

const initialFormData: ScheduleFormData = {
  title: '',
  description: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  color: COLORS[0],
  notification: {
    timing: '15min',
  },
};

// 10分刻みの時刻オプションを生成
const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// 開始時刻から1時間後の時刻を計算する（24時をまたぐ場合も対応）
const calculateEndTime = (startTime: string): string => {
  const [hour, minute] = startTime.split(':').map(Number);
  const startDate = new Date(2000, 0, 1, hour, minute);
  startDate.setHours(startDate.getHours() + 1);

  const endHour = startDate.getHours().toString().padStart(2, '0');
  const endMinute = startDate.getMinutes().toString().padStart(2, '0');

  return `${endHour}:${endMinute}`;
};

// スケジュール編集フォーム
export function ScheduleForm({
  isOpen,
  schedule,
  selectedDate,
  onClose,
  onSubmit,
}: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(initialFormData);
  const [timeError, setTimeError] = useState<string>('');

  useEffect(() => {
    if (schedule) {
      // 編集モード
      setFormData({
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        color: schedule.color,
        notification: schedule.notification || {
          timing: 'onTime',
        },
      });
    } else {
      // 新規作成モード
      setFormData({
        ...initialFormData,
        date: selectedDate,
      });
    }
    // フォームが開かれたときにエラーをクリア
    setTimeError('');
  }, [schedule, selectedDate]);

  // 時刻のバリデーション関数
  const validateTime = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return '';

    // 時刻を分単位に変換して比較
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    // 終了時刻が開始時刻より早い場合は翌日と解釈（24時をまたぐケース）
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // 翌日として24時間分を加算
    }

    if (startMinutes >= endMinutes) {
      return '開始時刻は終了時刻よりも前に設定してください';
    }

    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // 送信前に時刻のバリデーションを実行
    const error = validateTime(formData.startTime, formData.endTime);
    if (error) {
      setTimeError(error);
      return;
    }

    onSubmit(formData);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    // 新規作成モードで開始時刻を変更した場合、終了時刻を自動設定
    if (!schedule && name === 'startTime') {
      const autoEndTime = calculateEndTime(value);
      updatedFormData = { ...updatedFormData, endTime: autoEndTime };
    }

    setFormData(updatedFormData);

    // 時刻フィールドの変更時にバリデーション
    if (name === 'startTime' || name === 'endTime') {
      const error = validateTime(updatedFormData.startTime, updatedFormData.endTime);
      setTimeError(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{schedule ? '予定を編集' : '新しい予定'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="閉じる">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">タイトル *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="予定のタイトル"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">日付</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">開始時刻</label>
              <select
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              >
                {TIME_OPTIONS.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="endTime">終了時刻</label>
              <select
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              >
                {TIME_OPTIONS.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {timeError && (
            <div className="error-message" role="alert">
              {timeError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description">説明</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="予定の詳細（任意）"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>通知設定</label>
            <NotificationSettings
              value={formData.notification || { timing: 'onTime' }}
              onChange={(notification: NotificationConfig) =>
                setFormData(prev => ({ ...prev, notification }))
              }
            />
          </div>

          <div className="form-group">
            <label>カラー</label>
            <div className="color-picker">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  aria-label={`色: ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn-submit" disabled={!!timeError}>
              {schedule ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
