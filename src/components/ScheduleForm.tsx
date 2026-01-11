import { useState, useEffect } from 'react';
import type { Schedule, ScheduleFormData } from '../types/schedule';
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
  '#84cc16'
];

const initialFormData: ScheduleFormData = {
  title: '',
  description: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  color: COLORS[0]
};

export function ScheduleForm({
  isOpen,
  schedule,
  selectedDate,
  onClose,
  onSubmit
}: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(initialFormData);

  useEffect(() => {
    if (schedule) {
      setFormData({
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        color: schedule.color
      });
    } else {
      setFormData({
        ...initialFormData,
        date: selectedDate
      });
    }
  }, [schedule, selectedDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
              autoFocus
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
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">終了時刻</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

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
            <button type="submit" className="btn-submit">
              {schedule ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
