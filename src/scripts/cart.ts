// The cart in every page (blueprint 4.7): the count in the header and the drawer's lines, the
// stepper, “Remove”, the totals and the gift tick, all drawn from the stored cart. Another tab's
// change arrives through the `storage` event (src/lib/cart.ts) and is drawn the same way.
//
// The lines are not drawn again each time: a row is made once, then its numbers are changed in
// place, so the focus on a stepper button is never lost. Changes are spoken once, short, to the
// polite region inside the drawer if it is open (src/lib/announce.ts).
import { announce } from '../lib/announce';
import { cart, optionOf, type CartLine, type CartState, type Catalogue } from '../lib/cart';
import { fill, formatPrice } from '../lib/format';

export interface CartCopy {
  added: string;
  announce: string;
  announceOne: string;
  has: string;
  hasOne: string;
  empty: string;
  decreaseFor: string;
  increaseFor: string;
  quantityFor: string;
  removeFor: string;
  quantityNow: string;
  removed: string;
  atMost: string;
  giftOn: string;
  giftOff: string;
}

interface CartData {
  catalogue: Catalogue;
  copy: CartCopy;
  giftCents: number;
}

export let copy: CartCopy;

const DRAWER_SEEN = 'cv-drawer-seen';

/** “Your cart has 3 items.” / “…1 item.” / “Your cart is empty.” */
export function cartSentence(count: number): string {
  if (count === 0) return copy.empty;
  return count === 1 ? copy.hasOne : fill(copy.has, { n: count });
}

/** “Galera Robusto added. Your cart has 3 items.” */
export function addedSentence(name: string, count: number): string {
  return count === 1 ? fill(copy.announceOne, { name }) : fill(copy.announce, { name, n: count });
}

/** Whether the drawer has been open in this session (blueprint 4.6: it opens once, then the
 *  button alone confirms). sessionStorage may be blocked; then it simply opens every time. */
export function drawerSeen(): boolean {
  try {
    return sessionStorage.getItem(DRAWER_SEEN) === '1';
  } catch {
    return false;
  }
}

export function markDrawerSeen(): void {
  try {
    sessionStorage.setItem(DRAWER_SEEN, '1');
  } catch {
    // Blocked: nothing to remember.
  }
}

const keyOf = (line: Pick<CartLine, 'productId' | 'option'>) => `${line.productId}:${line.option}`;

let started = false;

/** Starts the cart once per page, whichever script asks first (a page script runs before the
 *  shell's, because it sits earlier in the document). */
