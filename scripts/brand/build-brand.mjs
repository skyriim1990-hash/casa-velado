// Generates the Casa Velado brand SVGs, with every letter converted to outlines
// (blueprint 5.5), and the favicon set. Run by hand; it is not part of `npm run build`.
//
//   npm i --no-save fontkit            (not a project dependency)
//   FONT_DIR=<folder with the two source TTFs> node scripts/brand/build-brand.mjs
//
// Source fonts (SIL OFL), from github.com/google/fonts:
//   ofl/ebgaramond/EBGaramond[wght].ttf
//   ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf
//
// Output:
//   src/brand/   logo-wordmark.svg, logo-wordmark-stacked.svg, monogram.svg,
//                band-1987.svg, band-mid.svg, band-current.svg
//   public/      favicon.svg, favicon.ico, apple-touch-icon.png
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const FONT_DIR = process.env.FONT_DIR;
if (!FONT_DIR) throw new Error('Set FONT_DIR to the folder with the source TTFs.');
const requireFrom = createRequire(process.env.FONTKIT_FROM ?? join(root, 'package.json'));
const fontkit = requireFrom('fontkit');
const projectRequire = createRequire(join(root, 'package.json'));
const sharp = projectRequire('sharp');
const { optimize } = projectRequire('svgo'); // ships with Astro; not a direct dependency

const garamond = fontkit.openSync(join(FONT_DIR, 'ebgaramond_EBGaramond[wght].ttf'));
const plex = fontkit.openSync(join(FONT_DIR, 'ibmplexsans_IBMPlexSans[wdth,wght].ttf'));

// ── Typesetting helpers ──────────────────────────────────────────────────
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Set a line of text as outlines.
 * size: font-size in SVG units. tracking: letter-spacing in em.
 * pairs: optical corrections in 1/1000 em, keyed by the two letters ("AV": -20).
 * Returns { d, width, capHeight, glyphs: [{ch, x, width}] } with x measured from the origin.
 */
function setLine(font, text, { size, tracking = 0, pairs = {}, wordSpace = 1 }) {
  const scale = size / font.unitsPerEm;
  const run = font.layout(text, ['kern']);
  let x = 0;
  const parts = [];
  const glyphs = [];
  run.glyphs.forEach((glyph, i) => {
    const ch = text[i];
    const pos = run.positions[i];
    const gx = x + (pos.xOffset ?? 0) * scale;
    if (ch !== ' ') {
      const path = glyph.path.transform(scale, 0, 0, -scale, gx, 0);
      parts.push(
        path.toSVG().replace(/-?\d+\.\d+/g, (m) => String(Math.round(Number(m) * 10) / 10)),
      );
      const b = glyph.bbox;
      glyphs.push({ ch, x: gx, left: gx + b.minX * scale, right: gx + b.maxX * scale });
    }
    let advance = pos.xAdvance * scale + tracking * size;
    if (ch === ' ') advance *= wordSpace;
    const next = text[i + 1];
    if (next && pairs[ch + next] !== undefined) advance += (pairs[ch + next] / 1000) * size;
    x += advance;
  });
  const first = glyphs[0];
  const last = glyphs[glyphs.length - 1];
  return {
    d: parts.join(''),
    // ink extents, not advance widths
    left: first.left,
    right: last.right,
    width: last.right - first.left,
    capHeight: font.capHeight * scale,
    glyphs,
    advanceEnd: x,
  };
}

const translate = (d, dx, dy) => `<path transform="translate(${r2(dx)} ${r2(dy)})" d="${d}"/>`;

// ── Garamond / Plex instances ───────────────────────────────────────────
const serif = (wght) => garamond.getVariation({ wght });
const sans = (wght) => plex.getVariation({ wght, wdth: 100 });

const INK = '#1E1A16';
const PAPER = '#E9E2D3';
const WARM_BLACK = '#14110F';
const GOLD = '#B08D57';

