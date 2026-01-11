import { useState, useEffect, useCallback } from 'react';
import type { Schedule, ScheduleFormData } from '../types/schedule';
import { loadSchedules, saveSchedules, generateId } from '../utils/storage';

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

  const addSchedule = useCallback((data: ScheduleFormData) => {
    const now = new Date().toISOString();
    const newSchedule: Schedule = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    setSchedules(prev => [...prev, newSchedule]);
    return newSchedule;
  }, []);

  const updateSchedule = useCallback((id: string, data: ScheduleFormData) => {
    setSchedules(prev =>
      prev.map(schedule =>
        schedule.id === id
          ? { ...schedule, ...data, updatedAt: new Date().toISOString() }
          : schedule
      )
    );
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  }, []);

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
    getSchedulesByDate
  };
}
