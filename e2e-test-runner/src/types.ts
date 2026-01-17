import type { Page } from 'playwright';

// テストケース関連の型
export type TestFunction = (page: Page) => Promise<void>;
export type HookFunction = (page: Page) => Promise<void>;

export interface TestCase {
  suiteName: string; // describe ブロックの名前
  testName: string; // test ブロックの名前
  beforeEach?: HookFunction;
  afterEach?: HookFunction;
  testFn: TestFunction;
}

export interface TestSuite {
  name: string;
  beforeEach?: HookFunction;
  afterEach?: HookFunction;
  tests: Array<{
    name: string;
    fn: TestFunction;
  }>;
}

// セッション管理の型
export interface SessionConfig {
  sessionId: string; // test1, test2, test3
  streamPort: number; // 9223, 9224, 9225
  testCase: TestCase;
}

export type SessionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface SessionState {
  sessionId: string;
  status: SessionStatus;
  testName: string;
  suiteName: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// WebSocketフレーム型（agent-browserから受信）
export interface FrameMetadata {
  offsetTop?: number;
  offsetLeft?: number;
  pageScaleFactor?: number;
  deviceWidth: number;
  deviceHeight: number;
  scrollOffsetX?: number;
  scrollOffsetY?: number;
  timestamp?: number;
}

export interface FrameMessage {
  type: 'frame';
  data: string; // base64 encoded JPEG
  metadata: FrameMetadata;
}

// ダッシュボード向け集約メッセージ
export interface AggregatedFrameMessage {
  type: 'frame';
  sessionId: string;
  data: string;
  metadata: FrameMetadata;
}

export interface AggregatedStatusMessage {
  type: 'status';
  sessionId: string;
  status: SessionState;
}

export interface AggregatedErrorMessage {
  type: 'error';
  sessionId: string;
  error: string;
}

export type AggregatedMessage =
  | AggregatedFrameMessage
  | AggregatedStatusMessage
  | AggregatedErrorMessage;

// テスト結果
export interface TestResult {
  suiteName: string;
  testName: string;
  sessionId: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
}

// テスト結果サマリー
export interface TestSummary {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  totalDuration: number;
  results: TestResult[];
}
