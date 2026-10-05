// WCAG 2.x contrast. Used by /styleguide so the ratios shown are computed from
// tokens.css at build time, never typed by hand.

/** First hex value declared for each custom property in a stylesheet. */
export function readHexTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    const [, name, hex] = match;
    if (name && hex && !(name in tokens)) tokens[name] = hex.toLowerCase();
  }
  return tokens;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrast(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(1)} : 1`;
}

export type Grade = 'AAA' | 'AA' | 'UI only' | 'Fails';

/** AAA text ≥ 7, AA text ≥ 4.5, UI components and large text ≥ 3 (WCAG 1.4.3, 1.4.6, 1.4.11). */
export function grade(ratio: number): Grade {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'UI only';
  return 'Fails';
}

/** Values of every custom property whose name starts with `prefix`, first declaration wins. */
export function readTokenValues(css: string, prefix: string): Record<string, string> {
  const values: Record<string, string> = {};
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const pattern = new RegExp(String.raw`--(${prefix}[a-z0-9-]*):\s*([^;]+);`, 'g');
  for (const match of stripped.matchAll(pattern)) {
    const [, name, value] = match;
    if (name && value && !(name in values)) values[name] = value.trim();
  }
  return values;
}
