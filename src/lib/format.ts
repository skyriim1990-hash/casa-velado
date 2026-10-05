// Pure formatting for catalogue data: no Astro, no collections. The formats are the ones the
// blueprint fixes (section 11): prices `€11.00`, sizes `5 × 50 (127 mm)`, times `~55 min`.
import { SMOKING_TIME_BANDS, STRENGTH_WORDS, type Strength } from '../data/taxonomy.ts';
import type { CigarProduct, Leaf, Option, Product } from './schemas.ts';

/** €11.00 from 1100. Always two decimals. */
export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function strengthWord(strength: Strength): string {
  return STRENGTH_WORDS[strength];
}

/** `5 × 50 (127 mm)`. The length is as set in type (“5⅝”). */
export function formatSize(
  product: Pick<CigarProduct, 'lengthInLabel' | 'ring' | 'lengthMm'>,
): string {
  return `${product.lengthInLabel} × ${product.ring} (${product.lengthMm} mm)`;
}

/** `~55 min`. */
export function formatTime(minutes: number): string {
  return `~${minutes} min`;
}

/** The line under a card's title: `5 × 50 · ~55 min` (blueprint 4.5). */
export function formatCardData(
  product: Pick<CigarProduct, 'lengthInLabel' | 'ring' | 'smokingMinutes'>,
): string {
  return `${product.lengthInLabel} × ${product.ring} · ${formatTime(product.smokingMinutes)}`;
}

/** “14 September 2026” from 2026-09-14, “September 2026” from 2026-09; anything else is returned as it is. */
export function formatDate(date: string): string {
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(date)) return date;
  const monthOnly = date.length === 7;
  return new Date(`${monthOnly ? `${date}-01` : date}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: monthOnly ? undefined : 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** The smoking-time filter band a cigar falls in (blueprint 4.4). */
export function smokingBandId(minutes: number): (typeof SMOKING_TIME_BANDS)[number]['id'] {
  const band = SMOKING_TIME_BANDS.find(
    (b) => minutes >= b.min && (b.max === null || minutes <= b.max),
  );
  if (!band) throw new Error(`No smoking-time band for ${minutes} minutes`);
  return band.id;
}

/** “Single cigar”, “Pack of 5”, “Box of 20”, “Numbered box of 10”, “Cedar box of 4”. */
export function optionLabel(
  option: Option,
  product: Pick<Product, 'kind'>,
  numbered = false,
): string {
  if (option.type === 'single') return 'Single cigar';
  if (option.type === 'five') return 'Pack of 5';
  if (product.kind === 'sampler') return `Cedar box of ${option.quantity}`;
  return `${numbered ? 'Numbered box' : 'Box'} of ${option.quantity}`;
}

/** The lowest price among a product's options, for “From €11.00”. */
export function fromPriceCents(product: Pick<Product, 'options'>): number {
  return Math.min(...product.options.map((o) => o.priceCents));
}

/** Fill {n}, {price} and {name} in a microcopy template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Remove the inline tags the content uses (`<i>`, `<i lang="es">`) for plain-text contexts. */
export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

/**
 * A leaf as the blueprint writes it: “Nicaragua (Estelí ligero, Ometepe)”, “Ecuador Connecticut”,
 * “Nicaragua Habano (Jalapa)”. Spanish terms are marked for screen readers when `html` is set.
 */
export function formatLeaf(
  leaf: Pick<Leaf, 'country' | 'variety' | 'regions'>,
  regionName: (id: string) => string,
  { html = true }: { html?: boolean } = {},
): string {
  const head = [leaf.country, leaf.variety].filter(Boolean).join(' ');
  if (leaf.regions.length === 0) return head;
  const parts = leaf.regions.map((r) => {
    const name = regionName(r.region);
    if (!r.note) return name;
    return html ? `${name} <i lang="es">${r.note}</i>` : `${name} ${r.note}`;
  });
  return `${head} (${parts.join(', ')})`;
}

/** Reading time in whole minutes, from the words of a Markdown body (about 200 a minute), at least 1. */
export function readingMinutes(body: string): number {
  const words = body
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/[#>*_`]/g, ' ')
    .split(' ')
    .join(String.fromCharCode(10))
    .split(String.fromCharCode(10))
    .filter((w) => w.trim() !== '').length;
  return Math.max(1, Math.round(words / 200));
}
