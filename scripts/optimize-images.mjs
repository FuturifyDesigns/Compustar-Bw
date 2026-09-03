import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('public');

async function writeWebp(input, output, options) {
  const image = sharp(input).rotate();
  const resized = options.width
    ? image.resize({ width: options.width, withoutEnlargement: true })
    : image;
  await resized.webp({ quality: options.quality, effort: 4 }).toFile(output);
}

async function convertDir(dir, { width, quality, extra }) {
  const folder = path.join(root, dir);
  const files = (await readdir(folder)).filter((file) => /\.(jpe?g|png)$/i.test(file));
  await Promise.all(files.map(async (file) => {
    const input = path.join(folder, file);
    const output = path.join(folder, file.replace(/\.(jpe?g|png)$/i, '.webp'));
    await writeWebp(input, output, { width, quality });
    if (extra) await extra(input, file);
  }));
}

await mkdir(path.join(root, 'adverts', 'thumbs'), { recursive: true });

await convertDir('products', { width: 800, quality: 70 });
await convertDir('adverts', {
  width: 1400,
  quality: 76,
  extra: async (input, file) => {
    await writeWebp(input, path.join(root, 'adverts', 'thumbs', file.replace(/\.(jpe?g|png)$/i, '.webp')), {
      width: 280,
      quality: 62
    });
  }
});
await convertDir('context', { width: 960, quality: 70 });

await writeWebp(path.join(root, 'hero-bg.png'), path.join(root, 'hero-bg.webp'), { width: 1920, quality: 68 });
await writeWebp(path.join(root, 'logo.png'), path.join(root, 'logo.webp'), { width: 360, quality: 82 });

const compressedLogo = path.join(root, 'logo.compressed.png');
await sharp(path.join(root, 'logo.png'))
  .rotate()
  .resize({ width: 512, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(compressedLogo);

console.log('Image optimization complete.');
