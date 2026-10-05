// Validates the canonical content against the blueprint. Run by `npm run build`, or alone:
//   npm run validate:content
//
// 1. Every record parses against its schema (src/lib/schemas.ts).
// 2. Cross-references resolve; counts match the blueprint (6 lines, 16 items).
// 3. The catalogue and the composition tables are compared with tables 4.2 in
//    docs/casa-velado-blueprint.md itself, so the data cannot drift from the approved numbers.
// 4. Text rules from the blueprint: forbidden words, vocabulary of the tasting notes, British
//    spelling, typographic quotes, placeholders, no contact details, no Bulgarian on the site.
// Content that is still to be written (null) is reported, not failed.
//
// The data files are TypeScript and are imported directly (Node strips the types).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = (p) => new URL(`../src/${p}`, import.meta.url).href;

const [{ lines }, { products }, { regions }, { photos }, { tobaccoStages, glossary }, { house }] =
  await Promise.all([
    import(src('data/lines.ts')),
    import(src('data/products.ts')),
    import(src('data/regions.ts')),
    import(src('data/photos.ts')),
    import(src('data/tobacco.ts')),
    import(src('data/house.ts')),
  ]);
const { microcopy, identity, nav } = await import(src('data/site.ts'));
const { PLACEHOLDER_TOKENS } = await import(src('data/placeholders.ts'));
const { contact } = await import(src('data/contact.ts'));
const { FORBIDDEN_WORDS, TASTING_VOCABULARY, VITOLAS, MAX_NOTES_PER_THIRD } = await import(
  src('data/taxonomy.ts')
);
const { JOURNAL_ORDER } = await import(src('data/journal.ts'));
const { legalPages, legalMeta } = await import(src('data/legal.ts'));
const schemas = await import(src('lib/schemas.ts'));
const { formatLeaf, formatPrice } = await import(src('lib/format.ts'));

const errors = [];
const info = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

// ── 1. Schemas ──────────────────────────────────────────────────────────────
function parseAll(name, schema, records) {
  for (const record of records) {
    const result = schema.safeParse(record);
    if (!result.success) {
      for (const issue of result.error.issues) {
        fail(`${name}/${record.id ?? '?'}`, `${issue.path.join('.')} ${issue.message}`);
      }
    }
  }
}
parseAll('lines', schemas.lineSchema, lines);
parseAll('products', schemas.productSchema, products);
parseAll('regions', schemas.regionSchema, regions);
parseAll('photos', schemas.photoSchema, photos);
parseAll('tobaccoStages', schemas.tobaccoStageSchema, tobaccoStages);
parseAll('glossary', schemas.glossaryTermSchema, glossary);
parseAll('house', schemas.houseSchema, [{ id: 'house', ...house }]);

// Journal: Markdown with a small, flat front matter.
function parseFrontMatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text.replace(/\r\n/g, '\n'));
  if (!match) throw new Error('no front matter');
  const data = {};
  let current = null;
  const scalar = (v) => {
    v = v.trim();
    if (v === 'null') return null;
    if (v.startsWith('[')) return JSON.parse(v.replaceAll("'", '"'));
    if (v.startsWith('"')) return JSON.parse(v);
    if (v.startsWith("'")) return v.slice(1, -1).replaceAll("''", "'");
    return v;
  };
  for (const line of match[1].split('\n')) {
    const nested = /^ {2}(\w+):\s*(.*)$/.exec(line);
    if (nested && current) {
      data[current][nested[1]] = scalar(nested[2]);
      continue;
    }
    const top = /^(\w+):\s*(.*)$/.exec(line);
    if (!top) throw new Error(`cannot read front matter line: ${line}`);
    if (top[2] === '') {
      data[top[1]] = {};
      current = top[1];
    } else {
      data[top[1]] = scalar(top[2]);
      current = null;
    }
  }
  return { data, body: match[2] };
}

const journalDir = join(root, 'src/content/journal');
const articles = readdirSync(journalDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const { data, body } = parseFrontMatter(readFileSync(join(journalDir, f), 'utf8'));
    return { id: f.replace(/\.md$/, ''), data, body };
  });
for (const a of articles) {
  const result = schemas.articleSchema.safeParse(a.data);
  if (!result.success) {
    for (const issue of result.error.issues)
      fail(`journal/${a.id}`, `${issue.path.join('.')} ${issue.message}`);
  }
}

