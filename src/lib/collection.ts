// Filtering, counting, sorting and the URL of the collection page (blueprint 4.4). Pure
// functions on plain values: the build uses them to write the first counts into the HTML, and
// the browser uses the same ones to filter, so the two can never disagree. No Astro, no DOM.
import {
  SMOKING_TIME_BANDS,
  SORT_OPTIONS,
  STRENGTH_FILTERS,
  STRENGTH_WORDS,
  VITOLAS,
  WRAPPER_TYPES,
} from '../data/taxonomy.ts';
import { smokingBandId } from './format.ts';
import type { Line, Product } from './schemas.ts';

// ── Groups ────────────────────────────────────────────────────────────────
/** The five filter groups, in the order of the blueprint's table. The ids are the URL names. */
export const GROUP_IDS = ['line', 'strength', 'time', 'vitola', 'wrapper'] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export interface FilterValue {
  /** What goes in the URL: `jalapa`, `3`, `45-75`, `petit-corona`, `habano-rosado`. */
  id: string;
  label: string;
}
export interface FilterGroup {
  id: GroupId;
  label: string;
  values: FilterValue[];
}

/** `Petit Corona` becomes `petit-corona`; `Corojo 99` becomes `corojo-99`. */
export const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

/**
 * The groups and their values. “Line” lists the blended lines only (the Muestrario has no
 * blend to filter by) and says “Cosecha”, as the blueprint does, not “Cosecha 2020”.
 */
export function filterGroups(lines: readonly Line[]): FilterGroup[] {
  return [
    {
      id: 'line',
      label: 'Line',
      values: lines
        .filter((l) => l.kind !== 'sampler')
        .map((l) => ({
          id: l.id,
          label: l.kind === 'edition' ? l.name.replace(` ${l.editionYear}`, '') : l.name,
        })),
    },
    {
      id: 'strength',
      label: 'Strength',
      values: STRENGTH_FILTERS.map((n) => ({ id: String(n), label: STRENGTH_WORDS[n] })),
    },
    {
      id: 'time',
      label: 'Smoking time',
      values: SMOKING_TIME_BANDS.map((b) => ({ id: b.id, label: b.label })),
    },
    {
      id: 'vitola',
      label: 'Vitola',
      values: VITOLAS.map((v) => ({ id: slugOf(v), label: v })),
    },
    {
      id: 'wrapper',
      label: 'Wrapper',
      values: WRAPPER_TYPES.map((w) => ({ id: slugOf(w), label: w })),
    },
  ];
}

// ── Items ─────────────────────────────────────────────────────────────────
/**
 * What the page needs to know about one card. A facet is null where the product has no value
 * for it: the Muestrario has no strength, time, vitola or wrapper, so any filter leaves it out.
 */
export interface Item {
  /** The line it sits under in the “By line” view. */
  line: string;
  /** The place in the house order: line, then catalogue. */
  order: number;
  /** The lowest price in euro cents. */
  price: number;
  minutes: number | null;
  strength: number | null;
  time: string | null;
  vitola: string | null;
  wrapper: string | null;
}

export function itemOf(product: Product, line: Line, order: number): Item {
  const base = {
    line: line.id,
    order,
    price: Math.min(...product.options.map((o) => o.priceCents)),
  };
  if (product.kind === 'sampler' || line.kind === 'sampler') {
    return { ...base, minutes: null, strength: null, time: null, vitola: null, wrapper: null };
  }
  return {
    ...base,
    minutes: product.smokingMinutes,
    strength: line.strength,
    time: smokingBandId(product.smokingMinutes),
    vitola: slugOf(product.vitola),
    wrapper: slugOf(line.wrapper.wrapperType),
  };
}

/** What an item holds for a group, as the string the URL uses. */
export function facetOf(item: Item, group: GroupId): string | null {
  if (group === 'line') return item.strength === null ? null : item.line;
  if (group === 'strength') return item.strength === null ? null : String(item.strength);
  return item[group];
}

// ── Selection ─────────────────────────────────────────────────────────────
export type Selection = Record<GroupId, string[]>;

export const emptySelection = (): Selection => ({
  line: [],
  strength: [],
  time: [],
  vitola: [],
  wrapper: [],
});

export const selectedCount = (selection: Selection) =>
  GROUP_IDS.reduce((n, g) => n + selection[g].length, 0);

/** OR within a group, AND between groups. A group with nothing selected lets everything in. */
export function matches(item: Item, selection: Selection, skip?: GroupId): boolean {
  return GROUP_IDS.every((group) => {
    if (group === skip) return true;
    const chosen = selection[group];
    if (chosen.length === 0) return true;
    const own = facetOf(item, group);
    return own !== null && chosen.includes(own);
  });
}

