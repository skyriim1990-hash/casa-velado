// The product page's behaviour (blueprint 4.6, 8): the gallery, the price in the button, the
// stepper's limit, the add to the cart, the bar for phones and “Notify me”. It works on what
// is already in the page; nothing is fetched or drawn again. Without it the page is the cigar,
// its formats and prices, and the words that say the cart needs JavaScript.
// No library, no scroll listeners: IntersectionObserver does the watching.
import { announce } from '../lib/announce';
import { cart, optionOf, type OptionType } from '../lib/cart';
import { fill, formatPrice } from '../lib/format';
import { addedSentence, copy, drawerSeen, initCart, markDrawerSeen } from './cart';

initCart();

const root = document.querySelector<HTMLElement>('[data-product]');
if (root) init(root);
initGallery();

function init(root: HTMLElement): void {
  const productId = root.dataset['productId'] ?? '';
  const product = cart.catalogue()[productId];
  const form = root.querySelector<HTMLFormElement>('[data-purchase]');
  if (!product || !form) return;

  if (root.hasAttribute('data-sold-out')) {
    initNotify(root);
    return;
  }

  const input = form.querySelector<HTMLInputElement>('[data-qty]');
  const add = form.querySelector<HTMLButtonElement>('[data-add]');
  const label = form.querySelector<HTMLElement>('[data-add-label]');
  const hint = form.querySelector<HTMLElement>('[data-limit]');
  const bar = document.querySelector<HTMLElement>('[data-buybar]');
  const barPrice = bar?.querySelector<HTMLElement>('[data-bar-price]');
  const barAdd = bar?.querySelector<HTMLButtonElement>('[data-bar-add]');
  const barLabel = bar?.querySelector<HTMLElement>('[data-bar-label]');
  const less = form.querySelector<HTMLElement>('[data-step="-1"]');
  const more = form.querySelector<HTMLElement>('[data-step="1"]');
  if (!input || !add || !label) return;

  const chosen = (): OptionType =>
    (form.querySelector<HTMLInputElement>('input[name="option"]:checked')?.value ??
      'single') as OptionType;
  const optionNow = () => optionOf(productId, chosen());

  /** A whole number inside 1 and the limit; anything else becomes the nearest that is. */
  function clamp(value: number): number {
    const max = optionNow()?.max ?? 1;
    if (!Number.isFinite(value) || value < 1) return 1;
    return Math.min(Math.floor(value), max);
  }
  const quantity = () => clamp(Number(input!.value));

  // The label of the button, “Add to cart · €11.00” (the format is the microcopy's, in the HTML).
  const template = label.textContent?.replace(/€[\d.,]+/, '{price}') ?? '{price}';
  let pending = 0;

  function render(): void {
    const option = optionNow();
    if (!option) return;
    const q = quantity();
    input!.max = String(option.max);
    if (String(q) !== input!.value) input!.value = String(q);
    const price = formatPrice(option.priceCents * q);
    if (!pending) label!.textContent = fill(template, { price });
    if (barPrice) barPrice.textContent = price;
    if (hint) hint.textContent = hint.textContent?.replace(/\d+/, String(option.max)) ?? '';
    less?.setAttribute('aria-disabled', String(q <= 1));
    more?.setAttribute('aria-disabled', String(q >= option.max));
  }

  // Choosing a format puts the number inside that format's limit (a box is at most 5).
  form.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (target.matches('input[name="option"]') || target === input) render();
  });
  input.addEventListener('input', () => {
    // Typing may pass through values that are not complete yet; fix them when the field is left.
    if (input.value !== '' && Number(input.value) >= 1) render();
  });
  input.addEventListener('blur', render);
  input.addEventListener('keydown', (event) => {
    if (['.', ',', 'e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
  });

  form.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-step]');
    if (!button) return;
    const option = optionNow();
    const next = quantity() + Number(button.dataset['step']);
    if (option && next > option.max) {
      announce(fill(copy.atMost, { n: option.max }));
      return;
    }
    if (next < 1) return;
    input.value = String(next);
    render();
  });

  // ── Add to cart ──────────────────────────────────────────────────────────
  function addToCart(): void {
    const option = optionNow();
    if (!option) return;
    const result = cart.add(productId, option.type, quantity());
    if (!result) return;

    // The words in the button change for 1.6 seconds; the message is spoken once.
    window.clearTimeout(pending);
    const done = copy.added;
    label!.textContent = done;
    if (barLabel) barLabel.textContent = done;
    pending = window.setTimeout(() => {
      pending = 0;
      render();
      if (barLabel) barLabel.textContent = barLabelText;
    }, 1600);

    // The drawer opens the first time in a session; after that the button alone confirms. It
    // opens first, so the message is spoken from inside it (the page behind is inert).
    if (!drawerSeen()) {
      markDrawerSeen();
      document.querySelector<HTMLElement>('[data-dialog-open="cart"]')?.click();
    }

    announce(
      result.capped
        ? fill(copy.atMost, { n: option.max })
        : addedSentence(product!.name, cart.count()),
    );
  }
  const barLabelText = barLabel?.textContent ?? '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    addToCart();
  });
  barAdd?.addEventListener('click', addToCart);

  render();

  // ── The bar for phones: it follows the main button ───────────────────────
  // Shown when the button has gone out of the top of the screen; hidden when it is back, and when
  // the footer comes into view. (It is not shown at all from 640px: the CSS sees to that.)
  if (bar && 'IntersectionObserver' in window) {
    let past = false;
    let atFooter = false;
    const show = () => bar.toggleAttribute('data-visible', past && !atFooter);

    // The root reaches one screen below the viewport, so a button that is just under the fold
    // still counts as "in view" and a fast scroll past it is not missed: the observer only
    // reports when that state changes, and a jump from there to above the top changes it.
    new IntersectionObserver(
      ([entry]) => {
        past = !!entry && !entry.isIntersecting && entry.boundingClientRect.top < 0;
        show();
      },
      { rootMargin: '0px 0px 100% 0px' },
    ).observe(add);

    const footer = document.querySelector('#site-footer');
    if (footer) {
      new IntersectionObserver(([entry]) => {
        atFooter = !!entry?.isIntersecting;
        show();
      }).observe(footer);
    }
  }
}

