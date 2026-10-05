import type { z } from 'astro/zod';
import type { productSchema } from '../lib/schemas.ts';

type ProductInput = z.input<typeof productSchema>;
type Notes = { first: string[]; second: string[]; final: string[] };
type Cigar = Extract<ProductInput, { kind: 'cigar' }>;
type Option = { type: 'single' | 'five' | 'box'; quantity: number; priceCents: number };

// ── Helpers: they remove repetition, not facts ────────────────────────────
const eur = (euros: number) => Math.round(euros * 100);

/** Single, pack of 5 (the single price × 5, no discount: blueprint 4.2) and a box. */
function standardOptions(singleCents: number, boxQuantity: number, boxCents: number): Option[] {
  return [
    { type: 'single', quantity: 1, priceCents: singleCents },
    { type: 'five', quantity: 5, priceCents: singleCents * 5 },
    { type: 'box', quantity: boxQuantity, priceCents: boxCents },
  ];
}

// Production masters (Stage 14, Shot 15 to 17), one band, foot and open box per line, shared
// by every cigar of the line (docs/photography.md, section 13), and the catalogue photographs
// that exist so far. A cigar without a catalogue photograph keeps its placeholder.
const PRODUCT_DIR = 'products';
const lineShots = (line: string) => ({
  band: `${PRODUCT_DIR}/${line}/${line}-band-production-master-2000w`,
  foot: `${PRODUCT_DIR}/${line}/${line}-foot-production-master-2000w`,
  box: `${PRODUCT_DIR}/${line}/${line}-open-box-production-master-1920w`,
});
const CATALOGUE: Record<string, string> = {
  'jalapa-petit-corona': 'jalapa/jalapa-petit-corona-production-master-2528w',
  'jalapa-corona': 'jalapa/jalapa-corona-production-master-2000w',
  'jalapa-robusto': 'jalapa/jalapa-robusto-production-master-2000w',
  'galera-robusto': 'galera/galera-robusto-production-master-2528w',
  'galera-corona-gorda': 'galera/galera-corona-gorda-production-master-2528w',
  'galera-toro': 'galera/galera-toro-production-master-2528w',
  'galera-churchill': 'galera/galera-churchill-production-master-2000w',
  'pilon-robusto': 'pilon/pilon-robusto-production-master-2816w',
  'pilon-belicoso': 'pilon/pilon-belicoso-production-master-2816w',
  'pilon-toro': 'pilon/pilon-toro-production-master-2000w',
  'la-vela-lancero': 'la-vela/la-vela-lancero-production-master-2816w',
  'la-vela-corona': 'la-vela/la-vela-corona-production-master-2000w',
  'la-vela-robusto': 'la-vela/la-vela-robusto-production-master-2000w',
  'la-vela-toro': 'la-vela/la-vela-toro-production-master-2816w',
};

/** The four frames of a product page (blueprint 6.9, frames 14 to 17). */
function frames(id: string, line: string, name: string, lineName: string): Cigar['images'] {
  const shots = lineShots(line);
  const catalogue = CATALOGUE[id];
  return {
    catalog: catalogue
      ? {
          kind: 'asset',
          src: `${PRODUCT_DIR}/${catalogue}`,
          alt: `${name}, one cigar with a plain paper band, shot from above on dark textured paper`,
          ratios: ['3:2'],
        }
      : {
          kind: 'placeholder',
          description: `${name}, horizontal, shot from above on dark textured paper, true scale`,
          ratios: ['3:2'],
        },
    band: {
      kind: 'asset',
      src: shots.band,
      alt: `The ${lineName} band, a cream paper band printed with a CV monogram in an oval, close-up on the wrapper`,
      ratios: ['1:1'],
    },
    foot: {
      kind: 'asset',
      src: shots.foot,
      alt: `The foot of a ${lineName} cigar, showing the layers of filler leaf`,
      ratios: ['1:1'],
    },
    box: {
      kind: 'asset',
      src: shots.box,
      alt: `An open cedar box of ${lineName} cigars, seen from above on dark paper`,
      ratios: ['4:3'],
    },
  };
}

