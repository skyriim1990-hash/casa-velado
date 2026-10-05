import type { z } from 'astro/zod';
import type { glossaryTermSchema, tobaccoStageSchema } from '../lib/schemas.ts';

type StageInput = z.input<typeof tobaccoStageSchema>;
type TermInput = z.input<typeof glossaryTermSchema>;

// The five stages of blueprint 2.3 (/tobacco) and 3 R4 (home). The facts are the blueprint's
// own categories. Facts with no confirmed value are left out; fermentation and ageing are
// read from the lines.
// Nothing here is written as fact about a place, a climate or a method beyond the blueprint.
// The summaries (30–40 words, Stage 9) and the bodies (120–180 words, Stage 10) use only what
// the blueprint, the house record, the glossary and the lines say. A body may hold {fermentation},
// {leafAgeing} or {cigarAgeing}: the page fills them from the lines, so a figure is written once.
export const tobaccoStages: StageInput[] = [
  {
    id: 'the-field',
    order: 1,
    title: 'The field',
    photo: 'tobacco-field',
    facts: [{ kind: 'ledger', label: 'Harvests', metric: 'harvestYear' }],
    summary:
      'We grow part of the leaf ourselves and buy the rest from the same farms in Jalapa and Condega. The harvest is written in the ledger, as it has been on the farm since the first day.',
    body: `The house began in 1987 on a farm outside Estelí, in years when few people were planting tobacco with the next decade in mind. The Velado family did. We still grow part of the leaf ourselves and buy the rest from the same farms in Jalapa and Condega, so every line comes from a harvest we can name.

Each plant gives three kinds of leaf. <i lang="es">Ligero</i> comes from the top of the plant and is the strongest and the slowest to burn. <i lang="es">Seco</i>, from the middle, gives mostly aroma. <i lang="es">Volado</i>, from the bottom, gives mostly combustion. A blend is a choice about how much of each to use. The harvest year is one of the figures the ledger keeps for every line, and we print it on every box.`,
  },
  {
    id: 'the-galera',
    order: 2,
    title: 'The galera',
    photo: 'galera-exterior',
    facts: [{ kind: 'fixed', label: 'The watch', value: 'Through the night' }],
    summary:
      'In the <i lang="es">galera</i>, the curing barn, leaves hang for weeks as they dry and change colour. During the season someone stays through the night, opening and closing the doors as the air turns damp or dry.',
    body: `The house began with a single <i lang="es">galera</i>, a curing barn of timber and corrugated iron. It is still the heart of the farm. Inside, the leaves hang for weeks as they dry and change colour. The work is to let the air do its part, and to watch it.

During the curing season someone stays in the galera through the night, opening and closing the doors as the air turns damp or dry. It is the quietest part of the work, and the part everything else depends on. The house is named after it: <i lang="es">velar</i> is Spanish for to keep watch.

In the first years we sold our leaf to other houses, and they told us which of it had ripened and which had been cured too fast. Those conversations taught us to write everything down.`,
  },
  {
    id: 'the-pilon',
    order: 3,
    title: 'The pilón',
    photo: 'pilon',
    facts: [{ kind: 'ledger', label: 'Fermentation', metric: 'fermentationMonths' }],
    summary:
      'A <i lang="es">pilón</i> is a stack of leaves left to ferment, turned at intervals so the heat stays even. Every line has its own fermentation time, set down in the ledger, and the Pilón line has a double fermentation.',
    body: `A <i lang="es">pilón</i> is a stack of leaves left to ferment. The leaves heat as they ferment, and the stack is turned at intervals so the heat stays even. When we only sold our leaf, the houses that bought it told us which of it had overheated in the pilón.

Each line has its own fermentation time, and it is set down in the ledger: {fermentation} across the five lines, from the shortest to the longest. The Pilón line is fermented twice, the only one of our lines the ledger marks as double, and it is named for this stage. It is dark and dense, a cigar for the evening. Its filler is <i lang="es">ligero</i> from Estelí with leaf from Ometepe, under a San Andrés Maduro wrapper from Mexico.`,
  },
  {
    id: 'ageing',
    order: 4,
    title: 'Ageing',
    photo: 'ageing',
    facts: [
      { kind: 'ledger', label: 'Leaf ageing', metric: 'leafAgeingMonths' },
      { kind: 'ledger', label: 'Cigar ageing', metric: 'cigarAgeingMonths' },
      { kind: 'fixed', label: 'On the box', value: 'Harvest year, months aged' },
    ],
    summary:
      'After fermentation the leaf is aged, and after rolling the cigar is aged again, in cedar rooms. Each line has its own months for both, and every box prints how many months the leaf has aged.',
    body: `Fermentation does not finish the leaf. It is aged, in cedar rooms, for {leafAgeing} depending on the line. Then it is rolled, and the finished cigar is aged again, for {cigarAgeing}. Cosecha 2020, our one edition, is at the long end of both.

We do not shorten the ageing to meet a date. It takes the months it takes, and the months are written on the box.

On every box we print the harvest year and how many months the leaf has aged. Not because it is fashionable, but because that is how the ledger has been kept on the farm since the first day. We print nothing on the box that is not in the ledger. Leaf ageing and cigar ageing are two separate figures there, and the box carries the first of them.`,
  },
  {
    id: 'the-table',
    order: 5,
    title: 'The table',
    photo: 'roller-table',
    facts: [
      { kind: 'fixed', label: 'Method', value: 'Rolled by hand' },
      { kind: 'fixed', label: 'Machines', value: 'None' },
    ],
    summary:
      'At the table every cigar is rolled by hand, and never by machine: all four permanent lines and the yearly edition. We print nothing on the box that is not in the ledger.',
    body: `At the table every cigar is rolled by hand. We do not roll by machine. The cigar is built from the filler, <i lang="es">tripa</i>, held together by the binder, <i lang="es">capote</i>, and finished with the wrapper, <i lang="es">capa</i>.

<i lang="es">Entubado</i> is the slower way to roll a cigar: each filler leaf is folded into a small tube, for an even draw.

Every format is made this way, from the Petit Corona of four and a half inches to the Lancero of seven and a half. The four permanent lines and the yearly edition are all rolled by hand.

The first cigars to carry our name were rolled for the family and for a few merchants who knew us. The orders grew; we stayed few. We decided not to grow faster than the tobacco allows.`,
  },
];

