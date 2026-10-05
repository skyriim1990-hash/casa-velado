import type { z } from 'astro/zod';
import type { regionSchema } from '../lib/schemas.ts';

type RegionInput = z.input<typeof regionSchema>;

// The four places named in the blueprint (1.9, 2.3). No coordinates, soil or climate are
// recorded: those are facts marked “for verification” and are not written until confirmed.
export const regions = [
  { id: 'esteli', name: 'Estelí', mapGroup: 'north', soilAndClimate: null },
  { id: 'condega', name: 'Condega', mapGroup: 'north', soilAndClimate: null },
  { id: 'jalapa', name: 'Jalapa', mapGroup: 'north', soilAndClimate: null },
  { id: 'ometepe', name: 'Ometepe', mapGroup: 'apart', soilAndClimate: null },
] as const satisfies RegionInput[];
