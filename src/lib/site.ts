// Site-wide constants and URL helpers.
// Blueprint 9.2: page titles `X — Casa Velado`, home `Casa Velado — Cigars from Estelí, Nicaragua`;
// meta descriptions in English, at most 155 characters.

export const SITE_NAME = 'Casa Velado';
export const HOME_TITLE = 'Casa Velado — Cigars from Estelí, Nicaragua';
export const DESCRIPTION_MAX = 155;
export const OG_LOCALE = 'en_GB';

export function pageTitle(title?: string): string {
  return title ? `${title} — ${SITE_NAME}` : HOME_TITLE;
}

export function assertDescription(description: string): string {
  if (description.length > DESCRIPTION_MAX) {
    throw new Error(
      `Meta description is ${description.length} characters; the limit is ${DESCRIPTION_MAX}: "${description}"`,
    );
  }
  return description;
}

/**
 * Absolute URL for a site path, or undefined while PUBLIC_SITE_URL is not configured.
 * No domain is ever invented: with no site URL, callers omit the tag.
 */
export function absoluteUrl(path: string, site: URL | undefined): string | undefined {
  if (!site) return undefined;
  // With `build.format: 'file'`, Astro.url.pathname is `/index.html` or `/cigars.html` at build time.
  const clean = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  return new URL(clean === '/' ? '/' : clean.replace(/\/+$/, ''), site).href;
}