const svgOpen = (w, h, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${extra}>`;

// ── Wordmark ────────────────────────────────────────────────────────────
// CASA VELADO in Garamond capitals, tracking 0.16em, hand-corrected pairs.
// EST. 1987 · ESTELÍ beneath it in Plex 500.
const NAME_SIZE = 100;
const NAME_TRACK = 0.16;
const WORD_SPACE = 0.72; // the gap between CASA and VELADO, as a share of the tracked space
// Optical corrections (1/1000 em) on top of the font's own kerning. With open tracking the
// diagonals (A, V) still read looser than the straight stems, so they are drawn in slightly.
const NAME_PAIRS = { CA: -6, AS: -4, SA: -4, AV: -30, VE: -22, EL: 4, LA: -14, AD: -4, DO: 0 };
const SUB_TEXT = 'EST. 1987 · ESTELÍ';
const SUB_SIZE = 25;
const SUB_TRACK = 0.18;

function wordmark() {
  const f = serif(400);
  const name = setLine(f, 'CASA VELADO', {
    size: NAME_SIZE,
    tracking: NAME_TRACK,
    pairs: NAME_PAIRS,
    wordSpace: WORD_SPACE,
  });
  const sub = setLine(sans(500), SUB_TEXT, { size: SUB_SIZE, tracking: SUB_TRACK });
  const gap = 0.55 * NAME_SIZE * 0.65; // between name baseline and sub cap line: about 0.36 of the cap height
  const pad = 4;
  const nameBase = pad + name.capHeight;
  const subBase = nameBase + gap + sub.capHeight;
  const w = Math.ceil(name.width + pad * 2);
  const h = Math.ceil(subBase + pad + 6); // descent allowance for the accent on Í is above, none below
  const body =
    translate(name.d, pad - name.left, nameBase) + translate(sub.d, pad - sub.left, subBase);
  return { w, h, name, sub, body, nameBase, subBase, gap, pad };
}

function wordmarkStacked() {
  // Two lines at the same size and the same tracking, centred on each other. CASA is the
  // shorter line; nothing is stretched to force equal widths.
  const f = serif(400);
  const casa = setLine(f, 'CASA', { size: NAME_SIZE, tracking: NAME_TRACK, pairs: NAME_PAIRS });
  const velado = setLine(f, 'VELADO', { size: NAME_SIZE, tracking: NAME_TRACK, pairs: NAME_PAIRS });
  const sub = setLine(sans(500), SUB_TEXT, { size: SUB_SIZE, tracking: SUB_TRACK });
  const lead = NAME_SIZE * 0.36; // space between the two name lines
  const gap = 0.55 * NAME_SIZE * 0.65;
  const pad = 4;
  const casaBase = pad + casa.capHeight;
  const veladoBase = casaBase + lead + velado.capHeight;
  const subBase = veladoBase + gap + sub.capHeight;
  const w = Math.ceil(velado.width + pad * 2);
  const h = Math.ceil(subBase + pad + 6);
  const centre = (line) => (w - line.width) / 2 - line.left;
  const body =
    translate(casa.d, centre(casa), casaBase) +
    translate(velado.d, centre(velado), veladoBase) +
    translate(sub.d, centre(sub), subBase);
  return { w, h, body, casa, velado, sub, casaBase, veladoBase, subBase, lead, gap, pad };
}

// ── Monogram ────────────────────────────────────────────────────────────
// CV in a horizontal oval with a double thin line, like a seal (blueprint 5.5).
const MONO = { w: 200, h: 124, cx: 100, cy: 62 };

/** The CV letters, centred on (cx, cy) by their ink, at the given cap height. */
function monogramLetters({ cx, cy, cap, wght = 400, tracking = 0.04 }) {
  const f = serif(wght);
  const size = cap / (f.capHeight / f.unitsPerEm);
  const line = setLine(f, 'CV', { size, tracking, pairs: { CV: -10 } });
  const x = cx - (line.left + line.right) / 2;
  const y = cy + line.capHeight / 2;
  return translate(line.d, x, y);
}

function monogram() {
  const { w, h, cx, cy } = MONO;
  const outer = { rx: 96, ry: 58 };
  const inner = { rx: 89, ry: 51 };
  return (
    svgOpen(w, h, ' fill="currentColor"') +
    `<ellipse cx="${cx}" cy="${cy}" rx="${outer.rx}" ry="${outer.ry}" fill="none" stroke="currentColor" stroke-width="2.4"/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${inner.rx}" ry="${inner.ry}" fill="none" stroke="currentColor" stroke-width="0.9"/>` +
    monogramLetters({ cx, cy: cy + 0.5, cap: 46 }) +
    '</svg>'
  );
}