// ── 2. Counts and references ─────────────────────────────────────────────────
const ids = (items) => items.map((i) => i.id);
const unique = (name, list) => {
  const dupes = list.filter((v, i) => list.indexOf(v) !== i);
  if (dupes.length) fail(name, `duplicate ids: ${dupes.join(', ')}`);
};
unique('lines', ids(lines));
unique('products', ids(products));
unique('photos', ids(photos));
unique('regions', ids(regions));

const lineById = new Map(lines.map((l) => [l.id, l]));
const productById = new Map(products.map((p) => [p.id, p]));
const regionIds = new Set(ids(regions));
const photoIds = new Set(ids(photos));

if (lines.length !== 6)
  fail('lines', `expected 6 (4 permanent, the edition, the sampler), found ${lines.length}`);
if (lines.filter((l) => l.kind === 'permanent').length !== 4)
  fail('lines', 'expected 4 permanent lines');
if (lines.filter((l) => l.kind === 'edition').length !== 1) fail('lines', 'expected 1 edition');
if (lines.filter((l) => l.kind === 'sampler').length !== 1) fail('lines', 'expected 1 sampler');
if (products.length !== 16) fail('products', `expected 16 items, found ${products.length}`);
if (products.filter((p) => p.kind === 'cigar').length !== 15)
  fail('products', 'expected 15 cigars');
if (JSON.stringify(lines.map((l) => l.order)) !== JSON.stringify([1, 2, 3, 4, 5, 6]))
  fail('lines', 'order must be 1 to 6');

const perLine = Object.fromEntries(
  lines.map((l) => [l.id, products.filter((p) => p.line === l.id).length]),
);
const expectedPerLine = {
  jalapa: 3,
  galera: 4,
  pilon: 3,
  'la-vela': 4,
  'cosecha-2020': 1,
  muestrario: 1,
};
for (const [id, n] of Object.entries(expectedPerLine)) {
  if (perLine[id] !== n) fail(`products`, `line ${id} should have ${n} items, has ${perLine[id]}`);
}
for (const p of products) {
  if (!lineById.has(p.line)) fail(`products/${p.id}`, `unknown line “${p.line}”`);
  if (p.kind === 'cigar' && p.id !== `${p.line}-${p.vitola.toLowerCase().replaceAll(' ', '-')}`) {
    fail(`products/${p.id}`, 'id must be [line]-[vitola] (blueprint 2.1)');
  }
  if (p.kind === 'cigar' && !VITOLAS.includes(p.vitola))
    fail(`products/${p.id}`, `unknown vitola ${p.vitola}`);
  if (p.kind === 'sampler') {
    for (const c of p.contents) {
      const target = productById.get(c);
      if (!target) fail(`products/${p.id}`, `contents: unknown product “${c}”`);
      else if (target.kind !== 'cigar' || target.vitola !== 'Robusto')
        fail(`products/${p.id}`, `${c} is not a Robusto`);
    }
    const covered = new Set(p.contents.map((c) => productById.get(c)?.line));
    if (
      covered.size !== 4 ||
      ['jalapa', 'galera', 'pilon', 'la-vela'].some((l) => !covered.has(l))
    ) {
      fail(
        `products/${p.id}`,
        'contents must be one Robusto from each of the four permanent lines',
      );
    }
  }
}
const leafRegions = (leaf) => leaf.regions.map((r) => r.region);
for (const l of lines.filter((x) => x.kind !== 'sampler')) {
  for (const leaf of [l.wrapper, l.binder, ...l.filler]) {
    for (const r of leafRegions(leaf))
      if (!regionIds.has(r)) fail(`lines/${l.id}`, `unknown region “${r}”`);
  }
}
for (const s of tobaccoStages)
  if (!photoIds.has(s.photo)) fail(`tobaccoStages/${s.id}`, `unknown photo “${s.photo}”`);
if (!photoIds.has(house.archivePhoto)) fail('house', `unknown photo “${house.archivePhoto}”`);
for (const r of house.places) if (!regionIds.has(r)) fail('house', `unknown place “${r}”`);
for (const a of articles)
  if (a.data.relatedProduct && !productById.has(a.data.relatedProduct))
    fail(`journal/${a.id}`, 'unknown relatedProduct');
