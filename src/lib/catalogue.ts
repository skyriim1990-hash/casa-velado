// The one way pages read the canonical content. Every record comes from a collection
// (validated by src/content.config.ts); nothing here restates a fact. Derived views, such as
// the product ledger, are computed from the records each time.
import { getCollection, getEntry } from 'astro:content';
import { JOURNAL_ORDER } from '../data/journal.ts';
import { products as productData } from '../data/products.ts';
import { glossary as glossaryData } from '../data/tobacco.ts';
import type { LEDGER_METRICS } from './schemas.ts';
import type {
  Article,
  Fact,
  BlendedLine,
  CigarProduct,
  GlossaryTerm,
  House,
  Line,
  Photo,
  Product,
  Region,
  TobaccoStage,
} from './schemas.ts';
import { formatLeaf, formatSize, formatTime, optionLabel } from './format.ts';

export type LedgerMetric = (typeof LEDGER_METRICS)[number];

// ── Lines, products, regions ──────────────────────────────────────────────
export async function getRegions(): Promise<Region[]> {
  return (await getCollection('regions')).map((e) => e.data);
}

async function regionNamer(): Promise<(id: string) => string> {
  const names = new Map((await getRegions()).map((r) => [r.id, r.name]));
  return (id) => {
    const name = names.get(id);
    if (!name) throw new Error(`Unknown region “${id}”`);
    return name;
  };
}

/** The wrapper of a blended line as the ledger writes it: “Nicaragua Habano (Jalapa)”. */
export async function getLineWrapper(line: BlendedLine): Promise<string> {
  return formatLeaf(line.wrapper, await regionNamer(), { html: false });
}

/** All six lines in the order of the collection page: four permanent, the edition, the sampler. */
export async function getLines(): Promise<Line[]> {
  return (await getCollection('lines')).map((e) => e.data).sort((a, b) => a.order - b.order);
}

export async function getLine(id: string): Promise<Line> {
  const entry = await getEntry('lines', id);
  if (!entry) throw new Error(`Unknown line “${id}”`);
  return entry.data;
}

export function isBlended(line: Line): line is BlendedLine {
  return line.kind !== 'sampler';
}

/** The 16 items of the collection, in line order and then in the order of the catalogue. */
export async function getProducts(): Promise<Product[]> {
  const lines = await getLines();
  const lineOrder = new Map(lines.map((l, i) => [l.id, i]));
  // The collection store does not keep the order of the data, so the catalogue order (the
  // order of the table in blueprint 4.2) is read from the data itself.
  const catalogueOrder = new Map(productData.map((p, i) => [p.id, i]));
  const products = (await getCollection('products')).map((e) => e.data);
  return products.sort(
    (a, b) =>
      (lineOrder.get(a.line) ?? 99) - (lineOrder.get(b.line) ?? 99) ||
      (catalogueOrder.get(a.id) ?? 99) - (catalogueOrder.get(b.id) ?? 99),
  );
}

export async function getProduct(id: string): Promise<Product> {
  const entry = await getEntry('products', id);
  if (!entry) throw new Error(`Unknown product “${id}”`);
  return entry.data;
}

export const productPath = (product: Pick<Product, 'id'>) => `/cigars/${product.id}`;

/** For the “By line” view: each line with its products. */
export async function getProductsByLine(): Promise<{ line: Line; products: Product[] }[]> {
  const [lines, products] = await Promise.all([getLines(), getProducts()]);
  return lines.map((line) => ({ line, products: products.filter((p) => p.line === line.id) }));
}

export async function getSameLineProducts(product: Product): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.line === product.line && p.id !== product.id);
}

// ── Ledger ────────────────────────────────────────────────────────────────
/** The range of a ledger figure across the permanent lines and the edition, e.g. 4 to 9 months. */
export async function getLedgerRange(metric: LedgerMetric): Promise<{ min: number; max: number }> {
  const values = (await getLines()).filter(isBlended).map((l) => l[metric]);
  return { min: Math.min(...values), max: Math.max(...values) };
}

export interface LedgerRow {
  label: string;
  /** Plain text, or HTML with `<i lang="es">` for Spanish terms. */
  value: string;
}

const months = (n: number) => `${n} months`;

/** The ledger on a product page (blueprint 4.6), read from the line and the product. */
export async function getProductLedger(product: Product): Promise<LedgerRow[]> {
  const line = await getLine(product.line);
  const packaging = product.options
    .map((o) => optionLabel(o, product, line.kind === 'edition'))
    .join(', ');

  if (product.kind === 'sampler') {
    return [
      { label: 'Contents', value: 'One Robusto from each of the four permanent lines' },
      { label: 'Packaging', value: packaging },
    ];
  }
  if (!isBlended(line)) throw new Error(`Cigar “${product.id}” is in a line with no blend`);

  const nameOf = await regionNamer();
  const countries = [
    ...new Set([line.wrapper, line.binder, ...line.filler].map((leaf) => leaf.country)),
  ];
  const rows: LedgerRow[] = [
    { label: 'Wrapper', value: formatLeaf(line.wrapper, nameOf) },
    { label: 'Binder', value: formatLeaf(line.binder, nameOf) },
    { label: 'Filler', value: line.filler.map((f) => formatLeaf(f, nameOf)).join('; ') },
    { label: 'Origin', value: countries.join(', ') },
    { label: 'Harvest', value: String(line.harvestYear) },
    {
      label: 'Fermentation',
      value: line.fermentationNote
        ? `${months(line.fermentationMonths)}, ${line.fermentationNote}`
        : months(line.fermentationMonths),
    },
    { label: 'Leaf ageing', value: months(line.leafAgeingMonths) },
    { label: 'Cigar ageing', value: months(line.cigarAgeingMonths) },
    { label: 'Size', value: `${product.lengthInLabel} inches (${product.lengthMm} mm)` },
    { label: 'Ring gauge', value: String(product.ring) },
    { label: 'Smoking time', value: formatTime(product.smokingMinutes) },
    { label: 'Rolling', value: line.rollingMethod },
    { label: 'Packaging', value: packaging },
  ];
  if (product.editionSize !== undefined) {
    rows.push({ label: 'Boxes', value: String(product.editionSize) });
  }
  return rows;
}

