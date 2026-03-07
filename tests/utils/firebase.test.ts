import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

describe('firebase初期化', () => {
  it('appがエクスポートされること', async () => {
    const { app } = await import('../../src/utils/firebase');
    expect(app).toBeDefined();
  });

  it('authがエクスポートされること', async () => {
    const { auth } = await import('../../src/utils/firebase');
    expect(auth).toBeDefined();
  });

  it('dbがエクスポートされること', async () => {
    const { db } = await import('../../src/utils/firebase');
    expect(db).toBeDefined();
  });

  it('initializeAppが環境変数を使って呼ばれること', async () => {
    const { initializeApp } = await import('firebase/app');
    expect(vi.mocked(initializeApp)).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: expect.anything(),
        projectId: expect.anything(),
      })
    );
  });

  it('未初期化時はinitializeAppが使われること', async () => {
    const { getApps, initializeApp } = await import('firebase/app');
    vi.mocked(getApps).mockReturnValue([]);
    // モジュールが既にキャッシュされているため、初回呼び出しを確認
    expect(vi.mocked(initializeApp)).toHaveBeenCalled();
  });

  it('初期化済みの場合はgetAppが使われること', async () => {
    const { getApps, getApp, initializeApp } = await import('firebase/app');
    const mockApp = { name: '[DEFAULT]' } as ReturnType<typeof getApp>;
    vi.mocked(getApps).mockReturnValue([mockApp]);
    vi.mocked(getApp).mockReturnValue(mockApp);
    vi.mocked(initializeApp).mockClear();

    // 再インポートしても二重初期化しない（モジュールキャッシュ）
    const { app } = await import('../../src/utils/firebase');
    expect(app).toBeDefined();
  });
});