// ── Bands ───────────────────────────────────────────────────────────────
// A band seen flat: a strip of paper, a thin frame, an oval centre with the monogram.
// The three bands change only in line count, line weight and letter spacing.
const BAND_W = 640;
const BAND_H = 200;

function ellipse(cx, cy, rx, ry, sw) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${INK}" stroke-width="${sw}"/>`;
}

function rect(inset, sw) {
  return `<rect x="${inset}" y="${inset}" width="${BAND_W - inset * 2}" height="${BAND_H - inset * 2}" fill="none" stroke="${INK}" stroke-width="${sw}"/>`;
}

function band({ frames, ovals, letters }) {
  const cx = BAND_W / 2;
  const cy = BAND_H / 2;
  return (
    svgOpen(BAND_W, BAND_H, ` fill="${INK}"`) +
    `<rect width="${BAND_W}" height="${BAND_H}" fill="${PAPER}"/>` +
    frames.map(([inset, sw]) => rect(inset, sw)).join('') +
    ovals.map(([rx, ry, sw]) => ellipse(cx, cy, rx, ry, sw)).join('') +
    monogramLetters({ cx, cy: cy + 0.5, ...letters }) +
    '</svg>'
  );
}

const bands = {
  // 1987: one rule round the strip, one line round the oval, open letters.
  'band-1987': band({
    frames: [[12, 2.2]],
    ovals: [[150, 66, 2.2]],
    letters: { cap: 62, wght: 500, tracking: 0.12 },
  }),
  // Middle period: the double line appears on the oval.
  'band-mid': band({
    frames: [[12, 1.8]],
    ovals: [
      [152, 68, 2],
      [143, 59, 0.9],
    ],
    letters: { cap: 62, wght: 450, tracking: 0.08 },
  }),
  // Today: a double rule and a double oval, the same seal as the monogram, finer lines.
  'band-current': band({
    frames: [
      [12, 1.4],
      [19, 0.7],
    ],
    ovals: [
      [154, 70, 1.8],
      [146, 62, 0.7],
    ],
    letters: { cap: 62, wght: 400, tracking: 0.04 },
  }),
};

// ── Favicon ─────────────────────────────────────────────────────────────
// A simplified monogram for small sizes: one stronger oval, heavier letters, on warm black.
function faviconSvg() {
  const s = 64;
  return (
    svgOpen(s, s, ` fill="${GOLD}"`) +
    `<rect width="${s}" height="${s}" fill="${WARM_BLACK}"/>` +
    `<ellipse cx="32" cy="32" rx="30" ry="22" fill="none" stroke="${GOLD}" stroke-width="3"/>` +
    monogramLetters({ cx: 32, cy: 32.4, cap: 19.5, wght: 700, tracking: 0.02 }) +
    '</svg>'
  );
}

/** The 16px entry of favicon.ico: at that size a ring and two letters cannot both be read, so only the letters are kept. */
function faviconTinySvg() {
  const s = 64;
  return (
    svgOpen(s, s, ` fill="${GOLD}"`) +
    `<rect width="${s}" height="${s}" fill="${WARM_BLACK}"/>` +
    monogramLetters({ cx: 32, cy: 32.5, cap: 30, wght: 700, tracking: 0.0 }) +
    '</svg>'
  );
}

/** Apple touch icon: the same artwork with more air round it (iOS rounds the corners itself). */
function touchIconSvg() {
  const s = 180;
  return (
    svgOpen(s, s, ` fill="${GOLD}"`) +
    `<rect width="${s}" height="${s}" fill="${WARM_BLACK}"/>` +
    `<ellipse cx="90" cy="90" rx="66" ry="46" fill="none" stroke="${GOLD}" stroke-width="3.4"/>` +
    `<ellipse cx="90" cy="90" rx="60" ry="40" fill="none" stroke="${GOLD}" stroke-width="1.2"/>` +
    monogramLetters({ cx: 90, cy: 90.5, cap: 40, wght: 600, tracking: 0.04 }) +
    '</svg>'
  );
}

