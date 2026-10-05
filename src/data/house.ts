import type { z } from 'astro/zod';
import type { houseSchema } from '../lib/schemas.ts';

// Our House (blueprint 1.8 and 2.3). The chapters are the approved text, word for word.
// <i lang="es"> marks Spanish craft terms for screen readers (blueprint 0.1).
export const house = {
  // The H1 introduction is not written in the blueprint.
  intro: null,
  chapters: [
    {
      id: 'the-beginning',
      title: 'The beginning',
      paragraphs: [
        `The house began in 1987 with land outside Estelí and a single curing barn built of timber and corrugated iron. Those were difficult years across the north of the country. Few people were planting tobacco with the next decade in mind. The Velado family did.`,
      ],
    },
    {
      id: 'leaf-before-cigars',
      title: 'Leaf before cigars',
      paragraphs: [
        'For the first years we made no cigars. We sold our leaf to other houses and listened to what they told us about it: which leaf had ripened, which had been cured too fast, which had overheated in the <i lang="es">pilón</i>. Those conversations taught us more than any book could. They also taught us to write everything down.',
      ],
    },
    {
      id: 'the-name',
      title: 'The name',
      paragraphs: [
        '<i lang="es">Velar</i> is Spanish for “to keep watch”. During the curing season someone stays in the <i lang="es">galera</i> through the night, opening and closing the doors as the air turns damp or dry. It is the quietest part of the work, and the part everything else depends on. The house is named after it.',
      ],
    },
    {
      id: 'the-first-cigars',
      title: 'The first cigars',
      paragraphs: [
        'The first cigars to carry our name were rolled for the family and for a few merchants who knew us. The orders grew; we stayed few. We decided not to grow faster than the tobacco allows.',
      ],
    },
    {
      id: 'today',
      title: 'Today',
      paragraphs: [
        'Casa Velado makes four permanent lines and one edition a year from a single harvest. We grow part of the leaf ourselves and buy the rest from the same farms in Jalapa and Condega. We cure it in <i lang="es">galeras</i>, ferment it in <i lang="es">pilones</i>, age it in cedar rooms and roll it by hand.',
        'On every box we print the harvest year and how many months the leaf has aged. Not because it is fashionable, but because that is how the ledger has been kept on the farm since the first day.',
      ],
    },
  ],
  signature: 'Enough, and no more.',
  archivePhoto: 'archive-galera',
  // The map: Estelí, Condega and Jalapa together, Ometepe apart. Positions are not recorded.
  places: ['esteli', 'condega', 'jalapa', 'ometepe'],
  // The evolution of the ring, oldest first. The middle ring's year is not known.
  rings: [
    { mark: 'band-1987', label: '1987' },
    { mark: 'band-mid', label: '2020' },
    { mark: 'band-current', label: 'Today' },
  ],
  // “What we don’t do” (final text, blueprint 2.3).
  wontDo: [
    'We don’t make flavoured cigars.',
    'We don’t roll by machine.',
    'We don’t add a new line every season.',
    'We don’t shorten the ageing to meet a date.',
    'We don’t print anything on the box that isn’t in the ledger.',
  ],
} as const satisfies z.input<typeof houseSchema>;