/**
 * The number shown beside a value: how many cigars the page would show if this value were
 * chosen, with the other groups as they are. Every group is counted against the others only,
 * so a value that would leave nothing says 0.
 */
export function countFor(
  items: readonly Item[],
  selection: Selection,
  group: GroupId,
  value: string,
): number {
  return items.filter((item) => facetOf(item, group) === value && matches(item, selection, group))
    .length;
}

// ── Sorting ───────────────────────────────────────────────────────────────
export type SortId = (typeof SORT_OPTIONS)[number]['id'];
export const DEFAULT_SORT: SortId = 'recommended';

/**
 * Stable, and always falling back on the house order. A product with no value for the key
 * (the Muestrario has no strength or time) goes last in both directions.
 */
export function compareBy(sort: SortId): (a: Item, b: Item) => number {
  const key = (item: Item): number | null => {
    switch (sort) {
      case 'strength-asc':
      case 'strength-desc':
        return item.strength;
      case 'price-asc':
      case 'price-desc':
        return item.price;
      case 'time-asc':
        return item.minutes;
      default:
        return item.order;
    }
  };
  const sign = sort === 'strength-desc' || sort === 'price-desc' ? -1 : 1;
  return (a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === null && kb === null) return a.order - b.order;
    if (ka === null) return 1;
    if (kb === null) return -1;
    return ka === kb ? a.order - b.order : sign * (ka - kb);
  };
}

// ── View and URL ──────────────────────────────────────────────────────────
export type View = 'line' | 'all';

export interface State {
  selection: Selection;
  sort: SortId;
  view: View;
}

/** The view a page shows when the URL does not say: filters mean “All” (blueprint 4.4). */
export const impliedView = (selection: Selection): View =>
  selectedCount(selection) > 0 ? 'all' : 'line';

/**
 * Reads `?strength=3,4&time=45-75&sort=price-asc&view=line`. Anything that is not a known
 * value is dropped, so a hand-edited or stale link still opens a working page.
 */
export function parseQuery(
  search: string,
  allowed: Record<GroupId, readonly string[]>,
): { state: State; clean: boolean } {
  const params = new URLSearchParams(search);
  const selection = emptySelection();
  for (const group of GROUP_IDS) {
    const wanted = (params.get(group) ?? '').split(',').filter(Boolean);
    selection[group] = allowed[group].filter((v) => wanted.includes(v));
  }
  const sortParam = params.get('sort');
  const sort = SORT_OPTIONS.some((o) => o.id === sortParam) ? (sortParam as SortId) : DEFAULT_SORT;
  const viewParam = params.get('view');
  const view: View =
    viewParam === 'all' || viewParam === 'line' ? viewParam : impliedView(selection);
  const state = { selection, sort, view };
  // “clean” is true when writing the state back would give the same query.
  return { state, clean: stringifyQuery(state) === params.toString().replace(/%2C/gi, ',') };
}

/**
 * The query for a state: only what differs from the defaults, in a fixed order. The view is
 * written only when it is not the one the filters imply.
 */
export function stringifyQuery({ selection, sort, view }: State): string {
  const params = new URLSearchParams();
  for (const group of GROUP_IDS) {
    if (selection[group].length > 0) params.set(group, selection[group].join(','));
  }
  if (sort !== DEFAULT_SORT) params.set('sort', sort);
  if (view !== impliedView(selection)) params.set('view', view);
  // Commas stay readable in the address bar: ?strength=3,4
  return params.toString().replace(/%2C/gi, ',');
}

// ── Items in the HTML ─────────────────────────────────────────────────────
/** The data attributes a card's <li> carries, so the script can read it back without a payload. */
export function itemAttrs(item: Item): Record<string, string> {
  const attrs: Record<string, string> = {
    'data-line': item.line,
    'data-order': String(item.order),
    'data-price': String(item.price),
  };
  if (item.minutes !== null) attrs['data-minutes'] = String(item.minutes);
  if (item.strength !== null) attrs['data-strength'] = String(item.strength);
  if (item.time !== null) attrs['data-time'] = item.time;
  if (item.vitola !== null) attrs['data-vitola'] = item.vitola;
  if (item.wrapper !== null) attrs['data-wrapper'] = item.wrapper;
  return attrs;
}

/** The reverse of itemAttrs, for `element.dataset`. */
export function readItem(data: DOMStringMap): Item {
  const num = (v: string | undefined) => (v === undefined ? null : Number(v));
  return {
    line: data['line'] ?? '',
    order: Number(data['order']),
    price: Number(data['price']),
    minutes: num(data['minutes']),
    strength: num(data['strength']),
    time: data['time'] ?? null,
    vitola: data['vitola'] ?? null,
    wrapper: data['wrapper'] ?? null,
  };
}
