import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadSchedules, saveSchedules, generateId } from './storage'
import type { Schedule } from '../types/schedule'

const mockSchedule: Schedule = {
  id: '1',
  title: 'テスト予定',
  description: 'テスト説明',
  date: '2024-06-15',
  startTime: '10:00',
  endTime: '11:00',
  color: '#3b82f6',
  createdAt: '2024-06-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
}

describe('loadSchedules', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('保存されたスケジュールを読み込む', () => {
    const schedules = [mockSchedule]
    localStorage.setItem('schedule-app-data', JSON.stringify(schedules))

    const result = loadSchedules()
    expect(result).toEqual(schedules)
  })

  it('データがない場合は空配列を返す', () => {
    const result = loadSchedules()
    expect(result).toEqual([])
  })

  it('無効なJSONの場合は空配列を返す', () => {
    localStorage.setItem('schedule-app-data', 'invalid json')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = loadSchedules()
    expect(result).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})

describe('saveSchedules', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('スケジュールをlocalStorageに保存する', () => {
    const schedules = [mockSchedule]
    saveSchedules(schedules)

    const saved = localStorage.getItem('schedule-app-data')
    expect(saved).toBe(JSON.stringify(schedules))
  })

  it('空配列を保存できる', () => {
    saveSchedules([])

    const saved = localStorage.getItem('schedule-app-data')
    expect(saved).toBe('[]')
  })

  it('複数のスケジュールを保存できる', () => {
    const schedules = [
      mockSchedule,
      { ...mockSchedule, id: '2', title: '別の予定' },
    ]
    saveSchedules(schedules)

    const saved = JSON.parse(localStorage.getItem('schedule-app-data') || '[]')
    expect(saved).toHaveLength(2)
  })
})

describe('generateId', () => {
  it('一意のIDを生成する', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('IDにタイムスタンプとランダム文字列が含まれる', () => {
    const id = generateId()
    expect(id).toMatch(/^\d+-[a-z0-9]+$/)
  })

  it('IDが空でない', () => {
    const id = generateId()
    expect(id.length).toBeGreaterThan(0)
  })
})
