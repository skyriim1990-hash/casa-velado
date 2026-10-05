// Canonical content models (blueprint 4.3, extended for the pages in sections 2 and 3).
// One schema per record type. The data files in src/data are written against these types,
// Astro validates them when it loads the collections, and `npm run validate:content`
// checks the rules a schema cannot express.
//
// Cross-references are plain slugs (a line's `id`, a product's `id`, a region's `id`).
// `scripts/validate-content.mjs` checks that every one of them resolves.
import { z } from 'astro/zod';
import {
  AVAILABILITY,
  JOURNAL_CATEGORIES,
  MAX_NOTES_PER_THIRD,
  OPTION_TYPES,
  VITOLAS,
  WRAPPER_TYPES,
} from '../data/taxonomy.ts';

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lowercase letters, digits and hyphens');
const text = z.string().min(1);
const placeholderNumber = z.literal('[NUMBER]');

// ── Images ────────────────────────────────────────────────────────────────
// Until approved photographs exist, every image is a placeholder (blueprint 6.7). The site
// shows it as a block of the right ratio with “[PHOTO: description]”. A final photograph
// replaces the same record: `kind: 'asset'`, with its source under src/assets/images.
export const RATIOS = ['21:9', '16:9', '4:3', '3:2', '1:1', '4:5', '5:1'] as const;
export type Ratio = (typeof RATIOS)[number];

export const imageRefSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('placeholder'),
    /** The words inside [PHOTO: …]. */
    description: text,
    /** The crops the frame needs, widest first (blueprint 6.9). */
    ratios: z.array(z.enum(RATIOS)).min(1),
    /** `object-position` for ratios between the prepared crops, e.g. "40% 60%". */
    focus: z
      .string()
      .regex(/^\d{1,3}% \d{1,3}%$/)
      .optional(),
  }),
  z.object({
    kind: z.literal('asset'),
    /** Path under src/assets/images, without the width suffix. */
    src: text,
    alt: text,
    ratios: z.array(z.enum(RATIOS)).min(1),
    /**
     * Separate art-directed crop files (blueprint 6.9), one per ratio, each already cut to that
     * ratio. A ratio without one is cut from `src`.
     */
    crops: z.array(z.object({ ratio: z.enum(RATIOS), src: text })).optional(),
    focus: z
      .string()
      .regex(/^\d{1,3}% \d{1,3}%$/)
      .optional(),
  }),
]);
export type ImageRef = z.infer<typeof imageRefSchema>;

// ── Regions and leaf ──────────────────────────────────────────────────────
export const regionSchema = z.object({
  id: slug,
  name: text,
  /** The map shows Estelí, Condega and Jalapa together and Ometepe apart (blueprint 2.3). */
  mapGroup: z.enum(['north', 'apart']),
  /** Soil and climate are not written until they are verified (blueprint 1.9, 2.3). */
  soilAndClimate: z.null(),
});
export type Region = z.infer<typeof regionSchema>;

export const COUNTRIES = ['Nicaragua', 'Ecuador', 'Mexico'] as const;

const leafRegion = z.object({
  region: slug,
  /** Only the Pilón filler marks a leaf by the part of the plant: Estelí ligero. */
  note: z.literal('ligero').optional(),
});

/** One leaf of the blend: country, the region(s) it comes from, and its variety if it has one. */
export const leafSchema = z.object({
  country: z.enum(COUNTRIES),
  variety: text.optional(),
  regions: z.array(leafRegion),
});
export type Leaf = z.infer<typeof leafSchema>;

// ── Lines ─────────────────────────────────────────────────────────────────
const lineBase = {
  id: slug,
  name: text,
  order: z.number().int().positive(),
  description: text,
};

const blendedLine = {
  ...lineBase,
  /** The sentence about the line's character (home R3, /cigars heading row). */
  tagline: text,
  strength: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  wrapper: leafSchema.extend({ wrapperType: z.enum(WRAPPER_TYPES) }),
  binder: leafSchema,
  filler: z.array(leafSchema).min(1),
  harvestYear: z.number().int(),
  fermentationMonths: z.number().int().positive(),
  /** Pilón is fermented twice. */
  fermentationNote: text.optional(),
  leafAgeingMonths: z.number().int().positive(),
  cigarAgeingMonths: z.number().int().positive(),
  rollingMethod: text,
};

export const lineSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('permanent'), ...blendedLine }),
  z.object({ kind: z.literal('edition'), ...blendedLine, editionYear: z.number().int() }),
  /** Muestrario: the sample box. It has no blend of its own. */
  z.object({ kind: z.literal('sampler'), ...lineBase }),
]);
export type Line = z.infer<typeof lineSchema>;
export type BlendedLine = Extract<Line, { kind: 'permanent' | 'edition' }>;

// ── Products ──────────────────────────────────────────────────────────────
export const optionSchema = z.object({
  type: z.enum(OPTION_TYPES),
  quantity: z.number().int().positive(),
  /** Euro cents. €11.00 is 1100. */
  priceCents: z.number().int().positive(),
});
export type Option = z.infer<typeof optionSchema>;

const notes = z.array(text).min(1).max(MAX_NOTES_PER_THIRD);

