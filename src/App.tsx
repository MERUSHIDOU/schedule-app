import { useState } from 'react';
import { Calendar } from './components/Calendar';
import { ScheduleList } from './components/ScheduleList';
import { ScheduleForm } from './components/ScheduleForm';
import { useSchedules } from './hooks/useSchedules';
import type { Schedule, ScheduleFormData } from './types/schedule';
import { formatDate } from './utils/date';
import './App.css';

function App() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const handleAddClick = () => {
    setEditingSchedule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('この予定を削除しますか？')) {
      deleteSchedule(id);
    }
  };

  const handleFormSubmit = (data: ScheduleFormData) => {
    if (editingSchedule) {
      updateSchedule(editingSchedule.id, data);
    } else {
      addSchedule(data);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>スケジュール</h1>
      </header>

      <main className="app-main">
        <Calendar
          schedules={schedules}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <ScheduleList
          schedules={schedules}
          selectedDate={selectedDate}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      <button className="fab" onClick={handleAddClick} aria-label="予定を追加">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <ScheduleForm
        isOpen={isFormOpen}
        schedule={editingSchedule}
        selectedDate={selectedDate}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default App;
