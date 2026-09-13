import sharp from 'sharp';
import path from 'node:path';

const logo = path.resolve('public/logo.png');

async function writeIcon(size, file, { maskable = false } = {}) {
  const pad = maskable ? Math.round(size * 0.18) : Math.round(size * 0.06);
  const inner = size - pad * 2;
  const mark = await sharp(logo)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: maskable ? '#98080f' : '#000000'
    }
  })
    .composite([{ input: mark, left: pad, top: pad }])
    .png({ compressionLevel: 9 })
    .toFile(path.resolve('public', file));
}

await writeIcon(192, 'pwa-192.png');
await writeIcon(512, 'pwa-512.png');
await writeIcon(512, 'pwa-maskable-512.png', { maskable: true });
await writeIcon(16, 'favicon-16.png');
await writeIcon(32, 'favicon-32.png');
await writeIcon(48, 'favicon-48.png');
await writeIcon(48, 'favicon.png');
await writeIcon(180, 'apple-touch-icon.png');
console.log('PWA icons written.');
