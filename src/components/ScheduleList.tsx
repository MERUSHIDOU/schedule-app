import type { Schedule } from '../types/schedule';
import { formatDisplayDate } from '../utils/date';
import './ScheduleList.css';

interface ScheduleListProps {
  schedules: Schedule[];
  selectedDate: string;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}

export function ScheduleList({ schedules, selectedDate, onEdit, onDelete }: ScheduleListProps) {
  const filteredSchedules = schedules
    .filter(s => s.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="schedule-list">
      <h3 className="list-title">{formatDisplayDate(selectedDate)}</h3>

      {filteredSchedules.length === 0 ? (
        <p className="no-schedules">予定がありません</p>
      ) : (
        <ul className="schedules">
          {filteredSchedules.map(schedule => (
            <li key={schedule.id} className="schedule-item">
              <div
                className="schedule-color-bar"
                style={{ backgroundColor: schedule.color }}
              />
              <div className="schedule-content">
                <div className="schedule-time">
                  {schedule.startTime} - {schedule.endTime}
                </div>
                <h4 className="schedule-title">{schedule.title}</h4>
                {schedule.description && (
                  <p className="schedule-description">{schedule.description}</p>
                )}
              </div>
              <div className="schedule-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => onEdit(schedule)}
                  aria-label="編集"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => onDelete(schedule.id)}
                  aria-label="削除"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