// Appendix A, word for word. Every definition is marked “for verification” in the blueprint.
export const glossary: TermInput[] = [
  {
    id: 'galera',
    term: 'Galera',
    spanish: true,
    meaning: 'The curing barn, where leaves hang for weeks as they dry and change colour.',
  },
  {
    id: 'pilon',
    term: 'Pilón',
    spanish: true,
    meaning: 'A stack of leaves left to ferment, turned at intervals so the heat stays even.',
  },
  { id: 'capa', term: 'Capa', spanish: true, meaning: 'The wrapper, the outer leaf.' },
  {
    id: 'capote',
    term: 'Capote',
    spanish: true,
    meaning: 'The binder, the leaf that holds the filler together.',
  },
  { id: 'tripa', term: 'Tripa', spanish: true, meaning: 'The filler.' },
  {
    id: 'ligero',
    term: 'Ligero',
    spanish: true,
    meaning: 'Leaves from the top of the plant: the strongest and the slowest to burn.',
  },
  {
    id: 'seco',
    term: 'Seco',
    spanish: true,
    meaning: 'Leaves from the middle of the plant: mostly aroma.',
  },
  {
    id: 'volado',
    term: 'Volado',
    spanish: true,
    meaning: 'Leaves from the bottom of the plant: mostly combustion.',
  },
  {
    id: 'entubado',
    term: 'Entubado',
    spanish: true,
    meaning:
      'A rolling method in which each filler leaf is folded into a small tube, for an even draw.',
  },
  {
    id: 'vitola',
    term: 'Vitola',
    spanish: true,
    meaning: 'The format of a cigar: its length, ring gauge and shape.',
  },
  {
    id: 'ring-gauge',
    term: 'Ring gauge',
    spanish: false,
    meaning: 'The diameter of a cigar, in 64ths of an inch.',
  },
];
