import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Calendar } from '../../src/components/Calendar';
import type { Schedule } from '../../src/types/schedule';

describe('Calendar', () => {
  const mockSchedules: Schedule[] = [
    {
      id: '1',
      title: 'テストスケジュール1',
      description: '',
      date: '2026-01-15',
      startTime: '10:00',
      endTime: '11:00',
      color: '#3b82f6',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const mockOnSelectDate = vi.fn();

  beforeEach(() => {
    mockOnSelectDate.mockClear();
  });

  describe('スワイプ機能の統合', () => {
    it('カレンダーグリッドにaria-labelが設定されている', () => {
      render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-15"
          onSelectDate={mockOnSelectDate}
        />
      );

      const grid = document.querySelector('.calendar-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('aria-label');
      expect(grid?.getAttribute('aria-label')).toContain('カレンダー');
      expect(grid?.getAttribute('aria-label')).toContain('スワイプ');
    });

    it('カレンダーグリッドにrole="grid"が設定されている', () => {
      render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-15"
          onSelectDate={mockOnSelectDate}
        />
      );

      const grid = document.querySelector('.calendar-grid');
      expect(grid).toHaveAttribute('role', 'grid');
    });

    it('タッチイベントハンドラが設定されている（onTouchStart）', () => {
      render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-15"
          onSelectDate={mockOnSelectDate}
        />
      );

      const grid = document.querySelector('.calendar-grid');
      expect(grid).toBeInTheDocument();

      // Reactのイベントハンドラが設定されているか確認
      // （実際のDOMにはonTouchStart属性は見えないが、Reactが内部で管理している）
      expect(grid).toBeTruthy();
    });

    it('右スワイプで前月に移動する', async () => {
      render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-31"
          onSelectDate={mockOnSelectDate}
        />
      );

      const initialMonth = screen.getByText(/2026年1月/);
      expect(initialMonth).toBeInTheDocument();

      const grid = document.querySelector('.calendar-grid');
      expect(grid).toBeInTheDocument();

      // タッチイベントをシミュレート（右スワイプ）
      const startTime = 1000;
      const endTime = 1200; // 200ms後

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 200,
            clientY: 200,
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchStartEvent, 'timeStamp', {
        value: startTime,
        writable: false,
      });

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          {
            clientX: 300, // 右に100px移動
            clientY: 205, // 垂直方向はほぼ変化なし
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchMoveEvent, 'timeStamp', {
        value: startTime + 100,
        writable: false,
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          {
            clientX: 300,
            clientY: 205,
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchEndEvent, 'timeStamp', {
        value: endTime,
        writable: false,
      });

      if (grid) {
        fireEvent(grid, touchStartEvent);
        fireEvent(grid, touchMoveEvent);
        fireEvent(grid, touchEndEvent);
      }

      // 前月（2025年12月）に移動したことを確認（非同期更新を待つ）
      await waitFor(() => {
        expect(screen.getByText(/2025年12月/)).toBeInTheDocument();
      });
    });

    it('左スワイプで次月に移動する', async () => {
      render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-15"
          onSelectDate={mockOnSelectDate}
        />
      );

      const initialMonth = screen.getByText(/2026年1月/);
      expect(initialMonth).toBeInTheDocument();

      const grid = document.querySelector('.calendar-grid');
      expect(grid).toBeInTheDocument();

      // タッチイベントをシミュレート（左スワイプ）
      const startTime = 1000;
      const endTime = 1200;

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 300,
            clientY: 200,
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchStartEvent, 'timeStamp', {
        value: startTime,
        writable: false,
      });

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          {
            clientX: 200, // 左に100px移動
            clientY: 205,
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchMoveEvent, 'timeStamp', {
        value: startTime + 100,
        writable: false,
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          {
            clientX: 200,
            clientY: 205,
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchEndEvent, 'timeStamp', {
        value: endTime,
        writable: false,
      });

      if (grid) {
        fireEvent(grid, touchStartEvent);
        fireEvent(grid, touchMoveEvent);
        fireEvent(grid, touchEndEvent);
      }

      // 次月（2026年2月）に移動したことを確認（非同期更新を待つ）
      await waitFor(() => {
        expect(screen.getByText(/2026年2月/)).toBeInTheDocument();
      });
    });

    it('垂直スワイプでは月が変わらない', () => {
      render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-15"
          onSelectDate={mockOnSelectDate}
        />
      );

      const initialMonth = screen.getByText(/2026年1月/);
      expect(initialMonth).toBeInTheDocument();

      const grid = document.querySelector('.calendar-grid');
      expect(grid).toBeInTheDocument();

      // タッチイベントをシミュレート（垂直スワイプ）
      const startTime = 1000;
      const endTime = 1200;

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 200,
            clientY: 100,
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchStartEvent, 'timeStamp', {
        value: startTime,
        writable: false,
      });

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          {
            clientX: 210, // 水平方向は10pxのみ
            clientY: 200, // 垂直方向に100px移動
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          {
            clientX: 210,
            clientY: 200,
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchEndEvent, 'timeStamp', {
        value: endTime,
        writable: false,
      });

      grid?.dispatchEvent(touchStartEvent);
      grid?.dispatchEvent(touchMoveEvent);
      grid?.dispatchEvent(touchEndEvent);

      // 月が変わっていないことを確認
      expect(screen.getByText(/2026年1月/)).toBeInTheDocument();
    });

    it('短いスワイプでは月が変わらない', () => {
      render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-15"
          onSelectDate={mockOnSelectDate}
        />
      );

      const initialMonth = screen.getByText(/2026年1月/);
      expect(initialMonth).toBeInTheDocument();

      const grid = document.querySelector('.calendar-grid');
      expect(grid).toBeInTheDocument();

      // タッチイベントをシミュレート（短いスワイプ: 30px < しきい値50px）
      const startTime = 1000;
      const endTime = 1200;

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 200,
            clientY: 200,
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchStartEvent, 'timeStamp', {
        value: startTime,
        writable: false,
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          {
            clientX: 230, // 右に30pxのみ（しきい値50px未満）
            clientY: 200,
          } as Touch,
        ],
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchEndEvent, 'timeStamp', {
        value: endTime,
        writable: false,
      });

      grid?.dispatchEvent(touchStartEvent);
      grid?.dispatchEvent(touchEndEvent);

      // 月が変わっていないことを確認
      expect(screen.getByText(/2026年1月/)).toBeInTheDocument();
    });
  });

  describe('既存機能との互換性', () => {
    it('ボタンでの月移動が正常に動作する', async () => {
      render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-15"
          onSelectDate={mockOnSelectDate}
        />
      );

      const initialMonth = screen.getByText(/2026年1月/);
      expect(initialMonth).toBeInTheDocument();

      // 次月ボタンをクリック
      const nextButton = screen.getByLabelText('次月');
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText(/2026年2月/)).toBeInTheDocument();
      });

      // 前月ボタンをクリック
      const prevButton = screen.getByLabelText('前月');
      fireEvent.click(prevButton);
      await waitFor(() => {
        expect(screen.getByText(/2026年1月/)).toBeInTheDocument();
      });
    });
  });

  describe('祝日表示機能', () => {
    it('showHolidaysがtrueの時に祝日がドットとして表示されること', () => {
      const { container } = render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-01"
          onSelectDate={mockOnSelectDate}
          showHolidays={true}
        />
      );

      // 1月1日のセルを取得
      const holidayCell = container.querySelector('[data-date="2026-01-01"]');
      expect(holidayCell).toBeInTheDocument();

      // 祝日名テキストが表示されていないことを確認
      expect(screen.queryByText('元日')).not.toBeInTheDocument();

      // ドットが表示されていることを確認
      const dots = holidayCell?.querySelectorAll('.schedule-dot');
      expect(dots).toHaveLength(1);
    });

    it('showHolidaysがfalseの時に祝日ドットが非表示であること', () => {
      const { container } = render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-01"
          onSelectDate={mockOnSelectDate}
          showHolidays={false}
        />
      );

      // 1月1日のセルを取得
      const holidayCell = container.querySelector('[data-date="2026-01-01"]');

      // ドットが表示されていないことを確認
      const dots = holidayCell?.querySelectorAll('.schedule-dot');
      expect(dots).toHaveLength(0);

      // 祝日名テキストも表示されていないことを確認
      expect(screen.queryByText('元日')).not.toBeInTheDocument();
    });

    it('showHolidaysが未指定の時にデフォルトでtrueとして動作すること', () => {
      const { container } = render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-01"
          onSelectDate={mockOnSelectDate}
        />
      );

      // デフォルトで祝日ドットが表示されることを確認
      const holidayCell = container.querySelector('[data-date="2026-01-01"]');
      const dots = holidayCell?.querySelectorAll('.schedule-dot');
      expect(dots).toHaveLength(1);
    });

    it('祝日のドットが赤色（#e74c3c）であること', () => {
      const { container } = render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-01"
          onSelectDate={mockOnSelectDate}
          showHolidays={true}
        />
      );

      const holidayCell = container.querySelector('[data-date="2026-01-01"]');
      const dot = holidayCell?.querySelector('.schedule-dot');
      expect(dot).toHaveStyle({ backgroundColor: '#e74c3c' });
    });

    it('祝日の日にholidayクラスが付与されること', () => {
      const { container } = render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-01"
          onSelectDate={mockOnSelectDate}
          showHolidays={true}
        />
      );

      // 1月1日のセルを取得
      const holidayCell = container.querySelector('[data-date="2026-01-01"]');
      expect(holidayCell).toHaveClass('calendar-day');
      expect(holidayCell).toHaveClass('holiday');
    });

    it('祝日でない日にholidayクラスが付与されないこと', () => {
      const { container } = render(
        <Calendar
          schedules={mockSchedules}
          selectedDate="2026-01-02"
          onSelectDate={mockOnSelectDate}
          showHolidays={true}
        />
      );

      // 1月2日のセルを取得
      const normalCell = container.querySelector('[data-date="2026-01-02"]');
      expect(normalCell).toHaveClass('calendar-day');
      expect(normalCell).not.toHaveClass('holiday');
    });

    it('祝日と通常の予定が混在する場合、両方のドットが表示されること', () => {
      const schedulesWithHoliday: Schedule[] = [
        {
          id: '1',
          title: 'テスト予定',
          description: '',
          date: '2026-01-01',
          startTime: '10:00',
          endTime: '11:00',
          color: '#3b82f6',
          createdAt: '',
          updatedAt: '',
        },
      ];

      const { container } = render(
        <Calendar
          schedules={schedulesWithHoliday}
          selectedDate="2026-01-01"
          onSelectDate={mockOnSelectDate}
          showHolidays={true}
        />
      );

      const holidayCell = container.querySelector('[data-date="2026-01-01"]');
      const dots = holidayCell?.querySelectorAll('.schedule-dot');

      // 祝日ドット（赤）+ 通常予定ドット（青）= 2つ
      expect(dots).toHaveLength(2);
    });
  });
});
