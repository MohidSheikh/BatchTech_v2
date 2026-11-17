import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import zlib from 'node:zlib';
import {
  compressBufferBrotli,
  compressDirectoryTextAssetsBrotli,
  isTextAssetPath,
} from './brotliCompression.ts';

test('isTextAssetPath matches text formats and excludes binary and precompressed files', () => {
  assert.equal(isTextAssetPath('dist/index.html'), true);
  assert.equal(isTextAssetPath('dist/assets/index-abc.js'), true);
  assert.equal(isTextAssetPath('dist/assets/index-abc.css'), true);
  assert.equal(isTextAssetPath('dist/robots.txt'), true);
  assert.equal(isTextAssetPath('dist/sitemap.xml'), true);
  assert.equal(isTextAssetPath('dist/icon.SVG'), true);
  assert.equal(isTextAssetPath('dist/manifest.json'), true);

  assert.equal(isTextAssetPath('dist/assets/photo.avif'), false);
  assert.equal(isTextAssetPath('dist/assets/photo.webp'), false);
  assert.equal(isTextAssetPath('dist/favicon.png'), false);
  assert.equal(isTextAssetPath('dist/assets/index-abc.js.br'), false);
  assert.equal(isTextAssetPath('dist/assets/index-abc.js.gz'), false);
});

test('compressBufferBrotli compresses text payloads smaller and round-trips losslessly', async () => {
  const sample = Buffer.from(
    '.hero{background:#080D19;color:#FFFFFF;}'.repeat(40),
    'utf8'
  );
  const compressed = await compressBufferBrotli(sample);
  assert.ok(compressed.length < sample.length * 0.25);
  assert.equal(zlib.brotliDecompressSync(compressed).toString('utf8'), sample.toString('utf8'));
});

test('compressDirectoryTextAssetsBrotli writes .br files only for text assets', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bt-br-'));
  try {
    await fs.mkdir(path.join(tmpDir, 'assets'), { recursive: true });
    const css = '.card{display:flex;gap:1rem;}'.repeat(20);
    const html = '<!doctype html><html><body>BatchTech</body></html>';
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    await fs.writeFile(path.join(tmpDir, 'index.html'), html, 'utf8');
    await fs.writeFile(path.join(tmpDir, 'assets', 'app.css'), css, 'utf8');
    await fs.writeFile(path.join(tmpDir, 'assets', 'logo.png'), binary);

    const summary = await compressDirectoryTextAssetsBrotli(tmpDir);
    assert.equal(summary.compressedCount, 2);
    assert.ok(summary.brotliBytes < summary.originalBytes);

    const htmlBr = await fs.readFile(path.join(tmpDir, 'index.html.br'));
    const cssBr = await fs.readFile(path.join(tmpDir, 'assets', 'app.css.br'));
    assert.equal(zlib.brotliDecompressSync(htmlBr).toString('utf8'), html);
    assert.equal(zlib.brotliDecompressSync(cssBr).toString('utf8'), css);

    await assert.rejects(() => fs.stat(path.join(tmpDir, 'assets', 'logo.png.br')));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
