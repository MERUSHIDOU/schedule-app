import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/utils/firebaseAuth', () => ({
  signInAnonymouslyIfNeeded: vi.fn(),
  subscribeToAuthState: vi.fn(),
}));

describe('useFirebaseAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態はisLoading=true、userId=null、error=null', async () => {
    const { signInAnonymouslyIfNeeded, subscribeToAuthState } = await import(
      '../../src/utils/firebaseAuth'
    );
    vi.mocked(subscribeToAuthState).mockReturnValue(() => {});
    vi.mocked(signInAnonymouslyIfNeeded).mockResolvedValue({ uid: 'test-uid' } as never);

    const { useFirebaseAuth } = await import('../../src/hooks/useFirebaseAuth');
    const { result } = renderHook(() => useFirebaseAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.userId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('認証状態変化後にuserIdが設定されisLoadingがfalseになる', async () => {
    const { signInAnonymouslyIfNeeded, subscribeToAuthState } = await import(
      '../../src/utils/firebaseAuth'
    );

    let capturedCallback: ((user: { uid: string } | null) => void) | null = null;
    vi.mocked(subscribeToAuthState).mockImplementation(cb => {
      capturedCallback = cb;
      return () => {};
    });
    vi.mocked(signInAnonymouslyIfNeeded).mockResolvedValue({ uid: 'test-uid' } as never);

    const { useFirebaseAuth } = await import('../../src/hooks/useFirebaseAuth');
    const { result } = renderHook(() => useFirebaseAuth());

    act(() => {
      capturedCallback?.({ uid: 'test-uid' });
    });

    await waitFor(() => {
      expect(result.current.userId).toBe('test-uid');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('認証失敗時はerrorが設定されisLoadingがfalseになる', async () => {
    const { signInAnonymouslyIfNeeded, subscribeToAuthState } = await import(
      '../../src/utils/firebaseAuth'
    );
    vi.mocked(subscribeToAuthState).mockReturnValue(() => {});
    vi.mocked(signInAnonymouslyIfNeeded).mockRejectedValue(new Error('Auth failed'));

    const { useFirebaseAuth } = await import('../../src/hooks/useFirebaseAuth');
    const { result } = renderHook(() => useFirebaseAuth());

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Auth failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('アンマウント時にunsubscribeが呼ばれる', async () => {
    const { signInAnonymouslyIfNeeded, subscribeToAuthState } = await import(
      '../../src/utils/firebaseAuth'
    );
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToAuthState).mockReturnValue(mockUnsubscribe);
    vi.mocked(signInAnonymouslyIfNeeded).mockResolvedValue({ uid: 'test-uid' } as never);

    const { useFirebaseAuth } = await import('../../src/hooks/useFirebaseAuth');
    const { unmount } = renderHook(() => useFirebaseAuth());

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('userIdがnullのままのAuth状態変化でもisLoadingがfalseになる', async () => {
    const { signInAnonymouslyIfNeeded, subscribeToAuthState } = await import(
      '../../src/utils/firebaseAuth'
    );

    let capturedCallback: ((user: { uid: string } | null) => void) | null = null;
    vi.mocked(subscribeToAuthState).mockImplementation(cb => {
      capturedCallback = cb;
      return () => {};
    });
    vi.mocked(signInAnonymouslyIfNeeded).mockResolvedValue({ uid: 'test-uid' } as never);

    const { useFirebaseAuth } = await import('../../src/hooks/useFirebaseAuth');
    const { result } = renderHook(() => useFirebaseAuth());

    act(() => {
      capturedCallback?.(null);
    });

    await waitFor(() => {
      expect(result.current.userId).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
