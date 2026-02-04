import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsMenu } from '../../src/components/SettingsMenu';

describe('SettingsMenu', () => {
  it('歯車アイコンが表示されること', () => {
    const mockOnToggle = vi.fn();
    render(<SettingsMenu showHolidays={true} onToggleHolidays={mockOnToggle} />);

    const button = screen.getByRole('button', { name: /設定/i });
    expect(button).toBeDefined();
  });

  it('クリックでメニューが開くこと', () => {
    const mockOnToggle = vi.fn();
    render(<SettingsMenu showHolidays={true} onToggleHolidays={mockOnToggle} />);

    const button = screen.getByRole('button', { name: /設定/i });
    fireEvent.click(button);

    const menu = screen.getByText('祝日を表示');
    expect(menu).toBeDefined();
  });

  it('再度クリックでメニューが閉じること', () => {
    const mockOnToggle = vi.fn();
    render(<SettingsMenu showHolidays={true} onToggleHolidays={mockOnToggle} />);

    const button = screen.getByRole('button', { name: /設定/i });
    fireEvent.click(button);

    expect(screen.getByText('祝日を表示')).toBeDefined();

    fireEvent.click(button);

    expect(screen.queryByText('祝日を表示')).toBeNull();
  });

  it('トグルがONの時にチェックボックスがチェックされていること', () => {
    const mockOnToggle = vi.fn();
    render(<SettingsMenu showHolidays={true} onToggleHolidays={mockOnToggle} />);

    const button = screen.getByRole('button', { name: /設定/i });
    fireEvent.click(button);

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('トグルがOFFの時にチェックボックスがチェックされていないこと', () => {
    const mockOnToggle = vi.fn();
    render(<SettingsMenu showHolidays={false} onToggleHolidays={mockOnToggle} />);

    const button = screen.getByRole('button', { name: /設定/i });
    fireEvent.click(button);

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('トグル操作時にコールバックが呼ばれること', () => {
    const mockOnToggle = vi.fn();
    render(<SettingsMenu showHolidays={true} onToggleHolidays={mockOnToggle} />);

    const button = screen.getByRole('button', { name: /設定/i });
    fireEvent.click(button);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith(false);
  });

  it('メニュー外クリックで閉じること', () => {
    const mockOnToggle = vi.fn();
    render(<SettingsMenu showHolidays={true} onToggleHolidays={mockOnToggle} />);

    const button = screen.getByRole('button', { name: /設定/i });
    fireEvent.click(button);

    expect(screen.getByText('祝日を表示')).toBeDefined();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('祝日を表示')).toBeNull();
  });
});
