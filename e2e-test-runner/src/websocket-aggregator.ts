import { EventEmitter } from 'node:events';
import { WebSocket, WebSocketServer } from 'ws';
import type { AggregatedMessage, FrameMetadata, SessionState } from './types.js';

export interface WebSocketAggregatorEvents {
  listening: (port: number) => void;
  connection: (clientCount: number) => void;
  disconnection: (clientCount: number) => void;
}

/**
 * 複数セッションのWebSocketストリームを集約し、
 * ダッシュボードへ中継するサーバー
 */
export class WebSocketAggregator extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private sessionStates: Map<string, SessionState> = new Map();
  private port: number;

  constructor(port: number) {
    super();
    this.port = port;
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', ws => {
      this.clients.add(ws);
      this.emit('connection', this.clients.size);

      // 新規接続時に現在のセッション状態を送信
      for (const [sessionId, state] of this.sessionStates) {
        const message: AggregatedMessage = {
          type: 'status',
          sessionId,
          status: state,
        };
        ws.send(JSON.stringify(message));
      }

      ws.on('close', () => {
        this.clients.delete(ws);
        this.emit('disconnection', this.clients.size);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
        this.emit('disconnection', this.clients.size);
      });
    });

    this.wss.on('listening', () => {
      this.emit('listening', port);
    });

    this.wss.on('error', error => {
      console.error('WebSocket server error:', error);
    });
  }

  /**
   * フレームデータをブロードキャスト
   */
  broadcastFrame(sessionId: string, data: string, metadata: FrameMetadata): void {
    const message: AggregatedMessage = {
      type: 'frame',
      sessionId,
      data,
      metadata,
    };
    this.broadcast(message);
  }

  /**
   * セッション状態をブロードキャスト
   */
  broadcastStatus(state: SessionState): void {
    this.sessionStates.set(state.sessionId, state);
    const message: AggregatedMessage = {
      type: 'status',
      sessionId: state.sessionId,
      status: state,
    };
    this.broadcast(message);
  }

  /**
   * エラーをブロードキャスト
   */
  broadcastError(sessionId: string, error: string): void {
    const message: AggregatedMessage = {
      type: 'error',
      sessionId,
      error,
    };
    this.broadcast(message);
  }

  /**
   * 全クライアントにメッセージをブロードキャスト
   */
  private broadcast(message: AggregatedMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  /**
   * 接続中のクライアント数を取得
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * サーバーを閉じる
   */
  close(): Promise<void> {
    return new Promise(resolve => {
      // 全クライアントを閉じる
      for (const client of this.clients) {
        client.close();
      }
      this.clients.clear();

      this.wss.close(() => {
        resolve();
      });
    });
  }
}
