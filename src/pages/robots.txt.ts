import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/site';

// /styleguide is kept out of search by `noindex` on the page and by its absence from the
// sitemap. It is deliberately not Disallowed here: a crawler that cannot fetch the page
// cannot see its noindex.
export const GET: APIRoute = ({ site }) => {
  const sitemap = absoluteUrl('/sitemap.xml', site);
  const lines = ['User-agent: *', 'Allow: /', ...(sitemap ? ['', `Sitemap: ${sitemap}`] : [])];
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