/** ICO container holding PNG images (supported since Windows Vista and by every browser). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const dir = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...dir, ...images.map((i) => i.data)]);
}

// ── Write everything ────────────────────────────────────────────────────
mkdirSync(join(root, 'src/brand'), { recursive: true });
mkdirSync(join(root, 'public'), { recursive: true });

const wm = wordmark();
const wms = wordmarkStacked();
const out = {
  'src/brand/logo-wordmark.svg': svgOpen(wm.w, wm.h, ' fill="currentColor"') + wm.body + '</svg>',
  'src/brand/logo-wordmark-stacked.svg':
    svgOpen(wms.w, wms.h, ' fill="currentColor"') + wms.body + '</svg>',
  'src/brand/monogram.svg': monogram(),
  ...Object.fromEntries(Object.entries(bands).map(([k, v]) => [`src/brand/${k}.svg`, v])),
  'public/favicon.svg': faviconSvg(),
};
// Path data is rewritten with relative commands at 0.1-unit precision: much smaller, and the
// artwork is unchanged to the eye at any size the site uses.
const shrink = (svg) =>
  optimize(svg, {
    multipass: true,
    plugins: [
      { name: 'preset-default', params: { overrides: { convertPathData: { floatPrecision: 1 } } } },
    ],
  }).data;
for (const [file, svg] of Object.entries(out)) writeFileSync(join(root, file), shrink(svg) + '\n');

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .flatten({ background: WARM_BLACK }) // opaque: the tile is the background
    .png()
    .toBuffer();
const fav = faviconSvg();
writeFileSync(
  join(root, 'public/favicon.ico'),
  ico(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({
        size,
        data: await png(size === 16 ? faviconTinySvg() : fav, size),
      })),
    ),
  ),
);
writeFileSync(join(root, 'public/apple-touch-icon.png'), await png(touchIconSvg(), 180));

// ── Measurements for the /styleguide brand review ───────────────────────
// Numbers read from the same typesetting that drew the files, so the review page never
// quotes a figure by hand. These specs mirror the functions above.
const r1 = (n) => Math.round(n * 10) / 10;
const r3 = (n) => Math.round(n * 1000) / 1000;
const sansCap = sans(500).capHeight / sans(500).unitsPerEm;
const serifCap = serif(400).capHeight / serif(400).unitsPerEm;

function lettersInfo({ cx, cy, cap, wght = 400, tracking = 0.04 }) {
  const f = serif(wght);
  const size = cap / (f.capHeight / f.unitsPerEm);
  const line = setLine(f, 'CV', { size, tracking, pairs: { CV: -10 } });
  const x = cx - (line.left + line.right) / 2;
  return {
    cap,
    wght,
    tracking,
    left: r1(x + line.left),
    right: r1(x + line.right),
    width: r1(line.width),
    top: r1(cy + line.capHeight / 2 - line.capHeight),
    base: r1(cy + line.capHeight / 2),
  };
}

function nameMeasure() {
  const f = serif(400);
  const scale = NAME_SIZE / f.unitsPerEm;
  const text = 'CASA VELADO';
  const run = f.layout(text, ['kern']);
  const shift = wm.pad - wm.name.left;
  const glyphs = wm.name.glyphs.map((g) => ({
    ch: g.ch,
    left: r1(g.left + shift),
    right: r1(g.right + shift),
  }));
  const pairs = [];
  let gi = 0;
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] === ' ') continue;
    const a = run.glyphs[i];
    const b = run.glyphs[i + 1];
    if (text[i + 1] === ' ') {
      gi++;
      continue;
    }
    const natural = (a.advanceWidth - a.bbox.maxX + b.bbox.minX) * scale;
    const kern = (run.positions[i].xAdvance - a.advanceWidth) * scale;
    const tracking = NAME_TRACK * NAME_SIZE;
    const manual = ((NAME_PAIRS[text[i] + text[i + 1]] ?? 0) / 1000) * NAME_SIZE;
    const final = glyphs[gi + 1].left - glyphs[gi].right;
    pairs.push({
      pair: text[i] + text[i + 1],
      natural: r1(natural),
      kern: r1(kern),
      tracking: r1(tracking),
      manual: r1(manual),
      final: r1(final),
      check: Math.abs(natural + kern + tracking + manual - final) < 0.15,
    });
    gi++;
  }
  // the gap between the words: A (end of CASA) to V
  const wordGap = glyphs[4].left - glyphs[3].right;
  return { glyphs, pairs, wordGap: r1(wordGap) };
}

const stackedShift = (line) => (wms.w - line.width) / 2 - line.left;
const measurements = {
  fonts: { serifCapRatio: r3(serifCap), sansCapRatio: r3(sansCap) },
  wordmark: {
    viewBox: [wm.w, wm.h],
    nameSize: NAME_SIZE,
    nameTracking: NAME_TRACK,
    wordSpace: WORD_SPACE,
    subSize: SUB_SIZE,
    subTracking: SUB_TRACK,
    pad: wm.pad,
    nameBase: r1(wm.nameBase),
    nameCap: r1(wm.name.capHeight),
    nameInkWidth: r1(wm.name.width),
    subBase: r1(wm.subBase),
    subCap: r1(wm.sub.capHeight),
    subInkWidth: r1(wm.sub.width),
    gapNameToSub: r1(wm.subBase - wm.sub.capHeight - wm.nameBase),
    ...nameMeasure(),
    manualPairs: NAME_PAIRS,
  },
  stacked: {
    viewBox: [wms.w, wms.h],
    casaInk: r1(wms.casa.width),
    veladoInk: r1(wms.velado.width),
    subInk: r1(wms.sub.width),
    casaInset: r1((wms.velado.width - wms.casa.width) / 2),
    lineLead: r1(wms.lead),
    lineLeadRatio: r3(wms.lead / wms.casa.capHeight),
    nameCap: r1(wms.casa.capHeight),
    casaBase: r1(wms.casaBase),
    veladoBase: r1(wms.veladoBase),
    subBase: r1(wms.subBase),
    casaCentre: r1(stackedShift(wms.casa) + wms.casa.left + wms.casa.width / 2),
    veladoCentre: r1(stackedShift(wms.velado) + wms.velado.left + wms.velado.width / 2),
    subCentre: r1(stackedShift(wms.sub) + wms.sub.left + wms.sub.width / 2),
  },
  monogram: {
    viewBox: [MONO.w, MONO.h],
    cx: MONO.cx,
    cy: MONO.cy,
    outer: { rx: 96, ry: 58, stroke: 2.4 },
    inner: { rx: 89, ry: 51, stroke: 0.9 },
    letters: lettersInfo({ cx: MONO.cx, cy: MONO.cy + 0.5, cap: 46 }),
  },
  bands: {
    viewBox: [BAND_W, BAND_H],
    'band-1987': {
      frames: [[12, 2.2]],
      ovals: [[150, 66, 2.2]],
      letters: lettersInfo({
        cx: BAND_W / 2,
        cy: BAND_H / 2 + 0.5,
        cap: 62,
        wght: 500,
        tracking: 0.12,
      }),
    },
    'band-mid': {
      frames: [[12, 1.8]],
      ovals: [
        [152, 68, 2],
        [143, 59, 0.9],
      ],
      letters: lettersInfo({
        cx: BAND_W / 2,
        cy: BAND_H / 2 + 0.5,
        cap: 62,
        wght: 450,
        tracking: 0.08,
      }),
    },
    'band-current': {
      frames: [
        [12, 1.4],
        [19, 0.7],
      ],
      ovals: [
        [154, 70, 1.8],
        [146, 62, 0.7],
      ],
      letters: lettersInfo({
        cx: BAND_W / 2,
        cy: BAND_H / 2 + 0.5,
        cap: 62,
        wght: 400,
        tracking: 0.04,
      }),
    },
  },
  favicon: {
    viewBox: [64, 64],
    oval: { rx: 30, ry: 22, stroke: 3 },
    letters: lettersInfo({ cx: 32, cy: 32.4, cap: 19.5, wght: 700, tracking: 0.02 }),
    tiny: lettersInfo({ cx: 32, cy: 32.5, cap: 30, wght: 700, tracking: 0 }),
  },
  touchIcon: {
    viewBox: [180, 180],
    ovals: [
      [66, 46, 3.4],
      [60, 40, 1.2],
    ],
    letters: lettersInfo({ cx: 90, cy: 90.5, cap: 40, wght: 600, tracking: 0.04 }),
  },
};
writeFileSync(
  join(root, 'src/brand/measurements.json'),
  JSON.stringify(measurements, null, 2) + '\n',
);

console.log(`wordmark ${wm.w}×${wm.h}  stacked ${wms.w}×${wms.h}`);
console.log(`name ink width ${r2(wm.name.width)}, sub ink width ${r2(wm.sub.width)}`);
for (const f of Object.keys(out)) console.log(' ', f);
console.log('  public/favicon.ico, public/apple-touch-icon.png');
