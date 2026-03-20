import { CloudTasksClient } from '@google-cloud/tasks';
import * as logger from 'firebase-functions/logger';

// テスト時に差し替え可能にするため遅延初期化
let _tasksClient: CloudTasksClient | null = null;

/**
 * Cloud Tasks クライアントを取得する (遅延初期化)
 * @return {CloudTasksClient} クライアントインスタンス
 */
function getTasksClient(): CloudTasksClient {
  if (!_tasksClient) {
    _tasksClient = new CloudTasksClient();
  }
  return _tasksClient;
}

/**
 * テスト用: クライアントを外部から注入する
 * @param {CloudTasksClient} client 注入するクライアント
 */
export function _setTasksClientForTesting(client: CloudTasksClient): void {
  _tasksClient = client;
}

export interface TaskPayload {
  reminderId: string;
}

export interface CreateTaskOptions {
  queue: string;
  url: string;
  payload: TaskPayload;
  scheduleTime: Date;
  serviceAccountEmail: string;
}

/**
 * Cloud Tasks にスケジュール済みタスクを作成し、タスク名を返す
 * @param {CreateTaskOptions} options タスク作成オプション
 * @return {Promise<string>} 作成されたタスクの完全修飾名
 */
export async function createScheduledTask(options: CreateTaskOptions): Promise<string> {
  const { queue, url, payload, scheduleTime, serviceAccountEmail } = options;

  const task = {
    httpRequest: {
      httpMethod: 'POST' as const,
      url,
      headers: {
        'Content-Type': 'application/json',
      },
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      oidcToken: {
        serviceAccountEmail,
      },
    },
    scheduleTime: {
      seconds: Math.floor(scheduleTime.getTime() / 1000),
    },
  };

  const [response] = await getTasksClient().createTask({
    parent: queue,
    task,
  });

  if (!response.name) {
    throw new Error('タスク作成失敗: タスク名が返されませんでした');
  }

  return response.name;
}

/**
 * Cloud Tasks のタスクを削除する。タスクが存在しない場合はスキップする
 * @param {string} taskName 削除するタスクの完全修飾名
 */
export async function deleteTask(taskName: string): Promise<void> {
  try {
    await getTasksClient().deleteTask({ name: taskName });
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      logger.info(`タスク ${taskName} は存在しないか既に実行済みです (スキップ)`);
      return;
    }
    throw error;
  }
}

/**
 * gRPC NOT_FOUND エラーかどうかを判定する
 * @param {unknown} error 判定対象のエラー
 * @return {boolean} NOT_FOUND エラーの場合は true
 */
function isNotFoundError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code: number }).code === 5; // gRPC NOT_FOUND
  }
  return false;
}
