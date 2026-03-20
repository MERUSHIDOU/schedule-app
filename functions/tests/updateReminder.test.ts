import * as cloudTasks from '../src/utils/cloudTasks';
import * as validators from '../src/utils/validators';

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: Object.assign(
    jest.fn(() => mockFirestoreInstance),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'server-timestamp'),
      },
      Timestamp: {
        fromDate: jest.fn((d: Date) => ({ toDate: () => d })),
      },
    }
  ),
}));
jest.mock('firebase-functions/logger');
jest.mock('../src/utils/cloudTasks');
jest.mock('../src/utils/validators');

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

const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

const baseReminderData = {
  userId: 'user-abc',
  scheduleId: 'schedule-1',
  title: '会議リマインダー',
  body: '14:00 - 15:00',
  reminderTiming: '30min',
  scheduleDate: '2026-06-01',
  scheduleStartTime: '14:00',
  timezone: 'Asia/Tokyo',
  status: 'scheduled',
  taskName: 'projects/test/tasks/old-task-123',
};

describe('updateReminder', () => {
  beforeAll(() => {
    require('../src/updateReminder');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseReminderData }),
    });
    mockUpdate.mockResolvedValue(undefined);
    (cloudTasks.deleteTask as jest.Mock).mockResolvedValue(undefined);
    (cloudTasks.createScheduledTask as jest.Mock).mockResolvedValue(
      'projects/test/tasks/new-task-456'
    );
    (validators.validateScheduleReminderInput as jest.Mock).mockReturnValue({
      scheduleId: 'schedule-1',
      title: '会議リマインダー',
      body: '14:00 - 15:00',
      reminderTiming: '30min',
      scheduleDate: '2026-06-01',
      scheduleStartTime: '14:00',
      timezone: 'Asia/Tokyo',
    });
    (validators.calculateReminderTime as jest.Mock).mockReturnValue(futureDate);
  });

  function callHandler(request: unknown) {
    if (!capturedHandler) throw new Error('handler がキャプチャされていません');
    return capturedHandler(request);
  }

  it('正常な更新が成功する', async () => {
    const result = await callHandler({
      auth: { uid: 'user-abc' },
      data: { reminderId: 'reminder-123', title: '新しいタイトル' },
    });

    expect(result).toEqual({ reminderId: 'reminder-123' });
    expect(cloudTasks.deleteTask).toHaveBeenCalledWith(baseReminderData.taskName);
    expect(cloudTasks.createScheduledTask).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'scheduled', taskName: 'projects/test/tasks/new-task-456' })
    );
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
      callHandler({ auth: { uid: 'user-abc' }, data: { reminderId: 'non-existent' } })
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it('他のユーザーのリマインダーは permission-denied エラー', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseReminderData, userId: 'other-user' }),
    });

    await expect(
      callHandler({ auth: { uid: 'user-abc' }, data: { reminderId: 'r1' } })
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('キャンセル済みリマインダーは failed-precondition エラー', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseReminderData, status: 'cancelled' }),
    });

    await expect(
      callHandler({ auth: { uid: 'user-abc' }, data: { reminderId: 'r1' } })
    ).rejects.toMatchObject({ code: 'failed-precondition' });
  });

  it('送信済みリマインダーは failed-precondition エラー', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseReminderData, status: 'sent' }),
    });

    await expect(
      callHandler({ auth: { uid: 'user-abc' }, data: { reminderId: 'r1' } })
    ).rejects.toMatchObject({ code: 'failed-precondition' });
  });

  it('過去のリマインダー時刻は invalid-argument エラー', async () => {
    (validators.calculateReminderTime as jest.Mock).mockReturnValue(
      new Date(Date.now() - 1000) // 過去
    );

    await expect(
      callHandler({ auth: { uid: 'user-abc' }, data: { reminderId: 'r1' } })
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('Cloud Tasks 作成失敗時は internal エラー', async () => {
    (cloudTasks.createScheduledTask as jest.Mock).mockRejectedValue(
      new Error('Cloud Tasks 接続エラー')
    );

    await expect(
      callHandler({ auth: { uid: 'user-abc' }, data: { reminderId: 'r1' } })
    ).rejects.toMatchObject({ code: 'internal' });
  });

  it('taskName がない場合は Cloud Tasks 削除をスキップする', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...baseReminderData, taskName: null }),
    });

    await callHandler({ auth: { uid: 'user-abc' }, data: { reminderId: 'r1' } });

    expect(cloudTasks.deleteTask).not.toHaveBeenCalled();
    expect(cloudTasks.createScheduledTask).toHaveBeenCalled();
  });
});
