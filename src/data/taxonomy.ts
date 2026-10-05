// Fixed vocabularies from the blueprint: strength words, vitolas, filter groups, sort
// options, order limits, tasting-note vocabulary, journal categories. Pages and filters read
// these; nothing here is a page decision.

/** Blueprint 4.2: strength in words. */
export const STRENGTH_WORDS = {
  1: 'Mild',
  2: 'Mild to medium',
  3: 'Medium',
  4: 'Medium to full',
  5: 'Full',
} as const;
export type Strength = keyof typeof STRENGTH_WORDS;

/** Blueprint 4.4, filter group “Vitola”. */
export const VITOLAS = [
  'Petit Corona',
  'Corona',
  'Corona Gorda',
  'Robusto',
  'Toro',
  'Belicoso',
  'Churchill',
  'Lancero',
] as const;
export type Vitola = (typeof VITOLAS)[number];

/** Blueprint 4.4, filter group “Wrapper”. */
export const WRAPPER_TYPES = [
  'Connecticut',
  'Habano',
  'Maduro',
  'Corojo 99',
  'Habano Rosado',
] as const;
export type WrapperType = (typeof WRAPPER_TYPES)[number];

export const AVAILABILITY = ['in_stock', 'low', 'sold_out', 'limited'] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const OPTION_TYPES = ['single', 'five', 'box'] as const;
export type OptionType = (typeof OPTION_TYPES)[number];

/** Blueprint 4.6 / 4.7: the stepper range. Cosecha boxes are further limited by `maxPerOrder`. */
export const QUANTITY_LIMITS = { single: 10, five: 10, box: 5 } as const satisfies Record<
  OptionType,
  number
>;

/** Blueprint 4.4, filter group “Smoking time”. Bounds are inclusive; ids are the URL values. */
export const SMOKING_TIME_BANDS: readonly {
  id: 'under-45' | '45-75' | 'over-75';
  label: string;
  min: number;
  max: number | null;
}[] = [
  { id: 'under-45', label: 'Under 45 min', min: 0, max: 44 },
  { id: '45-75', label: '45–75 min', min: 45, max: 75 },
  { id: 'over-75', label: 'Over 75 min', min: 76, max: null },
];

/** Blueprint 4.4, filter group “Strength”. Mild (1) has no cigar, so it has no filter value. */
export const STRENGTH_FILTERS = [2, 3, 4, 5] as const satisfies readonly Strength[];

/** Blueprint 4.4: the order of the sort menu. There is no “Best sellers” or “Newest”. */
export const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'strength-asc', label: 'Strength: mild first' },
  { id: 'strength-desc', label: 'Strength: full first' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'time-asc', label: 'Smoking time: shortest first' },
] as const;

/** Blueprint 2.3. */
export const JOURNAL_CATEGORIES = ['Harvest', 'Craft', 'Pairings', 'Guides'] as const;
export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number];

/** Blueprint 4.2: tasting notes come only from this list, at most three per third. */
export const TASTING_VOCABULARY = [
  'cedar',
  'hay',
  'roasted nuts',
  'white bread',
  'cream',
  'black pepper',
  'white pepper',
  'cocoa',
  'dark chocolate',
  'coffee',
  'molasses',
  'dried fig',
  'raisin',
  'leather',
  'dry earth',
  'nutmeg',
  'honey',
  'toast',
  'cinnamon',
] as const;
export const MAX_NOTES_PER_THIRD = 3;

/** Blueprint 1.5: words that may not appear in product, editorial or interface text. */
export const FORBIDDEN_WORDS = [
  'exceptional',
  'unique',
  'unparalleled',
  'exquisite',
  'luxurious',
  'luxury',
  'premium',
  'indulge',
  'indulgence',
  'journey',
  'symphony',
  'masterpiece',
  'magic',
  'magical',
  'perfect',
  'perfection',
  'the finest',
  'world-class',
  'timeless',
  'elevate',
  'curated',
  'bespoke',
  'artisanal',
  'nestled',
  'boasts',
  'discerning',
  'connoisseur',
  'true experience',
  'where tradition meets innovation',
  'crafted for the discerning',
  'an unparalleled journey',
  'handcrafted with passion',
  'passion',
  'artistry',
] as const;