// ── “Notify me when it returns” (a sold-out product) ─────────────────────────
function initNotify(root: HTMLElement): void {
  const notify = root.querySelector<HTMLElement>('[data-notify]');
  const open = notify?.querySelector<HTMLButtonElement>('[data-notify-open]');
  const panel = notify?.querySelector<HTMLElement>('[data-notify-panel]');
  const email = notify?.querySelector<HTMLInputElement>('[data-notify-email]');
  const error = notify?.querySelector<HTMLElement>('[data-field-error]');
  const status = notify?.querySelector<HTMLElement>('[data-notify-status]');
  const form = root.querySelector<HTMLFormElement>('[data-purchase]');
  if (!notify || !open || !panel || !email || !form || !status) return;

  open.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    open.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) email.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (panel.hidden) return;
    const value = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      email.setAttribute('aria-invalid', 'true');
      if (error)
        error.textContent = value
          ? (notify.dataset['errIncomplete'] ?? '')
          : (notify.dataset['errEmpty'] ?? '');
      email.focus();
      return;
    }
    // A demonstration: nothing is sent.
    panel.hidden = true;
    open.hidden = true;
    status.textContent = notify.dataset['confirmation'] ?? '';
  });
  email.addEventListener('input', () => {
    email.removeAttribute('aria-invalid');
    if (error) error.textContent = '';
  });
}

// ── The gallery ──────────────────────────────────────────────────────────────
// From 1024px the thumbnails change the large picture (the CSS fades it over 200ms). Below,
// the strip scrolls and snaps by itself, and the counter follows it.
function initGallery(): void {
  const gallery = document.querySelector<HTMLElement>('[data-gallery]');
  if (!gallery) return;
  const track = gallery.querySelector<HTMLElement>('[data-track]');
  const slides = [...gallery.querySelectorAll<HTMLElement>('[data-slide]')];
  const thumbs = [...gallery.querySelectorAll<HTMLElement>('[data-thumb]')];
  const counter = gallery.querySelector<HTMLElement>('[data-counter]');
  if (!track || slides.length === 0) return;
  const total = slides.length;

  // From 1024px the strip is a stack of pictures, not a scrolling strip: it is not a tab stop.
  const desktop = matchMedia('(min-width: 1024px)');
  const setStop = () => {
    if (desktop.matches) track.removeAttribute('tabindex');
    else track.setAttribute('tabindex', '0');
  };
  setStop();
  desktop.addEventListener('change', setStop);

  function show(index: number): void {
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    thumbs.forEach((thumb, i) => {
      if (i === index) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
    });
    if (counter) counter.textContent = `${index + 1} / ${total}`;
  }

  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => show(i)));

  // The counter follows the picture that fills the strip. The observer looks at the strip, so
  // there is no scroll handler.
  if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = slides.indexOf(entry.target as HTMLElement);
          if (index >= 0 && counter) counter.textContent = `${index + 1} / ${total}`;
        });
      },
      { root: track, threshold: 0.6 },
    );
    slides.forEach((slide) => seen.observe(slide));
  }
}
