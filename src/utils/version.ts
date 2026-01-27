interface VersionInfo {
  version: string;
  buildDate: string;
}

/**
 * バージョン情報を取得する
 * ビルド時にViteの define オプションで注入されたグローバル定数を返す
 */
export function getVersionInfo(): VersionInfo {
  return {
    version: __APP_VERSION__,
    buildDate: __BUILD_DATE__,
  };
}

/**
 * "v" プレフィックス付きのバージョン文字列を返す
 * 例: "v1.0.0"
 */
export function getFormattedVersion(): string {
  return `v${__APP_VERSION__}`;
}

/**
 * ビルド日時を "YYYY/MM/DD HH:MM" 形式にフォーマットする
 * Safari互換: ISO 8601 形式の文字列を new Date() でパースする
 */
export function getFormattedBuildDate(): string {
  const date = new Date(__BUILD_DATE__);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * バージョン情報をコンソールに出力する
 * アプリ起動時に呼び出して、開発者ツールで確認できるようにする
 */
export function logVersionToConsole(): void {
  const version = getFormattedVersion();
  const buildDate = getFormattedBuildDate();

  console.log(
    `%c${version}%c | Build: ${buildDate}`,
    'color: #3b82f6; font-weight: bold;',
    'color: #6b7280;'
  );
}
