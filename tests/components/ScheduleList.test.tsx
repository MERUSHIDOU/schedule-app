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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  describe('説明テキスト表示', () => {
    it('説明がない場合は表示されない', () => {
      const schedules = [createSchedule({ description: '' })];
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
});
