import { resolve } from 'node:path';
import { program } from 'commander';
import { Orchestrator } from './orchestrator.js';
import { loadTestFiles, loadTestsFromPaths } from './test-loader.js';
import type { TestResult } from './types.js';

async function main(): Promise<void> {
  program
    .name('e2e-test-runner')
    .description('E2E Test Runner with parallel browser sessions using agent-browser')
    .option('-t, --tests <path>', 'Tests directory or comma-separated file paths', 'tests')
    .option('-p, --port <number>', 'WebSocket aggregator port for dashboard', '8080')
    .option('-r, --results <dir>', 'Results output directory', 'results')
    .parse();

  const options = program.opts<{
    tests: string;
    port: string;
    results: string;
  }>();

  const testsPath = resolve(options.tests);
  const aggregatorPort = parseInt(options.port, 10);
  const resultsDir = resolve(options.results);

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           E2E Test Runner - Parallel Execution             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Tests:      ${testsPath}`);
  console.log(`  Port:       ${aggregatorPort}`);
  console.log(`  Results:    ${resultsDir}`);
  console.log('');

  try {
    // テストケース読み込み
    const testCases = options.tests.includes(',')
      ? await loadTestsFromPaths(options.tests)
      : await loadTestFiles(testsPath);

    console.log(`  Loaded ${testCases.length} test case(s):`);
    for (const testCase of testCases) {
      console.log(`    - ${testCase.suiteName} > ${testCase.testName}`);
    }
    console.log('');

    if (testCases.length === 0) {
      console.error('Error: No test cases found. Exiting.');
      process.exit(1);
    }

    if (testCases.length > 3) {
      console.log(`  Note: Only first 3 test cases will run in parallel.`);
      console.log('');
    }

    // オーケストレーター作成
    const orchestrator = new Orchestrator({
      testCases,
      aggregatorPort,
      resultsDir,
    });

    // イベントハンドリング
    orchestrator.on('aggregator-ready', port => {
      console.log('────────────────────────────────────────────────────────────');
      console.log(`  Dashboard WebSocket: ws://localhost:${port}`);
      console.log(`  Open viewer/index.html in browser to view live dashboard`);
      console.log('────────────────────────────────────────────────────────────');
      console.log('');
    });

    orchestrator.on('start', ({ totalScenarios, sessions }) => {
      console.log(`  Starting ${totalScenarios} scenario(s) on sessions: ${sessions.join(', ')}`);
      console.log('');
    });

    orchestrator.on('session-status', state => {
      const statusIcon = getStatusIcon(state.status);
      const testInfo = `${state.suiteName} > ${state.testName}`;
      console.log(`  ${statusIcon} [${state.sessionId}] ${state.status.padEnd(10)} ${testInfo}`);
    });

    orchestrator.on('session-connected', sessionId => {
      console.log(`  📡 [${sessionId}] WebSocket stream connected`);
    });

    orchestrator.on('session-disconnected', sessionId => {
      console.log(`  ⚠️  [${sessionId}] WebSocket stream disconnected`);
    });

    orchestrator.on('warning', ({ sessionId, message }) => {
      console.log(`  ⚠️  [${sessionId}] Warning: ${message}`);
    });

    orchestrator.on('results-saved', path => {
      console.log('');
      console.log(`  Results saved to: ${path}`);
    });

    orchestrator.on('complete', results => {
      console.log('');
      console.log('════════════════════════════════════════════════════════════');
      console.log('                       Test Results                          ');
      console.log('════════════════════════════════════════════════════════════');
      console.log('');

      for (const result of results) {
        const statusIcon = result.status === 'passed' ? '✅' : '❌';
        const testInfo = `${result.suiteName} > ${result.testName}`;
        console.log(`  ${statusIcon} [${result.sessionId}] ${testInfo}`);
        console.log(`     Duration: ${result.duration}ms`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
        console.log('');
      }

      const passed = results.filter((r: TestResult) => r.status === 'passed').length;
      const failed = results.filter((r: TestResult) => r.status === 'failed').length;

      console.log('────────────────────────────────────────────────────────────');
      console.log(`  Summary: ${passed} passed, ${failed} failed`);
      console.log('────────────────────────────────────────────────────────────');
      console.log('');

      process.exit(failed > 0 ? 1 : 0);
    });

    // 実行
    await orchestrator.run();
  } catch (error) {
    console.error('');
    console.error('Fatal error:', error instanceof Error ? error.message : error);
    console.error('');
    process.exit(1);
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'running':
      return '🔄';
    case 'completed':
      return '✅';
    case 'failed':
      return '❌';
    default:
      return '  ';
  }
}

main();
