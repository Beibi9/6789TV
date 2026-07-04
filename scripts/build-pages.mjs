import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist');

const entries = [
  'index.html',
  'player.html',
  'watch.html',
  'about.html',
  'manifest.json',
  'robots.txt',
  'service-worker.js',
  'VERSION.txt',
  'css',
  'js',
  'libs',
  'image',
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const entry of entries) {
  const from = path.join(rootDir, entry);
  if (!existsSync(from)) {
    throw new Error(`Missing required Pages asset: ${entry}`);
  }

  await cp(from, path.join(outDir, entry), {
    recursive: true,
    force: true,
  });
}

console.log(`Cloudflare Pages assets written to ${path.relative(rootDir, outDir)}`);
