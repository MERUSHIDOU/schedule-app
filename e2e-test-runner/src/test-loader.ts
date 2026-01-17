import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { HookFunction, TestCase, TestFunction, TestSuite } from './types.js';

/**
 * vitest形式のテストファイルからTestCaseを抽出
 *
 * テストファイルはvitestをインポートしているが、
 * グローバル関数をオーバーライドして独自のテストケース収集を行う
 */
export async function loadTestFile(filePath: string): Promise<TestCase[]> {
  const testCases: TestCase[] = [];
  const suites: TestSuite[] = [];
  let currentSuite: TestSuite | null = null;

  // vitestモジュールをモック
  const vitestMock = {
    describe: (name: string, fn: () => void) => {
      const suite: TestSuite = {
        name,
        tests: [],
      };
      currentSuite = suite;
      suites.push(suite);
      fn();
      currentSuite = null;
    },
    test: (name: string, fn: TestFunction) => {
      if (currentSuite) {
        currentSuite.tests.push({ name, fn });
      }
    },
    beforeEach: (fn: HookFunction) => {
      if (currentSuite) {
        currentSuite.beforeEach = fn;
      }
    },
    afterEach: (fn: HookFunction) => {
      if (currentSuite) {
        currentSuite.afterEach = fn;
      }
    },
    expect: (value: any) => ({
      toBe: (expected: any) => {},
      toEqual: (expected: any) => {},
      toBeTruthy: () => {},
      toBeFalsy: () => {},
      toBeNull: () => {},
      toBeUndefined: () => {},
      toBeDefined: () => {},
      toContain: (expected: any) => {},
      toHaveLength: (expected: number) => {},
      toMatch: (expected: any) => {},
      toThrow: () => {},
    }),
  };

  // 元のグローバル関数を保存
  const global = globalThis as any;
  const originalDescribe = global.describe;
  const originalTest = global.test;
  const originalBeforeEach = global.beforeEach;
  const originalAfterEach = global.afterEach;
  const originalExpect = global.expect;

  // グローバル関数をオーバーライド
  global.describe = vitestMock.describe;
  global.test = vitestMock.test;
  global.beforeEach = vitestMock.beforeEach;
  global.afterEach = vitestMock.afterEach;
  global.expect = vitestMock.expect;

  try {
    // ファイルを動的にインポート（キャッシュを回避）
    const fileUrl = pathToFileURL(filePath).href + '?t=' + Date.now();
    await import(fileUrl);

    // TestCaseに変換
    for (const suite of suites) {
      for (const test of suite.tests) {
        testCases.push({
          suiteName: suite.name,
          testName: test.name,
          beforeEach: suite.beforeEach,
          afterEach: suite.afterEach,
          testFn: test.fn,
        });
      }
    }
  } finally {
    // グローバル関数を復元
    if (originalDescribe !== undefined) global.describe = originalDescribe;
    else delete global.describe;

    if (originalTest !== undefined) global.test = originalTest;
    else delete global.test;

    if (originalBeforeEach !== undefined) global.beforeEach = originalBeforeEach;
    else delete global.beforeEach;

    if (originalAfterEach !== undefined) global.afterEach = originalAfterEach;
    else delete global.afterEach;

    if (originalExpect !== undefined) global.expect = originalExpect;
    else delete global.expect;
  }

  return testCases;
}

/**
 * ディレクトリから全テストファイルを読み込み
 */
export async function loadTestFiles(testsPath: string): Promise<TestCase[]> {
  const files = await readdir(testsPath);
  const testFiles = files.filter(f => f.endsWith('.test.ts') || f.endsWith('.test.js'));

  if (testFiles.length === 0) {
    throw new Error(`No test files found in: ${testsPath}`);
  }

  const allTestCases: TestCase[] = [];
  for (const file of testFiles) {
    const testCases = await loadTestFile(join(testsPath, file));
    allTestCases.push(...testCases);
  }

  return allTestCases;
}

/**
 * カンマ区切りのパスリストからテストケースを読み込む
 */
export async function loadTestsFromPaths(pathList: string): Promise<TestCase[]> {
  const paths = pathList.split(',').map(p => p.trim());
  const allTestCases: TestCase[] = [];

  for (const path of paths) {
    const testCases = await loadTestFiles(path);
    allTestCases.push(...testCases);
  }

  return allTestCases;
}
