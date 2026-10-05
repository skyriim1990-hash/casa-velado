import type { APIRoute } from 'astro';
import { getArticles, getProducts, productPath } from '../lib/catalogue';
import { absoluteUrl } from '../lib/site';

// Static pages are discovered from src/pages. The product pages are listed from the catalogue
// (Stage 8); the journal entries (Stage 11) likewise.
// /styleguide and /404 are excluded on purpose (blueprint 2.1, 9.2).
const EXCLUDED = ['/styleguide', '/404'];

const pageFiles = Object.keys(import.meta.glob('/src/pages/**/*.astro'));

const staticPaths = pageFiles
  .map((file) =>
    file
      .replace('/src/pages', '')
      .replace(/\.astro$/, '')
      .replace(/\/index$/, ''),
  )
  .map((path) => path || '/')
  .filter((path) => !path.includes('[') && !EXCLUDED.includes(path))
  .sort();

export const GET: APIRoute = async ({ site }) => {
  const productPaths = (await getProducts()).map((product) => productPath(product));
  const articlePaths = (await getArticles()).map((entry) => `/journal/${entry.id}`);
  const urls = [...staticPaths, ...productPaths, ...articlePaths]
    .map((path) => absoluteUrl(path, site))
    .filter((url): url is string => url !== undefined);

  const note = site ? '' : '<!-- PUBLIC_SITE_URL is not configured, so no URLs are listed. -->\n';
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n${note}` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((url) => `  <url><loc>${url}</loc></url>\n`).join('') +
    `</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
