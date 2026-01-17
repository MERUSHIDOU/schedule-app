import { EventEmitter } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SessionRunner } from './session-runner.js';
import type { SessionConfig, TestCase, TestResult, TestSummary } from './types.js';
import { WebSocketAggregator } from './websocket-aggregator.js';

export interface OrchestratorConfig {
  testCases: TestCase[];
  aggregatorPort: number;
  resultsDir: string;
}

export interface OrchestratorEvents {
  'aggregator-ready': (port: number) => void;
  start: (data: { totalScenarios: number; sessions: string[] }) => void;
  'session-status': (state: import('./types.js').SessionState) => void;
  'session-connected': (sessionId: string) => void;
  'session-disconnected': (sessionId: string) => void;
  warning: (data: { sessionId: string; message: string }) => void;
  'results-saved': (path: string) => void;
  complete: (results: TestResult[]) => void;
}

// セッション設定（固定3セッション）
const SESSION_CONFIGS = [
  { sessionId: 'test1', streamPort: 9223 },
  { sessionId: 'test2', streamPort: 9224 },
  { sessionId: 'test3', streamPort: 9225 },
] as const;

/**
 * 並列セッション実行オーケストレーター
 * 3セッションを並列で管理し、結果を集約
 */
export class Orchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private aggregator: WebSocketAggregator;
  private runners: SessionRunner[] = [];
  private results: TestResult[] = [];

  constructor(config: OrchestratorConfig) {
    super();
    this.config = config;
    this.aggregator = new WebSocketAggregator(config.aggregatorPort);

    this.aggregator.on('listening', port => {
      this.emit('aggregator-ready', port);
    });
  }

  /**
   * 全テストケースを並列実行
   * テストケース数がセッション数より多い場合は先頭3つを実行
   */
  async run(): Promise<TestResult[]> {
    const { testCases } = this.config;

    // 結果ディレクトリを作成
    await mkdir(this.config.resultsDir, { recursive: true });

    // テストケースを3セッションに分配
    const sessionConfigs = this.distributeTestCases(testCases);

    // 各セッションのRunnerを作成
    this.runners = sessionConfigs.map(config => {
      const runner = new SessionRunner(config, this.config.resultsDir);
      this.setupRunnerEvents(runner);
      return runner;
    });

    // 並列実行
    this.emit('start', {
      totalScenarios: sessionConfigs.length,
      sessions: sessionConfigs.map(c => c.sessionId),
    });

    const promises = this.runners.map(runner => runner.run());
    this.results = await Promise.all(promises);

    // 結果を保存
    await this.saveResults();

    this.emit('complete', this.results);

    // クリーンアップ
    await this.aggregator.close();

    return this.results;
  }

  /**
   * テストケースをセッションに分配
   * テストケースが少ない場合は使用するセッション数を減らす
   */
  private distributeTestCases(testCases: TestCase[]): SessionConfig[] {
    const configs: SessionConfig[] = [];
    const sessionCount = Math.min(testCases.length, SESSION_CONFIGS.length);

    for (let i = 0; i < sessionCount; i++) {
      const { sessionId, streamPort } = SESSION_CONFIGS[i];
      configs.push({
        sessionId,
        streamPort,
        testCase: testCases[i],
      });
    }

    return configs;
  }

  /**
   * Runner のイベントを集約サーバーに転送
   */
  private setupRunnerEvents(runner: SessionRunner): void {
    runner.on('status', state => {
      this.aggregator.broadcastStatus(state);
      this.emit('session-status', state);
    });

    runner.on('frame', frame => {
      this.aggregator.broadcastFrame(frame.sessionId, frame.data, frame.metadata);
    });

    runner.on('connected', sessionId => {
      this.emit('session-connected', sessionId);
    });

    runner.on('disconnected', sessionId => {
      this.aggregator.broadcastError(sessionId, 'WebSocket disconnected');
      this.emit('session-disconnected', sessionId);
    });

    runner.on('warning', warning => {
      this.emit('warning', warning);
    });
  }

  /**
   * テスト結果をJSONファイルに保存
   */
  private async saveResults(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsDir = this.config.resultsDir;

    // 全結果のサマリー
    const summary: TestSummary = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      results: this.results,
    };

    const summaryPath = join(resultsDir, `results_${timestamp}.json`);
    await writeFile(summaryPath, JSON.stringify(summary, null, 2));

    this.emit('results-saved', summaryPath);
  }
}
