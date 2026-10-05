// @ts-check
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

// PUBLIC_SITE_URL is a configuration placeholder. No production domain has been
// decided, and none is invented here. Set it in `.env` (see `.env.example`) or in the
// host's environment once the real URL exists. While it is empty, the site emits no
// canonical, og:url, absolute og:image or sitemap entries.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: fall through to the real environment.
}

const siteUrl = (process.env.PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '');

if (!siteUrl && process.argv.includes('build')) {
  console.warn(
    '[casa-velado] PUBLIC_SITE_URL is not set. Canonical URLs, og:url, absolute og:image and sitemap entries are omitted.',
  );
}

// Astro copies the source file of every photograph the image component loads (a JPEG, say) into
// dist/_astro next to the WebP versions. Pages only ever use the WebP, so the original is dead
// weight and would break the WebP-only rule (scripts/check-dist.mjs). This removes the raster
// originals in _astro that no page or stylesheet points to.
/** @type {import('astro').AstroIntegration} */
const dropUnusedOriginals = {
  name: 'casa-velado:drop-unused-originals',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const root = fileURLToPath(dir);
      const assets = join(root, '_astro');
      if (!existsSync(assets)) return;

      // Everything the pages, stylesheets and scripts say, to see what is still pointed to.
      let text = '';
      /** @param {string} folder */
      const walk = (folder) => {
        for (const e of readdirSync(folder, { withFileTypes: true })) {
          const path = join(folder, e.name);
          if (e.isDirectory()) walk(path);
          else if (/.(html|css|js|json|xml|txt)$/.test(e.name)) text += readFileSync(path, 'utf8');
        }
      };
      walk(root);

      for (const name of readdirSync(assets)) {
        if (/.(jpe?g|png|tiff?)$/i.test(name) && !text.includes(name)) {
          rmSync(join(assets, name));
        }
      }
    },
  },
};

export default defineConfig({
  integrations: [dropUnusedOriginals],

  ...(siteUrl ? { site: siteUrl } : {}),

  // /cigars, not /cigars/ (blueprint section 2.1).
  trailingSlash: 'never',
  build: { format: 'file' },

  // Images: WebP only (blueprint 6.8). The service wrapper coerces every raster output
  // to WebP, so the default PNG fallback of <Picture> can never reach dist/.
  image: {
    service: { entrypoint: './src/lib/webp-image-service.mjs' },
  },

  // Astro's HTML compressor drops the space when a line ends right before an inline element
  // ("is", newline, "<code>" becomes "is<code>"), which glues words together in running text.
  compressHTML: false,

  // No Astro client router, no prefetch, no dev toolbar.
  prefetch: false,
  devToolbar: { enabled: false },
});