/** `5 × 50 (127 mm)` for a cigar. */
export const sizeOf = (product: CigarProduct) => formatSize(product);

// ── Tobacco, house, photos ────────────────────────────────────────────────
export async function getTobaccoStages(): Promise<TobaccoStage[]> {
  return (await getCollection('tobaccoStages'))
    .map((e) => e.data)
    .sort((a, b) => a.order - b.order);
}

/** The eleven terms in the order of Appendix A (the collection store does not keep the order). */
export async function getGlossary(): Promise<GlossaryTerm[]> {
  const order = new Map(glossaryData.map((t, i) => [t.id, i]));
  return (await getCollection('glossary'))
    .map((e) => e.data)
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export async function getHouse(): Promise<House> {
  const entry = await getEntry('house', 'house');
  if (!entry) throw new Error('The house record is missing');
  return entry.data;
}

export async function getPhoto(id: string): Promise<Photo> {
  const entry = await getEntry('photos', id);
  if (!entry) throw new Error(`Unknown photo “${id}”`);
  return entry.data;
}

// ── Journal ───────────────────────────────────────────────────────────────
export interface JournalEntry {
  id: string;
  data: Article;
}

const isoDate = (d: string) => /^\d{4}-\d{2}(-\d{2})?$/.test(d);

/**
 * Newest first when every entry has a real date; the blueprint's order while dates are
 * still [DATE].
 */
export async function getArticles(): Promise<JournalEntry[]> {
  const entries = (await getCollection('journal')).map((e) => ({ id: e.id, data: e.data }));
  const allDated = entries.every((e) => isoDate(e.data.date));
  const rank = (id: string) => {
    const i = (JOURNAL_ORDER as readonly string[]).indexOf(id);
    return i === -1 ? 99 : i;
  };
  return entries.sort((a, b) =>
    allDated ? b.data.date.localeCompare(a.data.date) : rank(a.id) - rank(b.id),
  );
}

/** “More from the journal”: two other entries, from the same category first. */
export async function getRelatedArticles(id: string, count = 2): Promise<JournalEntry[]> {
  const all = await getArticles();
  const current = all.find((e) => e.id === id);
  const others = all.filter((e) => e.id !== id);
  const sameCategory = others.filter((e) => e.data.category === current?.data.category);
  return [...sameCategory, ...others.filter((e) => !sameCategory.includes(e))].slice(0, count);
}

// ── Tobacco page ──────────────────────────────────────────────────────────
const monthsRange = (min: number, max: number, joiner: string) =>
  min === max ? `${min} months` : `${min}${joiner}${max} months`;

/**
 * The figures a chapter's text may quote, worked out from the lines so a number is written once:
 * “4 to 9 months”. A body writes them as {fermentation}, {leafAgeing} and {cigarAgeing}.
 */
export async function getLedgerTokens(): Promise<Record<string, string>> {
  const [fermentation, leaf, cigar] = await Promise.all([
    getLedgerRange('fermentationMonths'),
    getLedgerRange('leafAgeingMonths'),
    getLedgerRange('cigarAgeingMonths'),
  ]);
  return {
    fermentation: monthsRange(fermentation.min, fermentation.max, ' to '),
    leafAgeing: monthsRange(leaf.min, leaf.max, ' to '),
    cigarAgeing: monthsRange(cigar.min, cigar.max, ' to '),
  };
}

/** One book-line fact of a stage: a figure read from the lines, a fixed fact, or [NUMBER]. */
export async function resolveFact(fact: Fact): Promise<{ label: string; value: string }> {
  if (fact.kind === 'fixed') return { label: fact.label, value: fact.value };
  if (fact.kind === 'verify') {
    return { label: fact.label, value: fact.unit ? `${fact.value} ${fact.unit}` : fact.value };
  }
  const { min, max } = await getLedgerRange(fact.metric);
  const value =
    fact.metric === 'harvestYear'
      ? min === max
        ? String(min)
        : `${min}–${max}`
      : monthsRange(min, max, '–');
  return { label: fact.label, value };
}

export interface HarvestRow {
  id: string;
  name: string;
  harvest: string;
  fermentation: string;
  leafAgeing: string;
  cigarAgeing: string;
}

/** The harvest ledger of /tobacco: one row for each line with a blend, in the order of the lines. */
export async function getHarvestLedger(): Promise<HarvestRow[]> {
  return (await getLines()).filter(isBlended).map((line) => ({
    id: line.id,
    name: line.name,
    harvest: String(line.harvestYear),
    fermentation: line.fermentationNote
      ? `${line.fermentationMonths} months, ${line.fermentationNote}`
      : `${line.fermentationMonths} months`,
    leafAgeing: `${line.leafAgeingMonths} months`,
    cigarAgeing: `${line.cigarAgeingMonths} months`,
  }));
}
