import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { glossary, tobaccoStages } from './data/tobacco.ts';
import { house } from './data/house.ts';
import { lines } from './data/lines.ts';
import { photos } from './data/photos.ts';
import { products } from './data/products.ts';
import { regions } from './data/regions.ts';
import {
  articleSchema,
  glossaryTermSchema,
  houseSchema,
  lineSchema,
  photoSchema,
  productSchema,
  regionSchema,
  tobaccoStageSchema,
} from './lib/schemas.ts';

// The canonical content. Records live in src/data (typed against these schemas) and in
// src/content/journal (Markdown). Astro validates every record when it loads a collection,
// so a wrong record stops the build. Rules a schema cannot express are checked by
// `npm run validate:content`. Pages read through src/lib/catalogue.ts, never from the files.
const records =
  <T extends { id: string }>(items: readonly T[]) =>
  () =>
    items.map((item) => ({ ...item }));

export const collections = {
  lines: defineCollection({ loader: records(lines), schema: lineSchema }),
  products: defineCollection({ loader: records(products), schema: productSchema }),
  regions: defineCollection({ loader: records(regions), schema: regionSchema }),
  tobaccoStages: defineCollection({ loader: records(tobaccoStages), schema: tobaccoStageSchema }),
  glossary: defineCollection({ loader: records(glossary), schema: glossaryTermSchema }),
  photos: defineCollection({ loader: records(photos), schema: photoSchema }),
  // A single record, id “house”.
  house: defineCollection({ loader: records([{ id: 'house', ...house }]), schema: houseSchema }),
  journal: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
    schema: articleSchema,
  }),
};
