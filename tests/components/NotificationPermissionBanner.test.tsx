import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotificationPermissionBanner from '../../src/components/NotificationPermissionBanner';

describe('NotificationPermissionBanner', () => {
  it('should render banner with message and buttons', () => {
    const onPermissionGranted = vi.fn();
    const onDismiss = vi.fn();

    render(
      <NotificationPermissionBanner
        onPermissionGranted={onPermissionGranted}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByRole('button', { name: /通知を有効にする/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /後で/i })).toBeInTheDocument();
  });

  it('should call onPermissionGranted when "通知を有効にする" button is clicked', () => {
    const onPermissionGranted = vi.fn();
    const onDismiss = vi.fn();

    render(
      <NotificationPermissionBanner
        onPermissionGranted={onPermissionGranted}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /通知を有効にする/i }));

    expect(onPermissionGranted).toHaveBeenCalledOnce();
  });

  it('should call onDismiss when "後で" button is clicked', () => {
    const onPermissionGranted = vi.fn();
    const onDismiss = vi.fn();

    render(
      <NotificationPermissionBanner
        onPermissionGranted={onPermissionGranted}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /後で/i }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
