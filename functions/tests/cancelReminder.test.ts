import * as cloudTasks from '../src/utils/cloudTasks';

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: Object.assign(
    jest.fn(() => mockFirestoreInstance),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'server-timestamp'),
      },
    }
  ),
}));
jest.mock('firebase-functions/logger');
jest.mock('../src/utils/cloudTasks');

let capturedHandler: ((req: unknown) => Promise<unknown>) | null = null;
jest.mock('firebase-functions/v2/https', () => ({
  onCall: (_opts: unknown, handler: (req: unknown) => Promise<unknown>) => {
    capturedHandler = handler;
    return jest.fn();
  },
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string
    ) {
      super(message);
      this.name = 'HttpsError';
    }
  },
}));

const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockGet = jest.fn();

const mockFirestoreInstance = {
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: mockGet,
      update: mockUpdate,
    }),
  }),
};

describe('cancelReminder', () => {
  const reminderData = {
    userId: 'user-abc',
    status: 'scheduled',
    taskName: 'projects/test/tasks/123',
  };

  beforeAll(() => {
    require('../src/cancelReminder');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue(undefined);
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...reminderData }),
    });
    (cloudTasks.deleteTask as jest.Mock).mockResolvedValue(undefined);
  });

  function callHandler(request: unknown) {
    if (!capturedHandler) throw new Error('handler がキャプチャされていません');
    return capturedHandler(request);
  }

  it('正常なキャンセルが成功する', async () => {
    const result = await callHandler({
      auth: { uid: 'user-abc' },
      data: { reminderId: 'reminder-123' },
    });

    expect(result).toEqual({ success: true });
    expect(cloudTasks.deleteTask).toHaveBeenCalledWith(reminderData.taskName);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
  });

  it('認証なしのリクエストは unauthenticated エラー', async () => {
    await expect(callHandler({ auth: null, data: { reminderId: 'r1' } })).rejects.toMatchObject({
      code: 'unauthenticated',
    });
  });

  it('reminderId がない場合は invalid-argument エラー', async () => {
    await expect(callHandler({ auth: { uid: 'user-abc' }, data: {} })).rejects.toMatchObject({
      code: 'invalid-argument',
    });
  });

  it('リマインダーが存在しない場合は not-found エラー', async () => {
    mockGet.mockResolvedValue({ exists: false });

    await expect(
      callHandler({
        auth: { uid: 'user-abc' },
        data: { reminderId: 'non-existent' },
      })
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it('他のユーザーのリマインダーは permission-denied エラー', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...reminderData, userId: 'other-user' }),
    });

    await expect(
      callHandler({
        auth: { uid: 'user-abc' },
        data: { reminderId: 'r1' },
      })
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('すでにキャンセル済みの場合は Cloud Tasks を呼ばずに成功する', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...reminderData, status: 'cancelled' }),
    });

    const result = await callHandler({
      auth: { uid: 'user-abc' },
      data: { reminderId: 'r1' },
    });

    expect(result).toEqual({ success: true });
    expect(cloudTasks.deleteTask).not.toHaveBeenCalled();
  });

  it('taskName がない場合は Cloud Tasks 削除をスキップする', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...reminderData, taskName: null }),
    });

    await callHandler({
      auth: { uid: 'user-abc' },
      data: { reminderId: 'r1' },
    });

    expect(cloudTasks.deleteTask).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
  });
});