interface CigarSpec {
  id: string;
  line: string;
  lineName: string;
  vitola: Cigar['vitola'];
  lengthIn: number;
  lengthInLabel: string;
  lengthMm: number;
  ring: number;
  smokingMinutes: number;
  priceEuros: number;
  box: [quantity: number, euros: number];
  description: string;
  notes: Notes;
  pairing: string;
}

const cigar = (s: CigarSpec): Cigar => ({
  kind: 'cigar',
  id: s.id,
  line: s.line,
  vitola: s.vitola,
  lengthIn: s.lengthIn,
  lengthInLabel: s.lengthInLabel,
  lengthMm: s.lengthMm,
  ring: s.ring,
  smokingMinutes: s.smokingMinutes,
  description: s.description,
  notes: s.notes,
  pairing: s.pairing,
  options: standardOptions(eur(s.priceEuros), s.box[0], eur(s.box[1])),
  availability: 'in_stock',
  images: frames(s.id, s.line, `${s.lineName} ${s.vitola}`, s.lineName),
});

// ── The catalogue (blueprint 4.2) ─────────────────────────────────────────
// Sizes, strength (from the line), smoking times and prices are the approved table. The
// descriptions, tasting notes and pairings follow the model in 4.2: two or three sentences,
// at least one concrete fact, notes only from the fixed vocabulary.
const cigars: Cigar[] = [
  // Jalapa
  cigar({
    id: 'jalapa-petit-corona',
    line: 'jalapa',
    lineName: 'Jalapa',
    vitola: 'Petit Corona',
    lengthIn: 4.5,
    lengthInLabel: '4½',
    lengthMm: 114,
    ring: 42,
    smokingMinutes: 30,
    priceEuros: 8,
    box: [25, 185],
    description:
      'The shortest cigar we make: 4½ inches and about half an hour. An Ecuador Connecticut wrapper over a binder from Jalapa. Mild to medium, easy to finish with a single coffee.',
    notes: {
      first: ['hay', 'cedar', 'white bread'],
      second: ['cream', 'roasted nuts'],
      final: ['toast', 'white pepper'],
    },
    pairing: 'A milky coffee, early in the day.',
  }),
  cigar({
    id: 'jalapa-corona',
    line: 'jalapa',
    lineName: 'Jalapa',
    vitola: 'Corona',
    lengthIn: 5.5,
    lengthInLabel: '5½',
    lengthMm: 140,
    ring: 42,
    smokingMinutes: 45,
    priceEuros: 9,
    box: [20, 165],
    description:
      'A slim 5½ × 42 that takes about forty-five minutes. Ecuador Connecticut wrapper, Jalapa binder, and filler from Jalapa and Estelí. Mild to medium from the first third to the last.',
    notes: {
      first: ['cedar', 'hay', 'cream'],
      second: ['roasted nuts', 'white bread', 'honey'],
      final: ['toast', 'white pepper'],
    },
    pairing: 'Black coffee, or tea without milk.',
  }),
  cigar({
    id: 'jalapa-robusto',
    line: 'jalapa',
    lineName: 'Jalapa',
    vitola: 'Robusto',
    lengthIn: 5,
    lengthInLabel: '5',
    lengthMm: 127,
    ring: 50,
    smokingMinutes: 50,
    priceEuros: 9.5,
    box: [20, 175],
    description:
      'The widest of the Jalapa line, a 50 ring, and about fifty minutes. The same Ecuador Connecticut wrapper and Jalapa binder, with filler from Jalapa and Estelí. Mild to medium, for a long morning.',
    notes: {
      first: ['hay', 'cedar', 'cream'],
      second: ['honey', 'roasted nuts', 'white bread'],
      final: ['toast', 'white pepper', 'cedar'],
    },
    pairing: 'A long coffee after breakfast.',
  }),
  // Galera
  cigar({
    id: 'galera-robusto',
    line: 'galera',
    lineName: 'Galera',
    vitola: 'Robusto',
    lengthIn: 5,
    lengthInLabel: '5',
    lengthMm: 127,
    ring: 50,
    smokingMinutes: 55,
    priceEuros: 11,
    box: [20, 205],
    // Blueprint 4.2: the approved final text.
    description:
      'The cigar we smoke most often at home. A Habano wrapper from Jalapa over filler from Estelí and Condega. Medium-bodied, even, about an hour.',
    notes: {
      first: ['cedar', 'black pepper', 'dry earth'],
      second: ['cocoa', 'roasted nuts', 'dried fig'],
      final: ['dark cocoa', 'leather', 'a long peppery finish'],
    },
    pairing: 'An afternoon espresso, or a dark rum without ice.',
  }),
  cigar({
    id: 'galera-corona-gorda',
    line: 'galera',
    lineName: 'Galera',
    vitola: 'Corona Gorda',
    lengthIn: 5.625,
    lengthInLabel: '5⅝',
    lengthMm: 143,
    ring: 46,
    smokingMinutes: 60,
    priceEuros: 11.5,
    box: [20, 215],
    description:
      'A 5⅝ × 46 in the Galera blend: Habano wrapper from Jalapa, binder from Condega, filler from Estelí and Condega. Medium-bodied and about an hour. It sits between the Robusto and the Toro in length and in time.',
    notes: {
      first: ['cedar', 'black pepper', 'hay'],
      second: ['cocoa', 'roasted nuts', 'dried fig'],
      final: ['cocoa', 'leather', 'black pepper'],
    },
    pairing: 'A cup of black coffee after lunch.',
  }),
  cigar({
    id: 'galera-toro',
    line: 'galera',
    lineName: 'Galera',
    vitola: 'Toro',
    lengthIn: 6,
    lengthInLabel: '6',
    lengthMm: 152,
    ring: 52,
    smokingMinutes: 70,
    priceEuros: 12.5,
    box: [20, 230],
    description:
      'The Galera blend in a 6 × 52: Habano wrapper from Jalapa over filler from Estelí and Condega. Medium-bodied, about seventy minutes. Set the time aside before you light it.',
    notes: {
      first: ['cedar', 'black pepper', 'dry earth'],
      second: ['cocoa', 'roasted nuts', 'dried fig'],
      final: ['dark chocolate', 'leather', 'black pepper'],
    },
    pairing: 'A dark rum without ice, or a second coffee.',
  }),
  cigar({
    id: 'galera-churchill',
    line: 'galera',
    lineName: 'Galera',
    vitola: 'Churchill',
    lengthIn: 7,
    lengthInLabel: '7',
    lengthMm: 178,
    ring: 48,
    smokingMinutes: 90,
    priceEuros: 14,
    box: [20, 260],
    description:
      'The longest of the Galera line: seven inches and about ninety minutes, with the same Habano wrapper from Jalapa and binder from Condega. Medium-bodied from end to end.',
    notes: {
      first: ['cedar', 'hay', 'black pepper'],
      second: ['cocoa', 'roasted nuts', 'raisin'],
      final: ['leather', 'black pepper', 'dry earth'],
    },
    pairing: 'Black coffee, or a dark rum without ice.',
  }),
  // Pilón
  cigar({
    id: 'pilon-robusto',
    line: 'pilon',
    lineName: 'Pilón',
    vitola: 'Robusto',
    lengthIn: 5,
    lengthInLabel: '5',
    lengthMm: 127,
    ring: 52,
    smokingMinutes: 60,
    priceEuros: 13,
    box: [20, 240],
    description:
      'Full-bodied, in a 5 × 52 that takes about an hour. A San Andrés Maduro wrapper from Mexico over an Estelí binder, with Estelí ligero and Ometepe in the filler. The leaf went through nine months of double fermentation.',
    notes: {
      first: ['black pepper', 'dry earth', 'cocoa'],
      second: ['dark chocolate', 'coffee', 'molasses'],
      final: ['leather', 'dried fig', 'black pepper'],
    },
    pairing: 'A dark rum without ice, or an espresso after dinner.',
  }),
  cigar({
    id: 'pilon-belicoso',
    line: 'pilon',
    lineName: 'Pilón',
    vitola: 'Belicoso',
    lengthIn: 5.5,
    lengthInLabel: '5½',
    lengthMm: 140,
    ring: 52,
    smokingMinutes: 65,
    priceEuros: 14.5,
    box: [20, 270],
    description:
      'A belicoso: 5½ inches with a tapered head, about sixty-five minutes. The Pilón blend of Maduro wrapper from Mexico and Estelí binder. Full-bodied.',
    notes: {
      first: ['black pepper', 'cocoa', 'cedar'],
      second: ['dark chocolate', 'coffee', 'raisin'],
      final: ['leather', 'molasses', 'dry earth'],
    },
    pairing: 'An espresso after dinner.',
  }),
  cigar({
    id: 'pilon-toro',
    line: 'pilon',
    lineName: 'Pilón',
    vitola: 'Toro',
    lengthIn: 6,
    lengthInLabel: '6',
    lengthMm: 152,
    ring: 54,
    smokingMinutes: 75,
    priceEuros: 14,
    box: [20, 260],
    description:
      'The widest cigar we make: a 6 × 54, about seventy-five minutes. Maduro wrapper from Mexico, Estelí binder, and Estelí ligero and Ometepe in the filler. Full-bodied.',
    notes: {
      first: ['black pepper', 'dry earth', 'coffee'],
      second: ['dark chocolate', 'molasses', 'dried fig'],
      final: ['leather', 'coffee', 'black pepper'],
    },
    pairing: 'A dark rum without ice.',
  }),
  // La Vela
  cigar({
    id: 'la-vela-lancero',
    line: 'la-vela',
    lineName: 'La Vela',
    vitola: 'Lancero',
    lengthIn: 7.5,
    lengthInLabel: '7½',
    lengthMm: 191,
    ring: 38,
    smokingMinutes: 70,
    priceEuros: 16,
    box: [20, 300],
    description:
      'The longest and the thinnest cigar we make: 7½ × 38, about seventy minutes. A Corojo 99 wrapper from Estelí over a Jalapa binder. Medium to full.',
    notes: {
      first: ['cedar', 'black pepper', 'nutmeg'],
      second: ['cocoa', 'dried fig', 'toast'],
      final: ['leather', 'black pepper', 'coffee'],
    },
    pairing: 'Black coffee, without sugar.',
  }),
  cigar({
    id: 'la-vela-corona',
    line: 'la-vela',
    lineName: 'La Vela',
    vitola: 'Corona',
    lengthIn: 5.625,
    lengthInLabel: '5⅝',
    lengthMm: 143,
    ring: 44,
    smokingMinutes: 50,
    priceEuros: 16,
    box: [20, 300],
    description:
      'A 5⅝ × 44 in the La Vela blend, about fifty minutes. Corojo 99 wrapper from Estelí, binder from Jalapa, and filler leaf aged forty-two months. Medium to full.',
    notes: {
      first: ['cedar', 'nutmeg', 'black pepper'],
      second: ['cocoa', 'dried fig', 'leather'],
      final: ['coffee', 'dark chocolate'],
    },
    pairing: 'An espresso.',
  }),
  cigar({
    id: 'la-vela-robusto',
    line: 'la-vela',
    lineName: 'La Vela',
    vitola: 'Robusto',
    lengthIn: 5,
    lengthInLabel: '5',
    lengthMm: 127,
    ring: 50,
    smokingMinutes: 60,
    priceEuros: 17,
    box: [20, 315],
    description:
      'A 5 × 50 with a Corojo 99 wrapper from Estelí and filler from Estelí, Jalapa and Condega. About an hour. Medium to full.',
    notes: {
      first: ['black pepper', 'cedar', 'cinnamon'],
      second: ['cocoa', 'raisin', 'leather'],
      final: ['dark chocolate', 'coffee', 'black pepper'],
    },
    pairing: 'A dark rum without ice, or an espresso.',
  }),
  cigar({
    id: 'la-vela-toro',
    line: 'la-vela',
    lineName: 'La Vela',
    vitola: 'Toro',
    lengthIn: 6,
    lengthInLabel: '6',
    lengthMm: 152,
    ring: 52,
    smokingMinutes: 75,
    priceEuros: 19,
    box: [20, 355],
    description:
      'The La Vela blend in a 6 × 52: forty-two months as leaf and six more as a cigar. Corojo 99 wrapper from Estelí, binder from Jalapa, about seventy-five minutes. Medium to full.',
    notes: {
      first: ['cedar', 'black pepper', 'nutmeg'],
      second: ['cocoa', 'dried fig', 'leather'],
      final: ['dark chocolate', 'coffee', 'molasses'],
    },
    pairing: 'A dark rum without ice, late in the evening.',
  }),
];

