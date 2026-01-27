import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// テスト用のグローバル定数をモック
beforeEach(() => {
  vi.stubGlobal('__APP_VERSION__', '1.0.0');
  vi.stubGlobal('__BUILD_DATE__', '2026-01-28T12:00:00.000Z');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('VersionInfo', () => {
  it('バージョン番号を表示する', async () => {
    const { VersionInfo } = await import('../../src/components/VersionInfo');
    render(<VersionInfo />);

    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('初期状態ではビルド日時が非表示である', async () => {
    const { VersionInfo } = await import('../../src/components/VersionInfo');
    render(<VersionInfo />);

    const detail = screen.queryByTestId('version-detail');
    expect(detail).not.toBeInTheDocument();
  });

  it('バージョンをクリックするとビルド日時が表示される', async () => {
    const { VersionInfo } = await import('../../src/components/VersionInfo');
    render(<VersionInfo />);

    const badge = screen.getByText('v1.0.0');
    fireEvent.click(badge);

    const detail = screen.getByTestId('version-detail');
    expect(detail).toBeInTheDocument();
    // フォーマットされたビルド日時が含まれる（タイムゾーンに依存するため、パターンで確認）
    expect(detail.textContent).toMatch(/Build: \d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
  });

  it('再度クリックするとビルド日時が非表示になる', async () => {
    const { VersionInfo } = await import('../../src/components/VersionInfo');
    render(<VersionInfo />);

    const badge = screen.getByText('v1.0.0');

    // 1回目のクリック: 表示
    fireEvent.click(badge);
    expect(screen.getByTestId('version-detail')).toBeInTheDocument();

    // 2回目のクリック: 非表示
    fireEvent.click(badge);
    expect(screen.queryByTestId('version-detail')).not.toBeInTheDocument();
  });

  it('アクセシビリティ: バージョンバッジに適切な aria-label がある', async () => {
    const { VersionInfo } = await import('../../src/components/VersionInfo');
    render(<VersionInfo />);

    const badge = screen.getByRole('button', { name: /バージョン情報/ });
    expect(badge).toBeInTheDocument();
  });

  it('version-info クラスが適用されている', async () => {
    const { VersionInfo } = await import('../../src/components/VersionInfo');
    const { container } = render(<VersionInfo />);

    const wrapper = container.querySelector('.version-info');
    expect(wrapper).toBeInTheDocument();
  });
});
