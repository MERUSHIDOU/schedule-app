import { useState } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import type { Schedule } from '../types/schedule';
import { formatDate, getMonthDays, getMonthName, isToday } from '../utils/date';
import { getHolidayName, getHolidaySchedules } from '../utils/holidays';
import './Calendar.css';

interface CalendarProps {
  schedules: Schedule[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  showHolidays?: boolean;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// カレンダーの1日分を表示するコンポーネント
interface CalendarDayProps {
  date: Date;
  month: number;
  selectedDate: string;
  daySchedules: Schedule[];
  showHolidays: boolean;
  onSelectDate: (date: string) => void;
}

function CalendarDay({
  date,
  month,
  selectedDate,
  daySchedules,
  showHolidays,
  onSelectDate,
}: CalendarDayProps) {
  const dateStr = formatDate(date);
  const isCurrentMonth = date.getMonth() === month;
  const isSunday = date.getDay() === 0;
  const isSaturday = date.getDay() === 6;
  const holidayName = showHolidays ? getHolidayName(dateStr) : null;
  const isHoliday = holidayName !== null;

  return (
    <button
      type="button"
      className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${
        isToday(date) ? 'today' : ''
      } ${selectedDate === dateStr ? 'selected' : ''} ${
        isSunday ? 'sunday' : ''
      } ${isSaturday ? 'saturday' : ''} ${isHoliday ? 'holiday' : ''}`}
      onClick={() => onSelectDate(dateStr)}
      data-date={dateStr}
    >
      <span className="day-number">{date.getDate()}</span>
      {daySchedules.length > 0 && (
        <div className="schedule-dots">
          {daySchedules.slice(0, 3).map(schedule => (
            <span
              key={schedule.id}
              className="schedule-dot"
              style={{ backgroundColor: schedule.color }}
            />
          ))}
          {daySchedules.length > 3 && (
            <span className="more-indicator">+{daySchedules.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}

// 月間カレンダー表示
export function Calendar({
  schedules,
  selectedDate,
  onSelectDate,
  showHolidays = true,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);

  // < 先月へ戻る
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // > 来月へ飛ぶ
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 今日へ飛ぶ
  const goToToday = () => {
    setCurrentDate(new Date());
    onSelectDate(formatDate(new Date()));
  };

  // スワイプハンドラの設定
  const swipeHandlers = useSwipe(
    goToNextMonth, // 左スワイプで次月
    goToPrevMonth, // 右スワイプで前月
    { threshold: 50, velocityThreshold: 0.3 }
  );

  /**
   * 指定された日付のスケジュールを取得（祝日を含む）
   * @param date
   * @returns
   */
  const getSchedulesForDay = (date: Date) => {
    const dateStr = formatDate(date);
    const userSchedules = schedules.filter(s => s.date === dateStr);

    if (showHolidays) {
      const holidaySchedules = getHolidaySchedules(dateStr);
      return [...holidaySchedules, ...userSchedules];
    }

    return userSchedules;
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" className="nav-btn" onClick={goToPrevMonth} aria-label="前月">
          &#8249;
        </button>
        <h2 className="month-title">{getMonthName(year, month)}</h2>
        <button type="button" className="nav-btn" onClick={goToNextMonth} aria-label="次月">
          &#8250;
        </button>
        <button type="button" className="today-btn" onClick={goToToday}>
          今日
        </button>
      </div>

      <div className="weekday-header">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`weekday ${index === 0 ? 'sunday' : ''} ${index === 6 ? 'saturday' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: CSS Gridレイアウトが必要なため、tableは使用できません */}
      <div
        className="calendar-grid"
        role="grid"
        aria-label="カレンダー。左右にスワイプで月を移動できます"
        onTouchStart={e => swipeHandlers.onTouchStart(e.nativeEvent)}
        onTouchMove={e => swipeHandlers.onTouchMove(e.nativeEvent)}
        onTouchEnd={e => swipeHandlers.onTouchEnd(e.nativeEvent)}
      >
        {days.map((date, index) => (
          <CalendarDay
            key={index}
            date={date}
            month={month}
            selectedDate={selectedDate}
            daySchedules={getSchedulesForDay(date)}
            showHolidays={showHolidays}
            onSelectDate={onSelectDate}
          />
        ))}
      </div>
    </div>
  );
}
