import type { z } from 'astro/zod';
import type { lineSchema } from '../lib/schemas.ts';

type LineInput = z.input<typeof lineSchema>;
type LeafInput = {
  country: 'Nicaragua' | 'Ecuador' | 'Mexico';
  variety?: string;
  regions: { region: string; note?: 'ligero' }[];
};

/** Leaf from regions of Nicaragua. */
const nicaragua = (...regions: (string | [string, 'ligero'])[]): LeafInput => ({
  country: 'Nicaragua',
  regions: regions.map((r) =>
    typeof r === 'string' ? { region: r } : { region: r[0], note: r[1] },
  ),
});

const BY_HAND = 'Rolled by hand';

// Blueprint 4.1 (names), 4.2 (composition, harvest, fermentation, ageing), 3 R3 (taglines),
// 1.5 (voice). Descriptions use only facts from those tables.
export const lines = [
  {
    kind: 'permanent',
    id: 'jalapa',
    name: 'Jalapa',
    order: 1,
    tagline: 'Mild, for mornings and coffee.',
    description:
      'The lightest of our four permanent lines. The wrapper is an Ecuador Connecticut, the binder comes from Jalapa, and the filler from Jalapa and Estelí. The leaf is from the 2022 harvest: four months of fermentation, eighteen months of ageing as leaf and three more as finished cigars. Three sizes, from about half an hour to about fifty minutes. Mild to medium, for mornings and for coffee.',
    strength: 2,
    wrapper: {
      country: 'Ecuador',
      variety: 'Connecticut',
      wrapperType: 'Connecticut',
      regions: [],
    },
    binder: nicaragua('jalapa'),
    filler: [nicaragua('jalapa', 'esteli')],
    harvestYear: 2022,
    fermentationMonths: 4,
    leafAgeingMonths: 18,
    cigarAgeingMonths: 3,
    rollingMethod: BY_HAND,
  },
  {
    kind: 'permanent',
    id: 'galera',
    name: 'Galera',
    order: 2,
    tagline: 'The cigar we smoke most at home.',
    description:
      'The cigar we smoke most often at home, named for the curing barn at the centre of the farm. A Habano wrapper from Jalapa, a binder from Condega, and filler from Estelí and Condega. The 2022 harvest fermented for six months, then aged twenty-four months as leaf and four as finished cigars. Four sizes, from about fifty-five minutes to about ninety. Medium-bodied.',
    strength: 3,
    wrapper: { ...nicaragua('jalapa'), variety: 'Habano', wrapperType: 'Habano' },
    binder: nicaragua('condega'),
    filler: [nicaragua('esteli', 'condega')],
    harvestYear: 2022,
    fermentationMonths: 6,
    leafAgeingMonths: 24,
    cigarAgeingMonths: 4,
    rollingMethod: BY_HAND,
  },
  {
    kind: 'permanent',
    id: 'pilon',
    name: 'Pilón',
    order: 3,
    tagline: 'Dark and dense, for the evening.',
    description:
      'Dark and dense, made for the evening. The wrapper is a San Andrés Maduro from Mexico over an Estelí binder, with filler from Estelí, including ligero, and from Ometepe. The 2021 harvest went through nine months of double fermentation, then aged thirty months as leaf and six as finished cigars. Three sizes, from about an hour to about seventy-five minutes. Full-bodied.',
    strength: 5,
    wrapper: {
      country: 'Mexico',
      variety: 'San Andrés Maduro',
      wrapperType: 'Maduro',
      regions: [],
    },
    binder: nicaragua('esteli'),
    filler: [nicaragua(['esteli', 'ligero'], 'ometepe')],
    harvestYear: 2021,
    fermentationMonths: 9,
    fermentationNote: 'double',
    leafAgeingMonths: 30,
    cigarAgeingMonths: 6,
    rollingMethod: BY_HAND,
  },
  {
    kind: 'permanent',
    id: 'la-vela',
    name: 'La Vela',
    order: 4,
    tagline: 'Our longest-aged permanent line.',
    description:
      'Our longest-aged permanent line, named for the vigil that gives the house its name. A Corojo 99 wrapper from Estelí, a binder from Jalapa, and filler from Estelí, Jalapa and Condega. The 2021 harvest fermented for seven months, then aged forty-two months as leaf and six as finished cigars. Four sizes, from about fifty minutes to about seventy-five. Medium to full.',
    strength: 4,
    wrapper: { ...nicaragua('esteli'), variety: 'Corojo 99', wrapperType: 'Corojo 99' },
    binder: nicaragua('jalapa'),
    filler: [nicaragua('esteli', 'jalapa', 'condega')],
    harvestYear: 2021,
    fermentationMonths: 7,
    leafAgeingMonths: 42,
    cigarAgeingMonths: 6,
    rollingMethod: BY_HAND,
  },
  {
    kind: 'edition',
    id: 'cosecha-2020',
    name: 'Cosecha 2020',
    order: 5,
    editionYear: 2020,
    tagline: 'One harvest, numbered boxes.',
    description:
      'One harvest, one cigar, a numbered box. The leaf is from the 2020 harvest: eight months of fermentation, sixty months of ageing as leaf and twelve more as finished cigars. A Habano Rosado wrapper from Jalapa, a binder from Jalapa, and filler from Estelí and Jalapa. A single Toro, 6 × 50, in a box of ten. Medium to full.',
    strength: 4,
    wrapper: { ...nicaragua('jalapa'), variety: 'Habano Rosado', wrapperType: 'Habano Rosado' },
    binder: nicaragua('jalapa'),
    filler: [nicaragua('esteli', 'jalapa')],
    harvestYear: 2020,
    fermentationMonths: 8,
    leafAgeingMonths: 60,
    cigarAgeingMonths: 12,
    rollingMethod: BY_HAND,
  },
  {
    kind: 'sampler',
    id: 'muestrario',
    name: 'Muestrario',
    order: 6,
    // The sentence from the empty cart (4.7), plus what the box contains (4.2).
    description:
      'Not sure where to start? The Muestrario holds one cigar from each line. Four Robustos in a cedar box: Jalapa, Galera, Pilón and La Vela.',
  },
] as const satisfies LineInput[];
