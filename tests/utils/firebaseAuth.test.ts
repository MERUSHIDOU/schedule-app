import { beforeEach, describe, expect, it, vi } from 'vitest';

// auth.currentUser を可変にするための参照オブジェクト
const mockAuth = { currentUser: null as { uid: string } | null };

vi.mock('../../src/utils/firebase', () => ({
  auth: mockAuth,
}));

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

describe('signInAnonymouslyIfNeeded', () => {
  beforeEach(() => {
    mockAuth.currentUser = null;
    vi.clearAllMocks();
  });

  it('未サインイン時はsignInAnonymouslyを呼ぶ', async () => {
    const { signInAnonymously } = await import('firebase/auth');
    const mockUser = { uid: 'test-uid' };
    vi.mocked(signInAnonymously).mockResolvedValue({ user: mockUser } as never);

    const { signInAnonymouslyIfNeeded } = await import('../../src/utils/firebaseAuth');
    const user = await signInAnonymouslyIfNeeded();

    expect(signInAnonymously).toHaveBeenCalledWith(mockAuth);
    expect(user.uid).toBe('test-uid');
  });

  it('サインイン済みの場合はsignInAnonymouslyを呼ばない', async () => {
    const { signInAnonymously } = await import('firebase/auth');
    mockAuth.currentUser = { uid: 'existing-uid' };

    const { signInAnonymouslyIfNeeded } = await import('../../src/utils/firebaseAuth');
    const user = await signInAnonymouslyIfNeeded();

    expect(signInAnonymously).not.toHaveBeenCalled();
    expect(user.uid).toBe('existing-uid');
  });
});

describe('getCurrentUserId', () => {
  beforeEach(() => {
    mockAuth.currentUser = null;
  });

  it('サインイン済みの場合はuidを返す', async () => {
    mockAuth.currentUser = { uid: 'test-uid' };

    const { getCurrentUserId } = await import('../../src/utils/firebaseAuth');
    expect(getCurrentUserId()).toBe('test-uid');
  });

  it('未サインインの場合はnullを返す', async () => {
    const { getCurrentUserId } = await import('../../src/utils/firebaseAuth');
    expect(getCurrentUserId()).toBeNull();
  });
});

describe('subscribeToAuthState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('onAuthStateChangedを呼んでunsubscribe関数を返す', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const mockUnsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(mockUnsubscribe as never);

    const { subscribeToAuthState } = await import('../../src/utils/firebaseAuth');
    const callback = vi.fn();
    const unsubscribe = subscribeToAuthState(callback);

    expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, callback);
    expect(unsubscribe).toBe(mockUnsubscribe);
  });
});
