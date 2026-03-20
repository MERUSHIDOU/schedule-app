import * as cloudTasks from '../src/utils/cloudTasks';
import * as validators from '../src/utils/validators';

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: Object.assign(
    jest.fn(() => mockFirestoreInstance),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'server-timestamp'),
        delete: jest.fn(() => 'field-delete'),
      },
      Timestamp: {
        fromDate: jest.fn(() => 'mock-timestamp'),
      },
    }
  ),
}));
jest.mock('firebase-functions/logger');
jest.mock('../src/utils/cloudTasks');
jest.mock('../src/utils/validators');

// onCall コールバックをキャプチャするためのモック
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

const mockSet = jest.fn().mockResolvedValue(undefined);
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockDelete = jest.fn().mockResolvedValue(undefined);
const mockDocRef = {
  id: 'test-reminder-id',
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
};
const mockFirestoreInstance = {
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue(mockDocRef),
  }),
};

describe('scheduleReminder', () => {
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const validInput = {
    scheduleId: 'schedule-123',
    title: '会議のリマインダー',
    body: '14:00 - 15:00 会議',
    reminderTiming: '30min' as validators.ReminderTiming,
    scheduleDate: '2026-12-10',
    scheduleStartTime: '14:00',
    timezone: 'Asia/Tokyo',
  };

  beforeAll(() => {
    // モジュールをロードして capturedHandler をセット
    require('../src/scheduleReminder');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);

    (validators.validateScheduleReminderInput as jest.Mock).mockReturnValue(validInput);
    (validators.calculateReminderTime as jest.Mock).mockReturnValue(futureTime);
    (cloudTasks.createScheduledTask as jest.Mock).mockResolvedValue(
      'projects/test/locations/asia-northeast1/queues/q/tasks/123'
    );
  });

  function callHandler(request: unknown) {
    if (!capturedHandler) throw new Error('handler がキャプチャされていません');
    return capturedHandler(request);
  }

  it('正常なリクエストでリマインダーが作成される', async () => {
    const result = await callHandler({
      auth: { uid: 'user-abc' },
      data: validInput,
    });

    expect(result).toEqual({ reminderId: 'test-reminder-id' });
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(cloudTasks.createScheduledTask).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ taskName: expect.any(String) })
    );
  });

  it('認証なしのリクエストは unauthenticated エラー', async () => {
    await expect(callHandler({ auth: null, data: validInput })).rejects.toMatchObject({
      code: 'unauthenticated',
    });
  });

  it('過去の時刻の場合は invalid-argument エラー', async () => {
    (validators.calculateReminderTime as jest.Mock).mockReturnValue(new Date(Date.now() - 1000));

    await expect(
      callHandler({ auth: { uid: 'user-abc' }, data: validInput })
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('Cloud Tasks 作成失敗時は Firestore ドキュメントを削除する', async () => {
    (cloudTasks.createScheduledTask as jest.Mock).mockRejectedValue(new Error('Cloud Tasks Error'));

    await expect(
      callHandler({ auth: { uid: 'user-abc' }, data: validInput })
    ).rejects.toMatchObject({ code: 'internal' });
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});
