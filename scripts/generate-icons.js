import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// カレンダーアイコンSVG
const calendarSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#2563eb"/>
    </linearGradient>
  </defs>
  <!-- 背景 -->
  <rect x="32" y="64" width="448" height="416" rx="40" fill="url(#bg)"/>
  <!-- ヘッダー部分 -->
  <rect x="32" y="64" width="448" height="100" rx="40" fill="#2563eb"/>
  <rect x="32" y="124" width="448" height="40" fill="#2563eb"/>
  <!-- カレンダーリング -->
  <rect x="120" y="32" width="24" height="80" rx="12" fill="#1e40af"/>
  <rect x="120" y="32" width="24" height="80" rx="12" fill="#fff" opacity="0.9"/>
  <rect x="368" y="32" width="24" height="80" rx="12" fill="#1e40af"/>
  <rect x="368" y="32" width="24" height="80" rx="12" fill="#fff" opacity="0.9"/>
  <!-- カレンダーグリッド -->
  <rect x="72" y="200" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="152" y="200" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="232" y="200" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="312" y="200" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="392" y="200" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="72" y="280" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="152" y="280" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="232" y="280" width="56" height="56" rx="8" fill="#60a5fa"/>
  <rect x="312" y="280" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="392" y="280" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="72" y="360" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="152" y="360" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="232" y="360" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="312" y="360" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
  <rect x="392" y="360" width="56" height="56" rx="8" fill="#fff" opacity="0.95"/>
</svg>
`;

async function generateIcons() {
  const svgBuffer = Buffer.from(calendarSvg);

  // 512x512 PWAアイコン
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'pwa-512x512.png'));
  console.log('Generated: pwa-512x512.png');

  // 192x192 PWAアイコン
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'pwa-192x192.png'));
  console.log('Generated: pwa-192x192.png');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated: apple-touch-icon.png');

  // favicon.svg も更新
  writeFileSync(join(publicDir, 'favicon.svg'), calendarSvg.trim());
  console.log('Generated: favicon.svg');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
