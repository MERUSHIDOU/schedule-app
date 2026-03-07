import type { CloudTasksClient } from '@google-cloud/tasks';
import {
  _setTasksClientForTesting,
  createScheduledTask,
  deleteTask,
} from '../../src/utils/cloudTasks';

jest.mock('@google-cloud/tasks');
jest.mock('firebase-functions/logger');

describe('createScheduledTask', () => {
  let mockClient: {
    createTask: jest.Mock;
    deleteTask: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      createTask: jest.fn(),
      deleteTask: jest.fn(),
    };
    _setTasksClientForTesting(mockClient as unknown as CloudTasksClient);
  });

  it('タスクを作成してタスク名を返す', async () => {
    const expectedTaskName =
      'projects/my-project/locations/asia-northeast1/queues/reminder-queue/tasks/123';
    mockClient.createTask.mockResolvedValue([{ name: expectedTaskName }]);

    const result = await createScheduledTask({
      queue: 'projects/my-project/locations/asia-northeast1/queues/reminder-queue',
      url: 'https://example.com/sendPush',
      payload: { reminderId: 'reminder-abc' },
      scheduleTime: new Date('2026-02-10T05:00:00Z'),
      serviceAccountEmail: 'sa@my-project.iam.gserviceaccount.com',
    });

    expect(result).toBe(expectedTaskName);
    expect(mockClient.createTask).toHaveBeenCalledTimes(1);

    const callArg = mockClient.createTask.mock.calls[0][0];
    expect(callArg.parent).toBe(
      'projects/my-project/locations/asia-northeast1/queues/reminder-queue'
    );
    expect(callArg.task.httpRequest.url).toBe('https://example.com/sendPush');
    expect(callArg.task.httpRequest.oidcToken.serviceAccountEmail).toBe(
      'sa@my-project.iam.gserviceaccount.com'
    );
    expect(callArg.task.scheduleTime.seconds).toBe(
      Math.floor(new Date('2026-02-10T05:00:00Z').getTime() / 1000)
    );

    // body は base64 エンコードされた JSON であることを確認
    const decodedBody = JSON.parse(Buffer.from(callArg.task.httpRequest.body, 'base64').toString());
    expect(decodedBody).toEqual({ reminderId: 'reminder-abc' });
  });

  it('タスク名が返されない場合はエラーをスロー', async () => {
    mockClient.createTask.mockResolvedValue([{}]);

    await expect(
      createScheduledTask({
        queue: 'projects/test/locations/asia-northeast1/queues/q',
        url: 'https://example.com/sendPush',
        payload: { reminderId: 'r1' },
        scheduleTime: new Date(),
        serviceAccountEmail: 'sa@test.iam.gserviceaccount.com',
      })
    ).rejects.toThrow('タスク作成失敗');
  });
});

describe('deleteTask', () => {
  let mockClient: {
    createTask: jest.Mock;
    deleteTask: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      createTask: jest.fn(),
      deleteTask: jest.fn(),
    };
    _setTasksClientForTesting(mockClient as unknown as CloudTasksClient);
  });

  it('タスクを削除する', async () => {
    mockClient.deleteTask.mockResolvedValue([{}]);

    await expect(
      deleteTask('projects/test/locations/asia-northeast1/queues/q/tasks/123')
    ).resolves.toBeUndefined();

    expect(mockClient.deleteTask).toHaveBeenCalledWith({
      name: 'projects/test/locations/asia-northeast1/queues/q/tasks/123',
    });
  });

  it('NOT_FOUND (gRPC code 5) の場合はエラーをスローしない', async () => {
    const notFoundError = Object.assign(new Error('NOT_FOUND'), { code: 5 });
    mockClient.deleteTask.mockRejectedValue(notFoundError);

    await expect(
      deleteTask('projects/test/locations/asia-northeast1/queues/q/tasks/404')
    ).resolves.toBeUndefined();
  });

  it('NOT_FOUND 以外のエラーはスローする', async () => {
    const internalError = Object.assign(new Error('INTERNAL'), { code: 13 });
    mockClient.deleteTask.mockRejectedValue(internalError);

    await expect(
      deleteTask('projects/test/locations/asia-northeast1/queues/q/tasks/err')
    ).rejects.toThrow('INTERNAL');
  });
});
