import * as fcm from '../src/utils/fcm';

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: Object.assign(
    jest.fn(() => mockFirestoreInstance),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'server-timestamp'),
        delete: jest.fn(() => 'field-delete'),
      },
    }
  ),
}));
jest.mock('firebase-functions/logger');
jest.mock('../src/utils/fcm');

let capturedHandler: ((req: unknown, res: unknown) => Promise<void>) | null = null;
jest.mock('firebase-functions/v2/https', () => ({
  onRequest: (_opts: unknown, handler: (req: unknown, res: unknown) => Promise<void>) => {
    capturedHandler = handler;
    return jest.fn();
  },
}));

const mockReminderGet = jest.fn();
const mockUserGet = jest.fn();
const mockReminderUpdate = jest.fn().mockResolvedValue(undefined);
const mockUserUpdate = jest.fn().mockResolvedValue(undefined);

const mockFirestoreInstance = {
  collection: jest.fn((name: string) => ({
    doc: jest.fn(() => {
      if (name === 'reminders') {
        return { get: mockReminderGet, update: mockReminderUpdate };
      }
      return { get: mockUserGet, update: mockUserUpdate };
    }),
  })),
};

function createMockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('sendPush', () => {
  const reminderData = {
    userId: 'user-abc',
    title: '会議のリマインダー',
    body: '14:00 - 15:00 会議',
    scheduleId: 'schedule-123',
    status: 'scheduled',
  };
  const userData = {
    fcmTokens: {
      device1: { token: 'token-aaa', updatedAt: 'ts' },
      device2: { token: 'token-bbb', updatedAt: 'ts' },
    },
  };

  beforeAll(() => {
    require('../src/sendPush');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockReminderGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...reminderData }),
    });
    mockUserGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...userData }),
    });
    mockReminderUpdate.mockResolvedValue(undefined);
    mockUserUpdate.mockResolvedValue(undefined);

    (fcm.sendPushNotification as jest.Mock).mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      invalidTokens: [],
    });
  });

  async function callHandler(
    body: unknown,
    method = 'POST'
  ): Promise<ReturnType<typeof createMockRes>> {
    if (!capturedHandler) throw new Error('handler がキャプチャされていません');
    const req = { method, body };
    const res = createMockRes();
    await capturedHandler(req, res);
    return res;
  }

  it('正常に Push 通知を送信して 200 を返す', async () => {
    const res = await callHandler({ reminderId: 'reminder-123' });

    expect(fcm.sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['token-aaa', 'token-bbb'],
        title: reminderData.title,
        body: reminderData.body,
      })
    );
    expect(mockReminderUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent' }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('POST 以外のメソッドは 405 を返す', async () => {
    const res = await callHandler({}, 'GET');
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('reminderId がない場合は 400 を返す', async () => {
    const res = await callHandler({});
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('リマインダーが存在しない場合は冪等的に 200 を返す', async () => {
    mockReminderGet.mockResolvedValue({ exists: false });

    const res = await callHandler({ reminderId: 'non-existent' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(fcm.sendPushNotification).not.toHaveBeenCalled();
  });

  it('status が cancelled の場合は送信をスキップして 200 を返す', async () => {
    mockReminderGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...reminderData, status: 'cancelled' }),
    });

    const res = await callHandler({ reminderId: 'r1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(fcm.sendPushNotification).not.toHaveBeenCalled();
  });

  it('status が sent の場合は冪等的に 200 を返す', async () => {
    mockReminderGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...reminderData, status: 'sent' }),
    });

    const res = await callHandler({ reminderId: 'r1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(fcm.sendPushNotification).not.toHaveBeenCalled();
  });

  it('無効なトークンが返された場合は Firestore から削除する', async () => {
    (fcm.sendPushNotification as jest.Mock).mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      invalidTokens: ['token-bbb'],
    });

    await callHandler({ reminderId: 'r1' });

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        'fcmTokens.device2': 'field-delete',
      })
    );
  });

  it('全トークンへの送信失敗時は 500 を返す', async () => {
    (fcm.sendPushNotification as jest.Mock).mockResolvedValue({
      successCount: 0,
      failureCount: 2,
      invalidTokens: [],
    });

    const res = await callHandler({ reminderId: 'r1' });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockReminderUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });
});