const productBase = {
  id: slug,
  /** A line's `id`. */
  line: slug,
  description: text,
  options: z.array(optionSchema).min(1),
  availability: z.enum(AVAILABILITY),
  /** Shown only for a sold-out product: “Sold out. Next batch: [DATE]”. */
  restockNote: text.optional(),
  /** Per-order limit for a box, e.g. Cosecha 2020 is limited to 2 boxes. */
  maxPerOrder: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
};

export const productSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('cigar'),
    ...productBase,
    vitola: z.enum(VITOLAS),
    /** Length in inches as a number (5.625) and as set in type (“5⅝”). */
    lengthIn: z.number().positive(),
    lengthInLabel: text,
    lengthMm: z.number().int().positive(),
    ring: z.number().int().positive(),
    smokingMinutes: z.number().int().positive(),
    notes: z.object({ first: notes, second: notes, final: notes }),
    pairing: text,
    /** Numbered boxes in the edition: a number, or [NUMBER] until the owner gives it. */
    editionSize: z.union([z.number().int().positive(), placeholderNumber]).optional(),
    images: z.object({
      catalog: imageRefSchema,
      band: imageRefSchema,
      foot: imageRefSchema,
      box: imageRefSchema,
      context: imageRefSchema.optional(),
    }),
  }),
  /** Muestrario: four Robustos, one per line, in a cedar box. */
  z.object({
    kind: z.literal('sampler'),
    ...productBase,
    /** The cigars inside, as product ids. */
    contents: z.array(slug).length(4),
    images: z.object({ catalog: imageRefSchema, box: imageRefSchema }),
  }),
]);
export type Product = z.infer<typeof productSchema>;
export type CigarProduct = Extract<Product, { kind: 'cigar' }>;
export type SamplerProduct = Extract<Product, { kind: 'sampler' }>;

// ── Journal ───────────────────────────────────────────────────────────────
/** A calendar date, or [DATE] until the owner gives one. */
const dateOrPlaceholder = z.union([
  z.literal('[DATE]'),
  z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'YYYY-MM or YYYY-MM-DD'),
]);

export const articleSchema = z.object({
  title: text,
  category: z.enum(JOURNAL_CATEGORIES),
  date: dateOrPlaceholder,
  /** Null until the entry is written (Stage 11), then worked out from the body. */
  readingMinutes: z.number().int().positive().nullable(),
  cover: imageRefSchema,
  /** Null until the entry is written. */
  excerpt: text.nullable(),
  /** A product id: “The cigar in this entry”. Optional (blueprint 4.3). */
  relatedProduct: slug.optional(),
});
export type Article = z.infer<typeof articleSchema>;

// ── Tobacco (page 4) ──────────────────────────────────────────────────────
export const LEDGER_METRICS = [
  'harvestYear',
  'fermentationMonths',
  'leafAgeingMonths',
  'cigarAgeingMonths',
] as const;

/** A small book-line fact under a chapter: a ledger figure, a fixed fact, or a value to confirm. */
export const factSchema = z.discriminatedUnion('kind', [
  /** Read from the lines: the range across the permanent lines and the edition. */
  z.object({ kind: z.literal('ledger'), label: text, metric: z.enum(LEDGER_METRICS) }),
  /** Written in the blueprint. */
  z.object({ kind: z.literal('fixed'), label: text, value: text }),
  /** Marked “for verification” in the blueprint and not given: shown as [NUMBER]. */
  z.object({
    kind: z.literal('verify'),
    label: text,
    unit: text.optional(),
    value: placeholderNumber,
  }),
]);
export type Fact = z.infer<typeof factSchema>;

export const tobaccoStageSchema = z.object({
  id: slug,
  order: z.number().int().min(1).max(5),
  title: text,
  /** A photo id from src/data/photos.ts. */
  photo: slug,
  facts: z.array(factSchema).min(1).max(3),
  /** 30–40 words for the home page (R4). Null until written. */
  summary: text.nullable(),
  /** 120–180 words for /tobacco. Null until written. */
  body: text.nullable(),
});
export type TobaccoStage = z.infer<typeof tobaccoStageSchema>;

export const glossaryTermSchema = z.object({
  id: slug,
  term: text,
  /** Spanish terms are set in <i lang="es">; “ring gauge” is English. */
  spanish: z.boolean(),
  meaning: text,
});
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;

// ── Photos ────────────────────────────────────────────────────────────────
export const photoSchema = z.object({
  id: slug,
  /** The number in the blueprint's table of frames (6.9). */
  frame: z.number().int().positive(),
  image: imageRefSchema,
  usedIn: z.array(text).min(1),
});
export type Photo = z.infer<typeof photoSchema>;

// ── Our House (page 5) ────────────────────────────────────────────────────
export const houseSchema = z.object({
  /** The H1 introduction. Not written in the blueprint, so null. */
  intro: text.nullable(),
  chapters: z
    .array(z.object({ id: slug, title: text, paragraphs: z.array(text).min(1) }))
    .length(5),
  signature: text,
  /** Photo ids. */
  archivePhoto: slug,
  places: z.array(slug).length(4),
  rings: z
    .array(
      z.object({
        mark: z.enum(['band-1987', 'band-mid', 'band-current']),
        /** “1987”, “[YEAR]” or “Today”. */
        label: text,
      }),
    )
    .length(3),
  wontDo: z.array(text).length(5),
});
export type House = z.infer<typeof houseSchema>;