if (articles.length !== 6) fail('journal', `expected 6 opening entries, found ${articles.length}`);
if (
  JSON.stringify(JOURNAL_ORDER.toSorted()) !== JSON.stringify(articles.map((a) => a.id).toSorted())
)
  fail('journal', 'JOURNAL_ORDER does not match the files');
if (tobaccoStages.length !== 5) fail('tobaccoStages', 'expected 5 chapters');
if (glossary.length !== 11) fail('glossary', 'expected 11 terms (Appendix A)');
if (house.chapters.length !== 5 || house.wontDo.length !== 5)
  fail('house', 'expected 5 chapters and 5 “what we don’t do” items');

// ── 3. The blueprint's own tables ─────────────────────────────────────────────
const blueprint = readFileSync(join(root, 'docs/casa-velado-blueprint.md'), 'utf8');
const cells = (row) =>
  row
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
const tableRows = (startHeading, headerStart) => {
  const at = blueprint.indexOf(startHeading);
  const head = blueprint.indexOf(headerStart, at);
  const rows = [];
  for (const line of blueprint.slice(head).split('\n').slice(2)) {
    if (!line.startsWith('|')) break;
    rows.push(cells(line));
  }
  return rows;
};
const num = (s) => Number(s.replace(/[^\d.]/g, ''));
const eurToCents = (s) => Math.round(Number(s.replace(/[^\d.]/g, '')) * 100);

const catalogue = tableRows('### 4.2 Каталог', '| Продукт | Размер');
if (catalogue.length !== 16)
  fail('blueprint', `catalogue table has ${catalogue.length} rows, expected 16`);
const regionName = (id) => regions.find((r) => r.id === id)?.name ?? id;

for (const row of catalogue) {
  const [name, size, strength, time, single, five, boxCell] = row;
  const m = /^\*\*(.+?)\*\*\s*(.*)$/.exec(name);
  const lineName = m[1];
  const vitola = m[2];
  const line = lines.find((l) => l.name === lineName);
  if (!line) {
    fail('blueprint', `line “${lineName}” not in data`);
    continue;
  }
  const product = vitola
    ? products.find((p) => p.line === line.id && p.kind === 'cigar' && p.vitola === vitola)
    : products.find((p) => p.line === line.id);
  if (!product) {
    fail('blueprint', `${lineName} ${vitola}: no product in data`);
    continue;
  }
  const at = `products/${product.id}`;
  if (product.kind === 'sampler') {
    const box = /€([\d.]+)/.exec(boxCell);
    if (product.options[0].priceCents !== eurToCents(box[1]))
      fail(at, 'Muestrario price differs from the blueprint');
    continue;
  }
  const s = /^(\S+) × (\d+) \((\d+) mm\)$/.exec(size);
  if (product.lengthInLabel !== s[1]) fail(at, `length ${product.lengthInLabel} ≠ ${s[1]}`);
  if (product.ring !== Number(s[2])) fail(at, `ring ${product.ring} ≠ ${s[2]}`);
  if (product.lengthMm !== Number(s[3])) fail(at, `mm ${product.lengthMm} ≠ ${s[3]}`);
  if (line.strength !== Number(strength)) fail(at, `strength ${line.strength} ≠ ${strength}`);
  if (product.smokingMinutes !== num(time)) fail(at, `time ${product.smokingMinutes} ≠ ${time}`);
  const opt = (type) => product.options.find((o) => o.type === type);
  if (opt('single')?.priceCents !== eurToCents(single))
    fail(at, `single ${formatPrice(opt('single')?.priceCents ?? 0)} ≠ ${single}`);
  if (five === '—') {
    if (opt('five')) fail(at, 'a pack of 5 is not sold for this cigar');
  } else if (opt('five')?.priceCents !== eurToCents(five)) fail(at, `pack of 5 ≠ ${five}`);
  const box = /^(\d+) · €(\d+)/.exec(boxCell);
  if (opt('box')?.quantity !== Number(box[1]) || opt('box')?.priceCents !== Number(box[2]) * 100)
    fail(at, `box ≠ ${boxCell}`);
}

