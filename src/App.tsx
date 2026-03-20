import { useState } from 'react';
import { Calendar } from './components/Calendar';
import { FCMPermissionBanner } from './components/FCMPermissionBanner';
import { ScheduleForm } from './components/ScheduleForm';
import { ScheduleList } from './components/ScheduleList';
import { VersionInfo } from './components/VersionInfo';
import { useCloudReminder } from './hooks/useCloudReminder';
import { useFCM } from './hooks/useFCM';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useSchedules } from './hooks/useSchedules';
import type { Schedule, ScheduleFormData } from './types/schedule';
import { formatDate } from './utils/date';
import './App.css';

function App() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Firebase 匿名認証
  const { userId } = useFirebaseAuth();
  // FCM トークン管理
  const fcmResult = useFCM(userId);
  // Cloud リマインダー CRUD
  const {
    createReminder,
    cancelReminder,
    updateReminder,
    loading: isReminderLoading,
  } = useCloudReminder();

  // 予定追加ボタンを押したとき
  const handleAddClick = () => {
    setEditingSchedule(null);
    setIsFormOpen(true);
  };

  // 既存スケジュールの編集ボタン押したとき
  const handleEdit = (schedule: Schedule) => {
    // 祝日は編集不可（防御的プログラミング）
    if (schedule.isHoliday) return;
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  // 既存スケジュールの削除ボタンを押したとき
  const handleDelete = async (id: string) => {
    // 祝日は削除不可（防御的プログラミング）
    if (id.startsWith('holiday-')) return;
    if (window.confirm('この予定を削除しますか？')) {
      const schedule = schedules.find(s => s.id === id);
      if (schedule?.reminderId) {
        await cancelReminder(schedule.reminderId);
      }
      deleteSchedule(id);
    }
  };

  // スケジュール作成フォームで追加ボタンを押したとき
  const handleFormSubmit = async (data: ScheduleFormData) => {
    if (editingSchedule) {
      updateSchedule(editingSchedule.id, data);
      // 編集時のリマインダー更新
      const updatedSchedule: Schedule = {
        ...editingSchedule,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      if (updatedSchedule.reminder && updatedSchedule.reminder !== 'none') {
        const reminderId = await updateReminder(updatedSchedule);
        if (reminderId) {
          updateSchedule(editingSchedule.id, { ...data, reminderId } as ScheduleFormData & {
            reminderId: string;
          });
        }
      } else if (editingSchedule.reminderId) {
        // リマインダーが「なし」に変更された場合はキャンセル
        await cancelReminder(editingSchedule.reminderId);
        updateSchedule(editingSchedule.id, {
          ...data,
          reminderId: undefined,
        } as ScheduleFormData & { reminderId: undefined });
      }
    } else {
      const newSchedule = addSchedule(data);
      // 新規作成時のリマインダー登録
      if (newSchedule.reminder && newSchedule.reminder !== 'none') {
        const reminderId = await createReminder(newSchedule);
        if (reminderId) {
          updateSchedule(newSchedule.id, { ...data, reminderId } as ScheduleFormData & {
            reminderId: string;
          });
        }
      }
    }
  };

  // スケジュール作成フォームで閉じるボタンを押したとき
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>スケジュール</h1>
        <VersionInfo />
      </header>

      <FCMPermissionBanner schedules={schedules} useFCMResult={fcmResult} />

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

      <button type="button" className="fab" onClick={handleAddClick} aria-label="予定を追加">
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
        isReminderLoading={isReminderLoading}
      />
    </div>
  );
}

export default App;