// Cosecha 2020: one cigar, sold singly or in a numbered box of ten. No pack of 5.
const cosecha: Cigar = {
  kind: 'cigar',
  id: 'cosecha-2020-toro',
  line: 'cosecha-2020',
  vitola: 'Toro',
  lengthIn: 6,
  lengthInLabel: '6',
  lengthMm: 152,
  ring: 50,
  smokingMinutes: 75,
  description:
    'One harvest, 2020: sixty months as leaf and twelve as a cigar. A Habano Rosado wrapper from Jalapa over a Jalapa binder, in a 6 × 50. Sold singly or in a numbered box of ten.',
  notes: {
    first: ['cedar', 'white pepper', 'cinnamon'],
    second: ['honey', 'dried fig', 'cocoa'],
    final: ['leather', 'dark chocolate', 'toast'],
  },
  pairing: 'Black coffee, or a dark rum without ice.',
  options: [
    { type: 'single', quantity: 1, priceCents: eur(32) },
    { type: 'box', quantity: 10, priceCents: eur(310) },
  ],
  availability: 'limited',
  // “Limited to 2 boxes per order.” (blueprint 4.6)
  maxPerOrder: 2,
  images: {
    catalog: {
      kind: 'asset',
      src: 'products/cosecha-2020/cosecha-2020-toro-production-master-2000w',
      alt: 'Cosecha 2020 Toro, one cigar with a plain paper band, shot from above on dark textured paper',
      ratios: ['3:2'],
    },
    band: {
      kind: 'asset',
      src: 'products/cosecha-2020/cosecha-2020-band-production-master-2000w',
      alt: 'The Cosecha 2020 band, a cream paper band printed with a CV monogram in an oval, close-up on the wrapper',
      ratios: ['1:1'],
    },
    foot: {
      kind: 'asset',
      src: 'products/cosecha-2020/cosecha-2020-foot-production-master-2000w',
      alt: 'The foot of a Cosecha 2020 cigar, showing the layers of filler leaf',
      ratios: ['1:1'],
    },
    // Blueprint 3 R5 and 6.9 frame 9.
    box: {
      kind: 'asset',
      src: 'home/cosecha-open-box-production-master-1920w',
      alt: 'An open cedar box of ten cigars seen from above on warm paper, with the lid folded back',
      ratios: ['4:3', '1:1'],
    },
  },
};

// Muestrario: four Robustos, one per line, in a cedar box. €48.00.
const muestrario: ProductInput = {
  kind: 'sampler',
  id: 'muestrario',
  line: 'muestrario',
  description:
    'Not sure where to start? The Muestrario holds one cigar from each line. Four Robustos in a cedar box: Jalapa, Galera, Pilón and La Vela.',
  contents: ['jalapa-robusto', 'galera-robusto', 'pilon-robusto', 'la-vela-robusto'],
  options: [{ type: 'box', quantity: 4, priceCents: eur(48) }],
  availability: 'in_stock',
  // One photograph serves both frames: the open box with its four cigars.
  images: {
    catalog: {
      kind: 'asset',
      src: 'products/muestrario/muestrario-production-master-2000w',
      alt: 'The Muestrario: an open cedar box holding four Robustos, one from each line',
      ratios: ['3:2'],
    },
    box: {
      kind: 'asset',
      src: 'products/muestrario/muestrario-production-master-2000w',
      alt: 'The open cedar Muestrario box with its four Robustos',
      ratios: ['4:3'],
    },
  },
};

/** 16 items: 15 cigars and the Muestrario (blueprint 2.2, 4.4). */
export const products: ProductInput[] = [...cigars, cosecha, muestrario];
