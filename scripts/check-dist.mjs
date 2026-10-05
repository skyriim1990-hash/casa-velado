// Blueprint 6.8 / 10.2: the published site contains no JPEG or PNG.
// Allowed non-WebP rasters: favicon.ico and apple-touch-icon.png only.
// Run after `astro build` (the `build` script does this automatically).
import { readdir, readFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = new URL('../dist/', import.meta.url);
const BANNED = new Set(['.jpg', '.jpeg', '.png', '.gif', '.avif', '.bmp', '.tif', '.tiff']);
const ALLOWED_FILES = new Set(['favicon.ico', 'apple-touch-icon.png']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return files.flat();
}

let files;
try {
  files = await walk(fileURLToPath(DIST));
} catch {
  console.error('dist/ not found. Run `astro build` first.');
  process.exit(1);
}

const problems = [];

for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (BANNED.has(ext) && !ALLOWED_FILES.has(basename(file))) {
    problems.push(`Non-WebP raster in dist/: ${file}`);
  }
  if (ext === '.html') {
    const html = await readFile(file, 'utf8');
    const refs = html.match(/[^"'\s,()]+\.(?:jpe?g|png|gif|avif)(?=["'\s,)?#])/gi) ?? [];
    for (const ref of refs) {
      if (!ALLOWED_FILES.has(basename(ref))) problems.push(`${file} references ${ref}`);
    }
  }
}

if (problems.length > 0) {
  console.error('Image format check failed (WebP only, blueprint 6.8):');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`Image format check passed: ${files.length} files in dist/, no JPEG/PNG.`);