const composition = tableRows('**Състав по линии**', '| Линия | Wrapper');
for (const row of composition) {
  const [name, wrapper, binder, filler, harvest, ferment, ageing] = row;
  const line = lines.find(
    (l) => l.name === name || (name === 'Cosecha 2020' && l.id === 'cosecha-2020'),
  );
  if (!line) {
    fail('blueprint', `composition: line “${name}” not in data`);
    continue;
  }
  const at = `lines/${line.id}`;
  const plain = (s) => s.replaceAll('*', '');
  const out = (leaf) => formatLeaf(leaf, regionName, { html: false });
  if (out(line.wrapper) !== plain(wrapper))
    fail(at, `wrapper “${out(line.wrapper)}” ≠ “${plain(wrapper)}”`);
  if (out(line.binder) !== plain(binder))
    fail(at, `binder “${out(line.binder)}” ≠ “${plain(binder)}”`);
  if (line.filler.map(out).join('; ') !== plain(filler))
    fail(at, `filler “${line.filler.map(out).join('; ')}” ≠ “${plain(filler)}”`);
  if (line.harvestYear !== Number(harvest)) fail(at, `harvest ${line.harvestYear} ≠ ${harvest}`);
  const ferm = `${line.fermentationMonths} months${line.fermentationNote ? `, ${line.fermentationNote}` : ''}`;
  if (ferm !== ferment) fail(at, `fermentation “${ferm}” ≠ “${ferment}”`);
  if (`${line.leafAgeingMonths} / ${line.cigarAgeingMonths} months` !== ageing)
    fail(at, `ageing ≠ ${ageing}`);
  if (name === 'Cosecha 2020' && line.editionYear !== line.harvestYear)
    fail(at, 'edition year and harvest year differ');
}

// The sentences of home R3.
const r3 = tableRows('- **Съдържание:** етикет „The collection“', '| Линия | Изречение');
for (const [name, sentence] of r3) {
  const line = lines.find((l) => l.name === name);
  if (line && line.tagline !== sentence.replace(/[“”]/g, ''))
    fail(`lines/${line.id}`, `tagline “${line.tagline}” ≠ “${sentence}”`);
}

// ── 4. Values and text rules ────────────────────────────────────────────────
const FRACTIONS = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};
const lengthFromLabel = (label) =>
  [...label].reduce((sum, ch) => (FRACTIONS[ch] ? sum + FRACTIONS[ch] : sum), 0) +
  Number(label.replace(/[^\d]/g, '') || 0);
for (const p of products.filter((x) => x.kind === 'cigar')) {
  const at = `products/${p.id}`;
  if (lengthFromLabel(p.lengthInLabel) !== p.lengthIn)
    fail(at, `lengthInLabel ${p.lengthInLabel} ≠ lengthIn ${p.lengthIn}`);
  if (Math.round(p.lengthIn * 25.4) !== p.lengthMm)
    fail(at, `${p.lengthIn} in is ${Math.round(p.lengthIn * 25.4)} mm, data says ${p.lengthMm}`);
  const single = p.options.find((o) => o.type === 'single');
  const five = p.options.find((o) => o.type === 'five');
  if (five && five.priceCents !== single.priceCents * 5)
    fail(at, 'pack of 5 must be five singles, with no discount (blueprint 4.2)');
  if (five && five.quantity !== 5) fail(at, 'pack of 5 has the wrong quantity');
  if (p.availability === 'sold_out' && !p.restockNote) fail(at, 'sold out needs a restock note');
}

const vocab = new Set(TASTING_VOCABULARY);
const approvedGalera = 'galera-robusto'; // the final text given in 4.2, which uses its own wording
for (const p of products.filter((x) => x.kind === 'cigar')) {
  for (const [third, list] of Object.entries(p.notes)) {
    if (list.length > MAX_NOTES_PER_THIRD)
      fail(`products/${p.id}`, `${third}: more than ${MAX_NOTES_PER_THIRD} notes`);
    if (p.id !== approvedGalera)
      for (const n of list)
        if (!vocab.has(n)) fail(`products/${p.id}`, `note “${n}” is not in the vocabulary`);
  }
}

const wordCount = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .trim()
    .split(/\s+/).length;
