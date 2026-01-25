import { describe, expect, it } from 'vitest';
import { hasMoreThanLines } from '../../src/utils/textUtils';

describe('textUtils', () => {
  describe('hasMoreThanLines', () => {
    it('空文字列の場合、falseを返す', () => {
      expect(hasMoreThanLines('', 3)).toBe(false);
    });

    it('改行なしの短いテキストの場合、falseを返す', () => {
      expect(hasMoreThanLines('シンプルなテキスト', 3)).toBe(false);
    });

    it('1行のテキストの場合、falseを返す', () => {
      expect(hasMoreThanLines('これは1行のテキストです', 3)).toBe(false);
    });

    it('maxLinesと同じ行数の場合、falseを返す', () => {
      expect(hasMoreThanLines('行1\n行2\n行3', 3)).toBe(false);
    });

    it('maxLinesを超える行数の場合、trueを返す', () => {
      expect(hasMoreThanLines('行1\n行2\n行3\n行4', 3)).toBe(true);
    });

    it('maxLinesを大幅に超える行数の場合、trueを返す', () => {
      const manyLines = Array(10).fill('行').join('\n');
      expect(hasMoreThanLines(manyLines, 3)).toBe(true);
    });

    it('末尾に改行がある場合でも正しく計算する', () => {
      expect(hasMoreThanLines('行1\n行2\n行3\n', 3)).toBe(true);
    });

    it('連続改行を含む場合でも正しく計算する', () => {
      expect(hasMoreThanLines('行1\n\n行2', 3)).toBe(false);
      expect(hasMoreThanLines('行1\n\n\n行2', 3)).toBe(true);
    });

    it('maxLinesが1の場合、2行以上でtrueを返す', () => {
      expect(hasMoreThanLines('行1', 1)).toBe(false);
      expect(hasMoreThanLines('行1\n行2', 1)).toBe(true);
    });

    it('nullまたはundefinedが渡された場合、falseを返す', () => {
      expect(hasMoreThanLines(null as any, 3)).toBe(false);
      expect(hasMoreThanLines(undefined as any, 3)).toBe(false);
    });
  });
});
