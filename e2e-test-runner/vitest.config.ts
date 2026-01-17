import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // テストファイルのパターン
    include: ['tests/**/*.test.ts'],

    // グローバルAPI（describe, test, expect等）を有効化
    globals: true,

    // 環境設定
    environment: 'node',

    // タイムアウト設定
    testTimeout: 60000,

    // 並列実行を無効化（独自のOrchestratorで管理）
    threads: false,
    isolate: false,
  },
});
