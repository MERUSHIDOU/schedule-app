import { EventEmitter } from 'node:events';
import { type Browser, type BrowserContext, chromium, type Page } from 'playwright';
import WebSocket from 'ws';
import type {
  FrameMessage,
  FrameMetadata,
  SessionConfig,
  SessionState,
  TestResult,
} from './types.js';

export interface SessionRunnerEvents {
  status: (state: SessionState) => void;
  frame: (data: { sessionId: string; data: string; metadata: FrameMetadata }) => void;
  connected: (sessionId: string) => void;
  disconnected: (sessionId: string) => void;
  reconnecting: (data: { sessionId: string; attempt: number }) => void;
  warning: (data: { sessionId: string; message: string }) => void;
}

/**
 * 個別セッションの実行を管理
 * テストケースの実行とWebSocket接続を担当
 */
export class SessionRunner extends EventEmitter {
  private config: SessionConfig;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private wsClient: WebSocket | null = null;
  private state: SessionState;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private resultsDir: string;

  constructor(config: SessionConfig, resultsDir: string) {
    super();
    this.config = config;
    this.resultsDir = resultsDir;
    this.state = {
      sessionId: config.sessionId,
      status: 'pending',
      testName: config.testCase.testName,
      suiteName: config.testCase.suiteName,
    };
  }

  /**
   * agent-browserのWebSocketストリームに接続
   */
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:${this.config.streamPort}`;
      this.wsClient = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        if (this.wsClient?.readyState !== WebSocket.OPEN) {
          this.wsClient?.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);

      this.wsClient.on('open', () => {
        clearTimeout(timeout);
        this.reconnectAttempts = 0;
        this.emit('connected', this.config.sessionId);
        resolve();
      });

      this.wsClient.on('message', data => {
        try {
          const message = JSON.parse(data.toString()) as FrameMessage;
          if (message.type === 'frame') {
            this.emit('frame', {
              sessionId: this.config.sessionId,
              data: message.data,
              metadata: message.metadata,
            });
          }
        } catch {
          // Binary data or invalid JSON - ignore
        }
      });

      this.wsClient.on('close', () => {
        clearTimeout(timeout);
        if (this.state.status === 'running') {
          this.handleReconnect();
        }
      });

      this.wsClient.on('error', () => {
        clearTimeout(timeout);
        if (this.reconnectAttempts === 0) {
          // 初回接続エラーは再試行
          reject(new Error('WebSocket connection failed'));
        }
      });
    });
  }

  /**
   * WebSocket再接続処理（指数バックオフ）
   */
  private handleReconnect(): void {
    if (this.state.status === 'completed' || this.state.status === 'failed') {
      return;
    }

    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      this.emit('reconnecting', {
        sessionId: this.config.sessionId,
        attempt: this.reconnectAttempts,
      });
      setTimeout(() => {
        this.connectWebSocket().catch(() => {
          // 再接続失敗は次の試行で処理
        });
      }, 1000 * this.reconnectAttempts);
    } else {
      this.emit('disconnected', this.config.sessionId);
    }
  }

  /**
   * テストケースを実行
   */
  async run(): Promise<TestResult> {
    this.state.status = 'running';
    this.state.startedAt = new Date();
    this.emitStatus();

    const startTime = Date.now();

    try {
      // Playwright ブラウザを起動
      this.browser = await chromium.launch({
        headless: true,
      });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();

      // WebSocket接続を試行
      await this.delay(500);
      try {
        await this.connectWebSocket();
      } catch {
        // WebSocket接続失敗は警告のみ（テスト継続）
        this.emit('warning', {
          sessionId: this.config.sessionId,
          message: 'WebSocket connection failed, continuing without streaming',
        });
      }

      // beforeEach フックを実行
      if (this.config.testCase.beforeEach) {
        await this.config.testCase.beforeEach(this.page);
      }

      // テスト関数を実行
      await this.config.testCase.testFn(this.page);

      // afterEach フックを実行
      if (this.config.testCase.afterEach) {
        await this.config.testCase.afterEach(this.page);
      }

      this.state.status = 'completed';
      this.state.completedAt = new Date();
      this.emitStatus();

      return {
        suiteName: this.config.testCase.suiteName,
        testName: this.config.testCase.testName,
        sessionId: this.config.sessionId,
        status: 'passed',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.state.status = 'failed';
      this.state.error = error instanceof Error ? error.message : String(error);
      this.state.completedAt = new Date();
      this.emitStatus();

      return {
        suiteName: this.config.testCase.suiteName,
        testName: this.config.testCase.testName,
        sessionId: this.config.sessionId,
        status: 'failed',
        duration: Date.now() - startTime,
        error: this.state.error,
      };
    } finally {
      await this.cleanup();
    }
  }

  private emitStatus(): void {
    this.emit('status', { ...this.state });
  }

  private async cleanup(): Promise<void> {
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
