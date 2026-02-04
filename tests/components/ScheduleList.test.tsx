import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScheduleList } from '../../src/components/ScheduleList';
import type { Schedule } from '../../src/types/schedule';

describe('ScheduleList', () => {
  const mockOnEdit = () => {};
  const mockOnDelete = () => {};

  const createSchedule = (overrides?: Partial<Schedule>): Schedule => ({
    id: '1',
    title: 'テストスケジュール',
    description: '',
    date: '2024-01-01',
    startTime: '09:00',
    endTime: '10:00',
    color: '#3b82f6',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  });

  describe('説明テキスト表示', () => {
    it('説明がない場合は表示されない', () => {
      const schedules = [createSchedule({ description: undefined })];
      render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const descriptions = screen.queryAllByRole('paragraph');
      const descriptionElements = descriptions.filter(p =>
        p.className.includes('schedule-description')
      );
      expect(descriptionElements.length).toBe(0);
    });

    it('短い説明（1行以下）は全文表示される', () => {
      const description = 'これは短い説明です';
      const schedules = [createSchedule({ description })];

      render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const descriptionElement = screen.getByText(description);
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement).toHaveClass('schedule-description');
    });

    it('3行までの説明は全文表示される', () => {
      const description = '行1\n行2\n行3';
      const schedules = [createSchedule({ description })];

      const { container } = render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const descriptionElement = container.querySelector('.schedule-description');
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement?.textContent).toBe(description);
      expect(descriptionElement).toHaveClass('schedule-description');
      expect(descriptionElement).not.toHaveClass('truncated');
    });

    it('4行以上の説明にはtrun catedクラスが適用される', () => {
      const description = '行1\n行2\n行3\n行4';
      const schedules = [createSchedule({ description })];

      const { container } = render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const descriptionElement = container.querySelector('.schedule-description');
      expect(descriptionElement).toHaveClass('schedule-description', 'truncated');
      expect(descriptionElement?.textContent).toBe(description);
    });

    it('改行を含む説明が正しく表示される', () => {
      const description = '最初の行です\n2番目の行です\n3番目の行です';
      const schedules = [createSchedule({ description })];

      const { container } = render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const descriptionElement = container.querySelector('.schedule-description');
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement?.textContent).toBe(description);
    });
  });

  describe('複数スケジュール', () => {
    it('複数のスケジュールが表示される', () => {
      const schedules = [
        createSchedule({ id: '1', title: 'スケジュール1', description: '説明1' }),
        createSchedule({
          id: '2',
          title: 'スケジュール2',
          description: '説明2\n説明2b\n説明2c\n説明2d',
        }),
      ];

      render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('スケジュール1')).toBeInTheDocument();
      expect(screen.getByText('スケジュール2')).toBeInTheDocument();
    });
  });

  describe('レイアウト', () => {
    it('説明の追加後も既存のレイアウトが保持される', () => {
      const schedules = [createSchedule({ description: '説明' })];

      const { container } = render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const contentDiv = container.querySelector('.schedule-content');
      expect(contentDiv).toBeInTheDocument();
      const descriptions = contentDiv?.querySelectorAll('.schedule-description');
      expect(descriptions).toHaveLength(1);
    });
  });

  describe('日付ラベル', () => {
    it('リストの左上にYYYY/MM/DD形式で日付が表示される', () => {
      const schedules = [createSchedule()];

      render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const dateLabel = screen.getByText('2024/01/01');
      expect(dateLabel).toBeInTheDocument();
      expect(dateLabel).toHaveClass('schedule-list-date');
    });

    it('異なる日付でも正しく表示される', () => {
      const schedules = [createSchedule({ date: '2024-12-31' })];

      render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-12-31"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const dateLabel = screen.getByText('2024/12/31');
      expect(dateLabel).toBeInTheDocument();
    });

    it('予定がない場合でも日付ラベルは表示される', () => {
      render(
        <ScheduleList
          schedules={[]}
          selectedDate="2024-06-15"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const dateLabel = screen.getByText('2024/06/15');
      expect(dateLabel).toBeInTheDocument();
    });
  });

  describe('祝日表示', () => {
    it('showHolidaysがtrueの場合、祝日が最上部に表示される', () => {
      const schedules = [
        createSchedule({ id: '1', title: '通常予定', startTime: '09:00', endTime: '10:00' }),
      ];

      const { container } = render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showHolidays={true}
        />
      );

      const items = container.querySelectorAll('.schedule-item');
      expect(items.length).toBe(2); // 祝日 + 通常予定

      // 最初のアイテムが祝日（元日）
      expect(items[0].textContent).toContain('元日');
      // 2番目が通常予定
      expect(items[1].textContent).toContain('通常予定');
    });

    it('showHolidaysがfalseの場合、祝日が表示されない', () => {
      const schedules = [createSchedule({ id: '1', title: '通常予定', date: '2024-01-01' })];

      const { container } = render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showHolidays={false}
        />
      );

      const items = container.querySelectorAll('.schedule-item');
      expect(items.length).toBe(1); // 通常予定のみ

      expect(screen.queryByText('元日')).not.toBeInTheDocument();
    });

    it('祝日に時間表記が表示されない', () => {
      const { container } = render(
        <ScheduleList
          schedules={[]}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showHolidays={true}
        />
      );

      const items = container.querySelectorAll('.schedule-item');
      expect(items.length).toBe(1); // 祝日のみ

      const timeElement = items[0].querySelector('.schedule-time');
      expect(timeElement).toBeNull();
    });

    it('祝日に編集ボタンが表示されない', () => {
      const { container } = render(
        <ScheduleList
          schedules={[]}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showHolidays={true}
        />
      );

      const items = container.querySelectorAll('.schedule-item');
      const editBtn = items[0].querySelector('.edit-btn');
      expect(editBtn).toBeNull();
    });

    it('祝日に削除ボタンが表示されない', () => {
      const { container } = render(
        <ScheduleList
          schedules={[]}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showHolidays={true}
        />
      );

      const items = container.querySelectorAll('.schedule-item');
      const deleteBtn = items[0].querySelector('.delete-btn');
      expect(deleteBtn).toBeNull();
    });

    it('祝日のカラーバーが赤色（#e74c3c）である', () => {
      const { container } = render(
        <ScheduleList
          schedules={[]}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showHolidays={true}
        />
      );

      const items = container.querySelectorAll('.schedule-item');
      const colorBar = items[0].querySelector('.schedule-color-bar') as HTMLElement;
      expect(colorBar).toHaveStyle({ backgroundColor: '#e74c3c' });
    });

    it('祝日のみの日に「予定がありません」が表示されない', () => {
      render(
        <ScheduleList
          schedules={[]}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showHolidays={true}
        />
      );

      expect(screen.queryByText('予定がありません')).not.toBeInTheDocument();
      expect(screen.getByText('元日')).toBeInTheDocument();
    });

    it('祝日と通常予定が混在する場合、祝日が先に表示される', () => {
      const schedules = [
        createSchedule({ id: '1', title: '午前の予定', startTime: '09:00', endTime: '10:00' }),
        createSchedule({ id: '2', title: '午後の予定', startTime: '14:00', endTime: '15:00' }),
      ];

      const { container } = render(
        <ScheduleList
          schedules={schedules}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showHolidays={true}
        />
      );

      const items = container.querySelectorAll('.schedule-item');
      expect(items.length).toBe(3); // 祝日 + 2つの通常予定

      // 最初が祝日
      expect(items[0].textContent).toContain('元日');
      // 次が時刻順の通常予定
      expect(items[1].textContent).toContain('午前の予定');
      expect(items[2].textContent).toContain('午後の予定');
    });

    it('showHolidaysが未指定の場合、祝日が表示されない（デフォルト動作）', () => {
      const { container } = render(
        <ScheduleList
          schedules={[]}
          selectedDate="2024-01-01"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('元日')).not.toBeInTheDocument();
      expect(screen.getByText('予定がありません')).toBeInTheDocument();
    });
  });
});