const sentences = (s) => s.split(/(?<=[.?!])\s+/).filter(Boolean);
const concrete = /\d|Jalapa|Estelí|Condega|Ometepe|Habano|Connecticut|Maduro|Corojo|ligero/;
for (const l of lines.filter((x) => x.kind !== 'sampler')) {
  const n = wordCount(l.description);
  if (n < 60 || n > 90)
    fail(`lines/${l.id}`, `description is ${n} words; the blueprint asks for 60–90`);
}
for (const p of products.filter((x) => x.kind === 'cigar')) {
  const n = sentences(p.description).length;
  if (n < 2 || n > 3) fail(`products/${p.id}`, `description has ${n} sentences; the model has 2–3`);
  if (!concrete.test(p.description))
    fail(`products/${p.id}`, 'description has no concrete fact (blueprint 11)');
}

// Every visible string, with a location.
const strings = [];
const walk = (value, path) => {
  if (typeof value === 'string') strings.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
};
const skipKeys =
  /\.(id|kind|line|vitola|photo|mark|ratios|focus|type|country|region|note|wrapperType|availability|category|metric|href|summaryKey)(\[|$)/;
walk(lines, 'lines');
walk(products, 'products');
walk(
  regions.map(({ name }) => ({ name })),
  'regions',
);
walk(tobaccoStages, 'tobaccoStages');
walk(glossary, 'glossary');
walk(
  photos.map((p) => (p.image.kind === 'asset' ? p.image.alt : p.image.description)),
  'photos',
);
walk(house, 'house');
walk(legalPages, 'legal');
walk(legalMeta, 'legalMeta');
walk(microcopy, 'microcopy');
walk({ ...identity }, 'identity');
walk(
  nav.primary.map((n) => n.label),
  'nav',
);
for (const a of articles)
  walk(
    {
      title: a.data.title,
      cover: a.data.cover.description,
      excerpt: a.data.excerpt ?? '',
      body: a.body.replace(/<!--[^]*?-->/g, ''),
    },
    `journal/${a.id}`,
  );
const visible = strings.filter(([path]) => !skipKeys.test(path));

const forbidden = FORBIDDEN_WORDS.map((w) => [
  w,
  new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu'),
]);
const american =
  /\b(flavor|flavors|flavored|color|colors|colored|favorite|honor|neighbor|center|centered|meter|aging|gray|defense|inquiry|inquire|catalog|program|organize|realize|aluminum)\b/i;
const cartWords = /\b(bag|basket|trolley)\b/i;
const allowedTokens = new Set(PLACEHOLDER_TOKENS);
const tokensUsed = new Map();
for (const [path, s] of visible) {
  for (const [word, re] of forbidden)
    if (re.test(s)) fail(path, `forbidden word “${word}” (blueprint 1.5)`);
  if (american.test(s))
    fail(path, `American spelling “${american.exec(s)[0]}”; the site is British English`);
  if (cartWords.test(s)) fail(path, 'say “cart”, never bag, basket or trolley (blueprint 11)');
  if (/\p{Script=Cyrillic}/u.test(s)) fail(path, 'no Bulgarian on the site');
  if (/[\p{Extended_Pictographic}]/u.test(s.replace(/[✓→←·–—×€⅝½¼¾⅛⅜⅞…“”‘’]/g, '')))
    fail(path, 'no emoji');
  if (/!/.test(s)) fail(path, 'no exclamation marks (blueprint 1.5)');
  if (/[A-Za-z]'[A-Za-z]|"/.test(s.replace(/<[^>]+>/g, '')))
    fail(path, 'use typographic quotes and apostrophes (blueprint 5.2)');
  if (/ {2,}/.test(s)) fail(path, 'double space');
  // The approved fictional contact details (src/data/contact.ts) may appear; no others.
  const bare = s.replaceAll(contact.email, '').replaceAll(contact.phone, '');
  if (/@|https?:|www\./i.test(bare))
    fail(path, 'no addresses or contact details beyond src/data/contact.ts');
  if (/\+?\d[\d ()-]{8,}\d/.test(bare))
    fail(path, 'looks like a phone number; use src/data/contact.ts');
  for (const t of s.match(/\[[A-Z][A-Z ]*\]/g) ?? []) {
    if (!allowedTokens.has(t)) fail(path, `unknown placeholder ${t}`);
    tokensUsed.set(t, (tokensUsed.get(t) ?? 0) + 1);
  }
  const tags = s.match(/<\/?[a-z][^>]*>/gi) ?? [];
  for (const t of tags)
    if (!/^<\/?i( lang="es")?>$/.test(t))
      fail(path, `only <i> and <i lang="es"> are allowed, found ${t}`);
}
// Sentence case for headings and labels.
for (const [path, s] of visible.filter(([p]) => /\.(title|label|name)$|\.tagline$/.test(p))) {
  // Each sentence starts with a capital; the words after the first of a sentence do not.
  const words = s
    .replace(/<[^>]+>/g, '')
    .split(/(?<=[.?]) /)
    .flatMap((sentence) => sentence.split(' ').slice(1))
    .map((w) => w.replace(/[,.:;]$/, ''));
  const proper =
    /^(Casa|Velado|Estelí|Jalapa|Condega|Ometepe|Nicaragua|Galera|Pilón|La|Vela|Cosecha|Tasting|Room|House|Our|Muestrario|Journal|Collection|Tobacco|Cigars|Corona|Gorda|Petit|Robusto|Toro|Belicoso|Churchill|Lancero|Ring|Gauge|Cigar|Instagram|Letters|Maduro|Rosado|Habano|Connecticut|Corojo|San|Andrés|Contact|Shipping|Terms|Privacy|Cookies|Sign|Mild|Medium|Full|The|Today)$/;
  const bad = words.filter((w) => /^[A-Z][a-z]/.test(w) && !proper.test(w));
  if (bad.length) fail(path, `not sentence case: “${s}” (${bad.join(', ')})`);
}

// Length of the chapter text: summaries 30–40 words (Stage 9), bodies 120–180 (Stage 10). A {token}
// stands for a figure the page fills in, so it counts as one word here.
for (const stage of tobaccoStages) {
  const words = (text) =>
    text
      .replace(/<[^>]+>/g, '')
      .split(String.fromCharCode(10))
      .join(' ')
      .split(' ')
      .filter(Boolean).length;
  if (stage.summary !== null) {
    const n = words(stage.summary);
    if (n < 30 || n > 40)
      fail(`tobaccoStages/${stage.id}`, `summary is ${n} words; the blueprint asks for 30–40`);
  }
  if (stage.body !== null) {
    const n = words(stage.body);
    if (n < 120 || n > 180)
      fail(`tobaccoStages/${stage.id}`, `body is ${n} words; the blueprint asks for 120–180`);
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
const pending = [];
const count = (label, n) => n > 0 && pending.push(`${n} × ${label}`);
count(
  'tobacco stage summary (30–40 words, Stage 9)',
  tobaccoStages.filter((s) => s.summary === null).length,
);
count(
  'tobacco stage body (120–180 words, Stage 10)',
  tobaccoStages.filter((s) => s.body === null).length,
);
count(
  'journal entry body (Stage 11)',
  articles.filter((a) => a.body.replace(/<!--[\s\S]*?-->/g, '').trim() === '').length,
);
count('journal excerpt', articles.filter((a) => a.data.excerpt === null).length);
count('journal reading time', articles.filter((a) => a.data.readingMinutes === null).length);
count('journal date [DATE]', articles.filter((a) => a.data.date === '[DATE]').length);
count(
  'journal related product (not set in the blueprint)',
  articles.filter((a) => !a.data.relatedProduct).length,
);
count('Our House introduction (not written in the blueprint)', house.intro === null ? 1 : 0);
count(
  'tobacco facts to verify, shown as [NUMBER]',
  tobaccoStages.flatMap((s) => s.facts).filter((f) => f.kind === 'verify').length,
);
info.push(`pending: ${pending.join('; ')}`);
info.push(`placeholders in the data: ${[...tokensUsed].map(([t, n]) => `${t} ×${n}`).join(', ')}`);
info.push(
  `checked: ${lines.length} lines, ${products.length} items (${products.filter((p) => p.kind === 'cigar').length} cigars), ${regions.length} regions, ${tobaccoStages.length} tobacco stages, ${glossary.length} glossary terms, ${photos.length} page photos, ${articles.length} journal entries, ${strings.length} strings`,
);

for (const line of info) console.log(`  ${line}`);
if (errors.length) {
  console.error(`\nContent validation failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('Content validation passed.');
