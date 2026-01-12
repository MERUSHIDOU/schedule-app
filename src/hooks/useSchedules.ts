import { useState, useEffect, useCallback } from 'react';
import type { Schedule, ScheduleFormData } from '../types/schedule';
import { loadSchedules, saveSchedules, generateId } from '../utils/storage';

// スケジュールデータのCRUD
export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    setSchedules(loadSchedules());
  }, []);

  useEffect(() => {
    if (schedules.length > 0 || localStorage.getItem('schedule-app-data')) {
      saveSchedules(schedules);
    }
  }, [schedules]);

  // CREATE
  const addSchedule = useCallback((data: ScheduleFormData) => {
    const now = new Date().toISOString();
    const newSchedule: Schedule = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setSchedules(prev => [...prev, newSchedule]);
    return newSchedule;
  }, []);

  // UPDATE
  const updateSchedule = useCallback((id: string, data: ScheduleFormData) => {
    setSchedules(prev =>
      prev.map(schedule =>
        schedule.id === id
          ? { ...schedule, ...data, updatedAt: new Date().toISOString() }
          : schedule
      )
    );
  }, []);

  // DELETE
  const deleteSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  }, []);

  // READ
  const getSchedulesByDate = useCallback(
    (date: string) => {
      return schedules.filter(schedule => schedule.date === date);
    },
    [schedules]
  );

  return {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByDate,
  };
}
