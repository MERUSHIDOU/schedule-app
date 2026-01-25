/**
 * テキストが指定の行数を超えているかを判定
 * @param text - 判定対象のテキスト
 * @param maxLines - 最大行数
 * @returns テキストが最大行数を超えている場合true
 */
export function hasMoreThanLines(text: string | null | undefined, maxLines: number): boolean {
  if (!text) return false;
  const lines = text.split('\n');
  return lines.length > maxLines;
}
