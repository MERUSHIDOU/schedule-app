import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotificationSettings from '../../src/components/NotificationSettings';
import type { NotificationConfig } from '../../src/types/notification';

describe('NotificationSettings', () => {
  const defaultConfig: NotificationConfig = {
    timing: 'onTime',
  };

  it('should render timing select', () => {
    const onChange = vi.fn();

    render(<NotificationSettings value={defaultConfig} onChange={onChange} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should change timing when select value changes', () => {
    const config: NotificationConfig = {
      timing: 'onTime',
    };
    const onChange = vi.fn();

    render(<NotificationSettings value={config} onChange={onChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '15min' } });

    expect(onChange).toHaveBeenCalledWith({
      timing: '15min',
    });
  });

  it('should show custom minutes input when custom timing is selected', () => {
    const config: NotificationConfig = {
      timing: 'custom',
      customMinutes: 45,
    };
    const onChange = vi.fn();

    render(<NotificationSettings value={config} onChange={onChange} />);

    const customInput = screen.getByRole('spinbutton');
    expect(customInput).toBeInTheDocument();
    expect(customInput).toHaveValue(45);
  });

  it('should update custom minutes when input value changes', () => {
    const config: NotificationConfig = {
      timing: 'custom',
      customMinutes: 45,
    };
    const onChange = vi.fn();

    render(<NotificationSettings value={config} onChange={onChange} />);

    const customInput = screen.getByRole('spinbutton');
    fireEvent.change(customInput, { target: { value: '60' } });

    expect(onChange).toHaveBeenCalledWith({
      timing: 'custom',
      customMinutes: 60,
    });
  });

  it('should disable select when disabled prop is true', () => {
    const onChange = vi.fn();

    render(<NotificationSettings value={defaultConfig} onChange={onChange} disabled />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('should enable select when notification is enabled', () => {
    const config: NotificationConfig = {
      timing: '15min',
    };
    const onChange = vi.fn();

    render(<NotificationSettings value={config} onChange={onChange} />);

    const select = screen.getByRole('combobox');
    expect(select).not.toBeDisabled();
  });
});
