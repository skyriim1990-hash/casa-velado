// The checkout's behaviour (blueprint 2.3, 9.2): it reads the cart, draws the order summary as
// book lines and shows either the form or “Your cart is empty.”; it swaps the address fields for
// the Tasting Room's details when the order is to be collected. It checks nothing and sends
// nothing: src/scripts/forms.ts checks the fields and shows the demonstration confirmation.
//
// A price is never decided here. Every line is read from the cart store, which reads the
// catalogue built from the approved data (src/lib/cart.ts). The shipping and the gift wrapping
// have no price until the owner gives one, so they show [PRICE] and the total is the subtotal; a
// note says so while that is true.
import { cart, optionOf } from '../lib/cart';
import { fill, formatPrice } from '../lib/format';
import { initCart } from './cart';

// The page script runs before the shell's: the cart store has to be started here (it is once only).
initCart();

const root = document.querySelector<HTMLElement>('[data-checkout]');
if (root) init(root);

function init(root: HTMLElement): void {
  const { lineText = '', noneText = '' } = root.dataset;
  const shippingCents = Number(root.dataset['shippingCents'] ?? 0);
  const giftCents = Number(root.dataset['giftCents'] ?? 0);
  const bodies = root.querySelectorAll<HTMLElement>('[data-checkout-body]');
  const empty = root.querySelector<HTMLElement>('[data-checkout-empty]');
  const list = root.querySelector<HTMLElement>('[data-summary-lines]');
  const template = root.querySelector<HTMLTemplateElement>('template[data-summary-row]');
  const address = root.querySelector<HTMLElement>('[data-delivery-address]');
  const collection = root.querySelector<HTMLElement>('[data-delivery-collection]');
  const sum = (key: string) => root.querySelector<HTMLElement>(`[data-sum="${key}"]`);
  const giftRow = sum('gift')?.closest<HTMLElement>('.row');
  if (!list || !template) return;

  const method = () =>
    root.querySelector<HTMLInputElement>('input[name="delivery"]:checked')?.value ?? 'address';

  function render(): void {
    const state = cart.state();
    const filled = cart.count() > 0;
    bodies.forEach((el) => (el.hidden = !filled));
    if (empty) empty.hidden = filled;

    // The lines of the order: the name and the format, then the price of the line.
    const catalogue = cart.catalogue();
    const rows: Node[] = [];
    for (const line of state.lines) {
      const product = catalogue[line.productId];
      const option = optionOf(line.productId, line.option);
      if (!product || !option) continue;
      const row = template!.content.cloneNode(true) as DocumentFragment;
      const text = (selector: string, value: string) => {
        const el = row.querySelector<HTMLElement>(selector);
        if (el) el.textContent = value;
      };
      text('[data-row-name]', product.name);
      text('[data-row-detail]', fill(lineText, { option: option.label, n: line.quantity }));
      text('[data-row-price]', formatPrice(cart.lineTotal(line)));
      rows.push(row);
    }
    list!.replaceChildren(...rows);

    // The totals. Collection ships nothing; a delivery and a gift wrapping add their fee.
    const collecting = method() === 'collection';
    const subtotal = formatPrice(cart.subtotal());
    const set = (key: string, value: string) => {
      const el = sum(key);
      if (el) el.textContent = value;
    };
    set('subtotal', subtotal);
    set('shipping', collecting ? noneText : formatPrice(shippingCents));
    set('gift', formatPrice(giftCents));
    set(
      'total',
      formatPrice(
        cart.subtotal() + (collecting ? 0 : shippingCents) + (state.gift ? giftCents : 0),
      ),
    );
    if (giftRow) giftRow.hidden = !state.gift;

    if (address) address.hidden = collecting;
    if (collection) collection.hidden = !collecting;
  }

  root.addEventListener('change', (event) => {
    if ((event.target as HTMLInputElement).name === 'delivery') render();
  });

  cart.subscribe(render);
  render();
}
