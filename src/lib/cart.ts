// The cart (blueprint 4.7). Frontend only, no backend: the lines live in localStorage under one
// versioned key, behind try/catch because storage may be blocked, and other tabs are told of a
// change by the browser's own `storage` event. No library, no polling.
//
// A line is `{ productId, option, quantity }` and nothing else. The name, the label and the
// price are never stored: they are looked up in the catalogue (built from the approved data at
// build time and put in the page), so nothing a visitor can edit in storage or in markup
// sets a price. A stored line that the catalogue does not know, or that is sold out, is dropped
// when it is read, and a quantity over the limit is cut to it.
import { QUANTITY_LIMITS, type OptionType } from '../data/taxonomy.ts';

export type { OptionType };

export interface CartLine {
  /** A product id from the catalogue. */
  productId: string;
  option: OptionType;
  quantity: number;
}

/** One option of a product as the cart needs it: the label, the price in cents and the limit. */
export interface CatalogueOption {
  type: OptionType;
  label: string;
  priceCents: number;
  max: number;
}

export interface CatalogueProduct {
  id: string;
  /** “Galera Robusto”, “Muestrario”. */
  name: string;
  href: string;
  soldOut: boolean;
  options: CatalogueOption[];
}

export type Catalogue = Record<string, CatalogueProduct>;

export interface CartState {
  lines: readonly CartLine[];
  /** The gift-wrapping tick. It has no price until the owner gives [PRICE]. */
  gift: boolean;
}

/** Where a change came from: this page, another tab, or the first read of storage. */
export type Source = 'local' | 'storage' | 'init';
type Listener = (state: CartState, source: Source) => void;

export const CART_KEY = 'cv-cart';
const VERSION = 1;

/** Blueprint 4.6: 1–10; a box 1–5, or fewer where the product caps the boxes per order. */
export function optionLimit(
  type: OptionType,
  product: { maxPerOrder?: number | undefined },
): number {
  const base = QUANTITY_LIMITS[type];
  return type === 'box' && product.maxPerOrder !== undefined
    ? Math.min(base, product.maxPerOrder)
    : base;
}

const EMPTY: CartState = { lines: [], gift: false };

let catalogue: Catalogue = {};
let state: CartState = EMPTY;
const listeners = new Set<Listener>();

const same = (a: CartLine, productId: string, option: OptionType) =>
  a.productId === productId && a.option === option;

/** The option record of a line, or undefined when the catalogue does not have it. */
export function optionOf(productId: string, option: OptionType): CatalogueOption | undefined {
  return catalogue[productId]?.options.find((o) => o.type === option);
}

// ── Storage ─────────────────────────────────────────────────────────────────
/** A stored cart, made safe: only what the catalogue knows, in range, one line per option. */
function sanitise(raw: unknown): CartState {
  if (typeof raw !== 'object' || raw === null) return EMPTY;
  const data = raw as { v?: unknown; lines?: unknown; gift?: unknown };
  if (data.v !== VERSION || !Array.isArray(data.lines)) return EMPTY;
  const lines: CartLine[] = [];
  for (const entry of data.lines as unknown[]) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { productId, option, quantity } = entry as Record<string, unknown>;
    if (typeof productId !== 'string' || typeof option !== 'string') continue;
    const product = catalogue[productId];
    const opt = product?.options.find((o) => o.type === option);
    if (!product || !opt || product.soldOut) continue;
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) continue;
    if (lines.some((l) => same(l, productId, opt.type))) continue;
    lines.push({ productId, option: opt.type, quantity: Math.min(quantity, opt.max) });
  }
  return { lines, gift: data.gift === true };
}

function read(): CartState {
  try {
    const text = localStorage.getItem(CART_KEY);
    return text ? sanitise(JSON.parse(text)) : EMPTY;
  } catch {
    // Blocked storage or damaged text: an empty cart.
    return EMPTY;
  }
}

function write(next: CartState): void {
  try {
    if (next.lines.length === 0 && !next.gift) localStorage.removeItem(CART_KEY);
    else localStorage.setItem(CART_KEY, JSON.stringify({ v: VERSION, ...next }));
  } catch {
    // Blocked or full: the cart still works in this page, it is just not kept.
  }
}

function notify(source: Source): void {
  listeners.forEach((listen) => listen(state, source));
}

/** Read what storage holds now (another tab may have changed it), change it, write it back. */
function change(update: (current: CartState) => CartState): void {
  const current = storageWorks ? read() : state;
  state = update(current);
  write(state);
  notify('local');
}

let storageWorks = true;

// ── The store ───────────────────────────────────────────────────────────────
export const cart = {
  /** Gives the store the catalogue, reads the stored cart and starts listening to other tabs. */
  init(known: Catalogue): void {
    catalogue = known;
    try {
      localStorage.getItem(CART_KEY);
    } catch {
      storageWorks = false;
    }
    state = storageWorks ? read() : EMPTY;
    window.addEventListener('storage', (event) => {
      // `key` is null when the whole storage was cleared.
      if (event.key !== null && event.key !== CART_KEY) return;
      state = read();
      notify('storage');
    });
    notify('init');
  },

  catalogue: () => catalogue,
  state: () => state,
  lines: () => state.lines,

  /** The number in “Cart (3)”: every line counted by its quantity. */
  count: () => state.lines.reduce((total, line) => total + line.quantity, 0),

  lineTotal(line: CartLine): number {
    return (optionOf(line.productId, line.option)?.priceCents ?? 0) * line.quantity;
  },

  subtotal(): number {
    return state.lines.reduce((sum, line) => sum + cart.lineTotal(line), 0);
  },

  /**
   * Adds `quantity` of a product's option. The same product and option is one line, so a
   * second add raises it, never past the limit. Returns the resulting quantity and whether the
   * limit cut it, or null when the product, option or quantity is not one the catalogue allows.
   */
  add(
    productId: string,
    option: OptionType,
    quantity: number,
  ): { quantity: number; capped: boolean } | null {
    const product = catalogue[productId];
    const opt = optionOf(productId, option);
    if (!product || !opt || product.soldOut) return null;
    if (!Number.isInteger(quantity) || quantity < 1) return null;
    let result = { quantity: 0, capped: false };
    change((current) => {
      const existing = current.lines.find((l) => same(l, productId, option));
      const wanted = (existing?.quantity ?? 0) + quantity;
      const next = Math.min(wanted, opt.max);
      result = { quantity: next, capped: wanted > opt.max };
      const lines = existing
        ? current.lines.map((l) => (l === existing ? { ...l, quantity: next } : l))
        : [...current.lines, { productId, option, quantity: next }];
      return { ...current, lines };
    });
    return result;
  },

  /** Sets a line's quantity, kept inside 1 and the option's limit. */
  setQuantity(productId: string, option: OptionType, quantity: number): void {
    const opt = optionOf(productId, option);
    if (!opt || !Number.isInteger(quantity)) return;
    const next = Math.min(Math.max(quantity, 1), opt.max);
    change((current) => ({
      ...current,
      lines: current.lines.map((l) => (same(l, productId, option) ? { ...l, quantity: next } : l)),
    }));
  },

  remove(productId: string, option: OptionType): void {
    change((current) => ({
      ...current,
      lines: current.lines.filter((l) => !same(l, productId, option)),
    }));
  },

  setGift(gift: boolean): void {
    change((current) => ({ ...current, gift }));
  },

  subscribe(listen: Listener): () => void {
    listeners.add(listen);
    return () => listeners.delete(listen);
  },
};