export function initCart(): void {
  if (started) return;
  const raw = document.getElementById('cart-data')?.textContent;
  if (!raw) return;
  started = true;
  const data = JSON.parse(raw) as CartData;
  copy = data.copy;
  const giftCents = data.giftCents;

  const counts = document.querySelectorAll<HTMLElement>('[data-cart-count]');
  const emptyState = document.querySelector<HTMLElement>('[data-cart-empty]');
  const list = document.querySelector<HTMLElement>('[data-cart-lines]');
  const summary = document.querySelector<HTMLElement>('[data-cart-summary]');
  const subtotal = document.querySelector<HTMLElement>('[data-cart-subtotal]');
  const total = document.querySelector<HTMLElement>('[data-cart-total]');
  const gift = document.querySelector<HTMLInputElement>('[data-cart-gift]');
  const template = document.querySelector<HTMLTemplateElement>('template[data-cart-row]');
  if (!list || !template) return;

  // Opening the drawer by hand counts as having seen it.
  document
    .querySelectorAll('[data-dialog-open="cart"]')
    .forEach((button) => button.addEventListener('click', markDrawerSeen));

  let rowSerial = 0;
  let lastCount = 0;

  function makeRow(line: CartLine): HTMLElement | null {
    const product = data.catalogue[line.productId];
    const fragment = template!.content.cloneNode(true) as DocumentFragment;
    const row = fragment.querySelector<HTMLElement>('[data-row]');
    if (!product || !row) return null;
    row.dataset['key'] = keyOf(line);

    const thumb = row.querySelector<HTMLAnchorElement>('[data-row-thumb]');
    const photo = document.querySelector<HTMLTemplateElement>(
      `template[data-cart-thumb="${CSS.escape(product.id)}"]`,
    );
    if (thumb) {
      thumb.href = product.href;
      if (photo) thumb.append(photo.content.cloneNode(true));
    }
    const name = row.querySelector<HTMLAnchorElement>('[data-row-name]');
    if (name) {
      name.href = product.href;
      name.textContent = product.name;
    }

    // One stepper per line: its number needs its own id.
    const serial = ++rowSerial;
    const input = row.querySelector<HTMLInputElement>('[data-qty]');
    if (input) input.id = `cart-qty-${serial}`;
    row
      .querySelectorAll('[data-step]')
      .forEach((b) => b.setAttribute('aria-controls', `cart-qty-${serial}`));
    return row;
  }

  function paintRow(row: HTMLElement, line: CartLine): void {
    const product = data.catalogue[line.productId];
    const option = optionOf(line.productId, line.option);
    if (!product || !option) return;
    const names = { name: product.name, option: option.label };

    const optionEl = row.querySelector<HTMLElement>('[data-row-option]');
    if (optionEl) optionEl.textContent = option.label;
    const priceEl = row.querySelector<HTMLElement>('[data-row-price]');
    if (priceEl) priceEl.textContent = formatPrice(cart.lineTotal(line));

    const input = row.querySelector<HTMLInputElement>('[data-qty]');
    if (input) {
      input.max = String(option.max);
      input.value = String(line.quantity);
      input.setAttribute('aria-label', fill(copy.quantityFor, names));
    }
    const less = row.querySelector<HTMLElement>('[data-step="-1"]');
    const more = row.querySelector<HTMLElement>('[data-step="1"]');
    less?.setAttribute('aria-label', fill(copy.decreaseFor, names));
    more?.setAttribute('aria-label', fill(copy.increaseFor, names));
    less?.setAttribute('aria-disabled', String(line.quantity <= 1));
    more?.setAttribute('aria-disabled', String(line.quantity >= option.max));
    row.querySelector('[data-remove]')?.setAttribute('aria-label', fill(copy.removeFor, names));
  }

  function paint(state: CartState, source: string): void {
    const count = cart.count();
    counts.forEach((el) => (el.textContent = String(count)));
    if (emptyState) emptyState.hidden = count > 0;
    list!.hidden = count === 0;
    if (summary) summary.hidden = count === 0;

    const rows = new Map(
      [...list!.querySelectorAll<HTMLElement>('[data-row]')].map((r) => [r.dataset['key'], r]),
    );
    const wanted = new Set(state.lines.map(keyOf));
    rows.forEach((row, key) => {
      if (!key || !wanted.has(key)) row.remove();
    });
    state.lines.forEach((line, index) => {
      const key = keyOf(line);
      let row = rows.get(key);
      if (!row || !row.isConnected) {
        const made = makeRow(line);
        if (!made) return;
        row = made;
      }
      paintRow(row, line);
      if (list!.children[index] !== row) list!.insertBefore(row, list!.children[index] ?? null);
    });

    if (subtotal) subtotal.textContent = formatPrice(cart.subtotal());
    if (total) total.textContent = formatPrice(cart.subtotal() + (state.gift ? giftCents : 0));
    if (gift) gift.checked = state.gift;

    // A change made in another tab: say the new count, only if it is a different count.
    if (source === 'storage' && count !== lastCount) announce(cartSentence(count));
    lastCount = count;
  }

  cart.subscribe(paint);
  cart.init(data.catalogue);

  // ── The lines: steppers and Remove, by delegation ──────────────────────────
  const lineOf = (row: HTMLElement | null) => {
    const key = row?.dataset['key'];
    return key ? cart.lines().find((l) => keyOf(l) === key) : undefined;
  };

  /** The same words every time: “Galera Robusto, Box of 20: quantity 3. Your cart has 7 items.” */
  function spokenQuantity(line: CartLine): string {
    const product = data.catalogue[line.productId];
    const option = optionOf(line.productId, line.option);
    return fill(copy.quantityNow, {
      name: product?.name ?? '',
      option: option?.label ?? '',
      n: line.quantity,
      count: cartSentence(cart.count()),
    });
  }

  function setQuantity(row: HTMLElement, wanted: number): void {
    const line = lineOf(row);
    const option = line && optionOf(line.productId, line.option);
    if (!line || !option) return;
    if (!Number.isInteger(wanted) || wanted < 1) wanted = line.quantity;
    if (wanted > option.max) {
      announce(fill(copy.atMost, { n: option.max }));
      wanted = option.max;
    }
    if (wanted === line.quantity) {
      paintRow(row, line); // puts a mistyped number back
      return;
    }
    cart.setQuantity(line.productId, line.option, wanted);
    const next = lineOf(row);
    if (next && wanted <= option.max) announce(spokenQuantity(next));
  }

  function remove(row: HTMLElement): void {
    const line = lineOf(row);
    if (!line) return;
    const product = data.catalogue[line.productId];
    const option = optionOf(line.productId, line.option);
    // Focus goes to the next Remove, or the one before it, or the way out of an empty cart.
    const siblings = [...list!.querySelectorAll<HTMLElement>('[data-row]')];
    const at = siblings.indexOf(row);
    const heir = siblings[at + 1] ?? siblings[at - 1];
    cart.remove(line.productId, line.option);
    announce(
      fill(copy.removed, {
        name: product?.name ?? '',
        option: option?.label ?? '',
        count: cartSentence(cart.count()),
      }),
    );
    const target = heir?.isConnected
      ? heir.querySelector<HTMLElement>('[data-remove]')
      : emptyState?.querySelector<HTMLElement>('a');
    target?.focus();
  }

  list.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-step], [data-remove]');
    const row = target?.closest<HTMLElement>('[data-row]') ?? null;
    if (!target || !row) return;
    if (target.hasAttribute('data-remove')) {
      remove(row);
      return;
    }
    const line = lineOf(row);
    if (!line) return;
    const step = Number(target.dataset['step']);
    const option = optionOf(line.productId, line.option);
    if (step > 0 && option && line.quantity >= option.max) {
      announce(fill(copy.atMost, { n: option.max }));
      return;
    }
    if (step < 0 && line.quantity <= 1) return;
    setQuantity(row, line.quantity + step);
  });

  // A typed number: whole, and inside the limit, when the field is left or Enter is pressed.
  list.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    if (!input.matches('[data-qty]')) return;
    const row = input.closest<HTMLElement>('[data-row]');
    if (row) setQuantity(row, Number(input.value));
  });
  list.addEventListener('keydown', (event) => {
    const input = event.target as HTMLInputElement;
    if (input.matches?.('[data-qty]') && ['.', ',', 'e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  });

  gift?.addEventListener('change', () => {
    cart.setGift(gift.checked);
    announce(gift.checked ? copy.giftOn : copy.giftOff);
  });
}
