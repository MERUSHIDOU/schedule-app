import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSchedules } from '../../src/hooks/useSchedules';
import type { ScheduleFormData } from '../../src/types/schedule';
import * as storage from '../../src/utils/storage';

// storageモジュールをモック
vi.mock('../../src/utils/storage', () => ({
  loadSchedules: vi.fn(),
  saveSchedules: vi.fn(),
  generateId: vi.fn(),
  hasStorageData: vi.fn(),
}));

const mockScheduleData: ScheduleFormData = {
  title: 'テスト予定',
  description: 'テスト説明',
  date: '2024-06-15',
  startTime: '10:00',
  endTime: '11:00',
  color: '#3b82f6',
};

describe('useSchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (storage.loadSchedules as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (storage.hasStorageData as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (storage.generateId as ReturnType<typeof vi.fn>).mockReturnValue('test-id-123');
  });

  describe('初期化', () => {
    it('初期状態で空の配列を返す', () => {
      const { result } = renderHook(() => useSchedules());
      expect(result.current.schedules).toEqual([]);
    });

    it('マウント時にlocalStorageからスケジュールを読み込む', async () => {
      const mockSchedules = [
        {
          id: '1',
          ...mockScheduleData,
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
      ];
      (storage.loadSchedules as ReturnType<typeof vi.fn>).mockReturnValue(mockSchedules);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.schedules).toEqual(mockSchedules);
      });
      expect(storage.loadSchedules).toHaveBeenCalledTimes(1);
    });
  });

  describe('addSchedule', () => {
    it('新しいスケジュールを追加する', () => {
      const { result } = renderHook(() => useSchedules());

      act(() => {
        const newSchedule = result.current.addSchedule(mockScheduleData);
        expect(newSchedule).toMatchObject({
          ...mockScheduleData,
          id: 'test-id-123',
        });
        expect(newSchedule.createdAt).toBeDefined();
        expect(newSchedule.updatedAt).toBeDefined();
      });

      expect(result.current.schedules).toHaveLength(1);
      expect(result.current.schedules[0]).toMatchObject(mockScheduleData);
    });

    it('複数のスケジュールを追加できる', () => {
      const { result } = renderHook(() => useSchedules());
      (storage.generateId as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce('id-1')
        .mockReturnValueOnce('id-2');

      act(() => {
        result.current.addSchedule(mockScheduleData);
        result.current.addSchedule({ ...mockScheduleData, title: '別の予定' });
      });

      expect(result.current.schedules).toHaveLength(2);
      expect(result.current.schedules[0].id).toBe('id-1');
      expect(result.current.schedules[1].id).toBe('id-2');
    });

    it('追加後にlocalStorageに保存する', async () => {
      (storage.hasStorageData as ReturnType<typeof vi.fn>).mockReturnValue(true);
      const { result } = renderHook(() => useSchedules());

      act(() => {
        result.current.addSchedule(mockScheduleData);
      });

      await waitFor(() => {
        expect(storage.saveSchedules).toHaveBeenCalled();
      });
    });
  });

  describe('updateSchedule', () => {
    it('既存のスケジュールを更新する', async () => {
      const existingSchedule = {
        id: '1',
        ...mockScheduleData,
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      };
      (storage.loadSchedules as ReturnType<typeof vi.fn>).mockReturnValue([existingSchedule]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.schedules).toHaveLength(1);
      });

      const updatedData: ScheduleFormData = {
        ...mockScheduleData,
        title: '更新された予定',
      };

      act(() => {
        result.current.updateSchedule('1', updatedData);
      });

      expect(result.current.schedules[0].title).toBe('更新された予定');
      expect(result.current.schedules[0].updatedAt).not.toBe(existingSchedule.updatedAt);
    });

    it('存在しないIDの場合は何も変更しない', async () => {
      const existingSchedule = {
        id: '1',
        ...mockScheduleData,
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      };
      (storage.loadSchedules as ReturnType<typeof vi.fn>).mockReturnValue([existingSchedule]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.schedules).toHaveLength(1);
      });

      act(() => {
        result.current.updateSchedule('non-existent-id', {
          ...mockScheduleData,
          title: '更新された予定',
        });
      });

      expect(result.current.schedules[0].title).toBe('テスト予定');
    });
  });

  describe('deleteSchedule', () => {
    it('指定したIDのスケジュールを削除する', async () => {
      const mockSchedules = [
        {
          id: '1',
          ...mockScheduleData,
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
        {
          id: '2',
          ...mockScheduleData,
          title: '別の予定',
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
      ];
      (storage.loadSchedules as ReturnType<typeof vi.fn>).mockReturnValue(mockSchedules);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.schedules).toHaveLength(2);
      });

      act(() => {
        result.current.deleteSchedule('1');
      });

      expect(result.current.schedules).toHaveLength(1);
      expect(result.current.schedules[0].id).toBe('2');
    });

    it('存在しないIDの場合は何も削除しない', async () => {
      const mockSchedules = [
        {
          id: '1',
          ...mockScheduleData,
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
      ];
      (storage.loadSchedules as ReturnType<typeof vi.fn>).mockReturnValue(mockSchedules);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.schedules).toHaveLength(1);
      });

      act(() => {
        result.current.deleteSchedule('non-existent-id');
      });

      expect(result.current.schedules).toHaveLength(1);
    });
  });

  describe('getSchedulesByDate', () => {
    it('指定した日付のスケジュールをフィルタリングする', async () => {
      const mockSchedules = [
        {
          id: '1',
          ...mockScheduleData,
          date: '2024-06-15',
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
        {
          id: '2',
          ...mockScheduleData,
          title: '別の日の予定',
          date: '2024-06-16',
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
        {
          id: '3',
          ...mockScheduleData,
          title: '同じ日の別の予定',
          date: '2024-06-15',
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
      ];
      (storage.loadSchedules as ReturnType<typeof vi.fn>).mockReturnValue(mockSchedules);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.schedules).toHaveLength(3);
      });

      const schedulesOn15th = result.current.getSchedulesByDate('2024-06-15');
      expect(schedulesOn15th).toHaveLength(2);
      expect(schedulesOn15th[0].id).toBe('1');
      expect(schedulesOn15th[1].id).toBe('3');
    });

    it('該当する日付のスケジュールがない場合は空配列を返す', async () => {
      const mockSchedules = [
        {
          id: '1',
          ...mockScheduleData,
          date: '2024-06-15',
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
      ];
      (storage.loadSchedules as ReturnType<typeof vi.fn>).mockReturnValue(mockSchedules);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.schedules).toHaveLength(1);
      });

      const schedulesOnDifferentDate = result.current.getSchedulesByDate('2024-06-20');
      expect(schedulesOnDifferentDate).toHaveLength(0);
    });
  });
});
