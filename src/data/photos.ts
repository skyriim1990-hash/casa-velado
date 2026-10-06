import type { z } from 'astro/zod';
import type { photoSchema } from '../lib/schemas.ts';

type PhotoInput = z.input<typeof photoSchema>;

const frame = (
  n: number,
  id: string,
  description: string,
  ratios: PhotoInput['image']['ratios'],
  usedIn: string[],
): PhotoInput => ({
  id,
  frame: n,
  image: { kind: 'placeholder', description, ratios },
  usedIn,
});

// The frames of blueprint 6.9 that belong to a page, not to a product or an article.
// Frames 14 to 17 (catalogue, band, foot, box) are on each product; frame 18 (journal
// covers) is on each article. Descriptions are the blueprint's own; the crops follow the
// table: wide for 1024 and up, middle for 640–1023, tall below 640.
export const photos: PhotoInput[] = [
  // Frame 1 (Stage 14.5–14.6): three separate crops cut from the production master
  // (home/hero-galera-production-master-3734w): 21:9 from 1024px, and the 4:3 crop below that (a phone shows more of the scene than the 4:5 did).
  {
    id: 'hero-galera',
    frame: 1,
    image: {
      kind: 'asset',
      src: 'home/hero-galera-wide',
      alt: 'Inside a tobacco curing barn: bunches of brown leaves hang from wooden poles, and daylight falls through the gaps between the boards',
      ratios: ['21:9', '4:3', '4:3'],
      crops: [{ ratio: '4:3', src: 'home/hero-galera-mid' }],
    },
    usedIn: ['Home R1'],
  },
  {
    id: 'name-hands',
    frame: 2,
    image: {
      kind: 'asset',
      src: 'tobacco/the-name-production-master-2560w',
      alt: 'A worker’s weathered hands smoothing a bundle of dried tobacco leaves on a worn wooden beam, with leaves hanging in the barn behind',
      ratios: ['3:2', '4:5', '4:5'],
    },
    usedIn: ['Home R2', 'Our House'],
  },
  // The first final photograph (Stage 14.4). One master; the build makes the three crops from
  // it (16:9 from 1024px, 4:3 from 640px, 4:5 below) and the 3:2 of the chapter and Home R4.
  // Focus: the 16:9 loses only sky at the top; the narrower crops keep the middle of the
  // field, which leaves out the drying shed at the left.
  {
    id: 'tobacco-field',
    frame: 3,
    image: {
      kind: 'asset',
      src: 'tobacco/tobacco-field-production-master-2560w',
      alt: 'Rows of tobacco plants at eye level, with wooded hills and low mountains in morning mist behind them',
      ratios: ['16:9', '4:3', '4:5'],
      focus: '50% 75%',
    },
    usedIn: ['Tobacco hero', 'Home R4'],
  },
  // Frames 4 to 7, 9, 10 and 12 (Stage 14): production masters, one file each (frame 5 also has
  // its own 4:5 file; frame 10 has three separate crops).
  {
    id: 'galera-exterior',
    frame: 4,
    image: {
      kind: 'asset',
      src: 'tobacco/galera-exterior-production-master-1920w',
      alt: 'The curing barn from outside in the early morning: weathered timber walls, a corrugated roof and bare earth in front, with hills behind',
      ratios: ['3:2'],
    },
    usedIn: ['Home R4', 'Tobacco'],
  },
  {
    id: 'pilon',
    frame: 5,
    image: {
      kind: 'asset',
      src: 'tobacco/pilon-production-master-1920w',
      alt: 'A hand holding a dial thermometer into a fermenting pile of tobacco, part of it covered with coarse jute',
      ratios: ['3:2', '4:5'],
      crops: [{ ratio: '4:5', src: 'tobacco/pilon-tall-production-master-1280w' }],
    },
    usedIn: ['Home R4', 'Tobacco'],
  },
  {
    id: 'ageing',
    frame: 6,
    image: {
      kind: 'asset',
      src: 'tobacco/cedar-shelves-production-master-1920w',
      alt: 'Cedar shelves in the ageing room holding bundles of tobacco and boxes, with small paper tags tied to the shelves',
      ratios: ['3:2'],
    },
    usedIn: ['Home R4', 'Tobacco'],
  },
  {
    id: 'roller-table',
    frame: 7,
    image: {
      kind: 'asset',
      src: 'tobacco/torcedor-table-production-master-1920w',
      alt: 'A roller’s hands at a worn wooden bench, cutting a wrapper leaf with a chaveta beside a jar of glue and scraps of leaf',
      ratios: ['3:2', '4:5'],
    },
    usedIn: ['Home R4', 'Tobacco'],
  },
  frame(8, 'sorting', 'sorting leaves by colour', ['3:2'], ['Tobacco']),
  {
    id: 'cosecha-box',
    frame: 9,
    image: {
      kind: 'asset',
      src: 'home/cosecha-open-box-production-master-1920w',
      alt: 'An open cedar box of ten cigars seen from above on warm paper, with the lid folded back',
      ratios: ['4:3', '1:1'],
    },
    usedIn: ['Home R5', 'Cosecha 2020 product'],
  },
  {
    id: 'tasting-room',
    frame: 10,
    image: {
      kind: 'asset',
      src: 'salon/room-wide',
      alt: 'The empty tasting room in the morning: two worn leather armchairs and an old wooden table with a cigar tray and a notebook, with open arched doors onto a courtyard',
      ratios: ['16:9', '4:3', '4:5'],
      crops: [
        { ratio: '4:3', src: 'salon/room-mid' },
        { ratio: '4:5', src: 'salon/room-tall' },
      ],
    },
    usedIn: ['Home R7', 'Tasting Room'],
  },
  frame(11, 'tasting-room-detail', 'humidor, coffee, cigar in ashtray', ['4:5'], ['Tasting Room']),
  {
    id: 'archive-galera',
    frame: 12,
    image: {
      kind: 'asset',
      src: 'house/archive-galera-production-master-1920w',
      alt: 'The Casa Velado curing house: a two-storey timber building with louvred vents, tobacco leaves hanging in the open gallery and green hills behind',
      ratios: ['3:2'],
    },
    usedIn: ['Our House'],
  },
  frame(
    13,
    'ledger-page',
    'scanned page from the harvest ledger',
    ['4:5'],
    ['Our House', 'Journal: why we print the harvest year on the box'],
  ),
  {
    id: 'tasting-map',
    frame: 19,
    image: {
      kind: 'asset',
      src: 'salon/tasting-room-map',
      alt: 'A dark, simplified map of Estelí and the hills around it, with the Casa Velado marker at the centre',
      ratios: ['3:2'],
    },
    usedIn: ['Tasting Room'],
  },
];
