// The only JavaScript the global shell needs: header scroll state, the two modal panels
// (mobile menu and cart), the cart, and the footer letter form. No library, no router.
// Everything else is HTML and CSS. Without this script the content, the navigation and the
// footer links all work; only the cart, the menu button and the form need it (blueprint 9.2).
import { initCart } from './cart';

const root = document.documentElement;
root.classList.add('js');

// ── Header: hide on the way down, return on the way up (blueprint 5.4) ───────
// One passive scroll listener, read once per frame. The header is `position: fixed` and moves
// with a transform, so nothing in the page ever shifts. States are written to <html> as
// data-header: top (up to 80px), solid (past it), hidden (down, past 200px).
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const SOLID_AFTER = 80;
const HIDE_AFTER = 200;
const STEP = 8; // pixels of travel in one direction before the header reacts

let lastY = window.scrollY;
let travelled = 0;
let hidden = false;
let frame = 0;

function paintHeader(): void {
  frame = 0;
  const y = window.scrollY;
  const delta = y - lastY;
  lastY = y;

  // Travel is counted per direction, so a small wobble never flips the header.
  travelled = Math.sign(delta) === Math.sign(travelled) ? travelled + delta : delta;
  if (travelled > STEP) hidden = true;
  if (travelled < -STEP) hidden = false;
  if (y <= HIDE_AFTER || reduceMotion.matches) hidden = false;

  root.dataset['header'] = hidden ? 'hidden' : y > SOLID_AFTER ? 'solid' : 'top';
}

window.addEventListener(
  'scroll',
  () => {
    if (!frame) frame = requestAnimationFrame(paintHeader);
  },
  { passive: true },
);
paintHeader();

// The page behind a modal is already inert. This keeps Tab from stepping out of the panel to
// the browser's own controls: after the last control it goes to the first, and back.
function trapTab(dialog: HTMLDialogElement): void {
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const stops = [
      ...dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((el) => el.getClientRects().length > 0);
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

// ── Modal panels: the native <dialog> does the hard parts ────────────────────
// showModal() makes the rest of the page inert, traps focus, and closes on Escape. We add
// the aria-expanded state on the buttons that open it, close on a click outside the panel,
// and return focus to the button that opened it.
function bindDialog(name: string): HTMLDialogElement | null {
  const dialog = document.querySelector<HTMLDialogElement>(`dialog[data-dialog="${name}"]`);
  if (!dialog) return null;
  const openers = document.querySelectorAll<HTMLElement>(`[data-dialog-open="${name}"]`);
  let opener: HTMLElement | undefined;

  const setExpanded = (open: boolean) =>
    openers.forEach((button) => button.setAttribute('aria-expanded', String(open)));

  openers.forEach((button) =>
    button.addEventListener('click', () => {
      opener = button;
      dialog.showModal();
      setExpanded(true);
    }),
  );
  dialog
    .querySelectorAll('[data-dialog-close]')
    .forEach((button) => button.addEventListener('click', () => dialog.close()));
  // A click on the dimmed page is a click on the dialog element itself.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  trapTab(dialog);
  dialog.addEventListener('close', () => {
    setExpanded(false);
    opener?.focus();
  });
  return dialog;
}

const menu = bindDialog('menu');
bindDialog('cart');

// The menu button only exists below 1024px; if the window grows past that, close the menu.
matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
  if (event.matches && menu?.open) menu.close();
});

// ── Age check and cookie notice (blueprint 2.3, 5.4) ─────────────────────────────
// The answers live in localStorage, behind try/catch because storage may be blocked: the age
// answer for 30 days (as the time it expires), the cookie choice with no limit. The site sets
// no cookies and loads no analytics, so the cookie choice only records what was clicked.
const AGE_KEY = 'cv-age-ok';
const COOKIE_KEY = 'cv-cookies';
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Blocked storage: the question is simply asked again next time.
  }
}

const gate = document.querySelector<HTMLDialogElement>('dialog[data-age-gate]');
if (gate && root.classList.contains('age-pending')) {
  const ask = gate.querySelector<HTMLElement>('[data-age-ask]');
  const refusal = gate.querySelector<HTMLElement>('[data-age-refusal]');
  let answered = false;

  trapTab(gate);
  // Escape does nothing: the visitor has to answer.
  gate.addEventListener('cancel', (event) => event.preventDefault());
  // A browser may let a repeated Escape close the dialog anyway. It opens again.
  gate.addEventListener('close', () => {
    if (!answered) gate.showModal();
  });

  gate.querySelector('[data-age-yes]')?.addEventListener('click', () => {
    answered = true;
    store(AGE_KEY, String(Date.now() + THIRTY_DAYS));
    root.classList.remove('age-pending');
    gate.close();
  });

  // “No”: the refusal replaces the question, and there is nothing behind it to reach. It is
  // not remembered, so reloading asks again.
  gate.querySelector('[data-age-no]')?.addEventListener('click', () => {
    if (ask) ask.hidden = true;
    if (refusal) {
      refusal.hidden = false;
      refusal.focus();
    }
  });

  gate.showModal();
}

document.querySelectorAll<HTMLElement>('[data-cookie]').forEach((button) =>
  button.addEventListener('click', () => {
    store(COOKIE_KEY, button.dataset['cookie'] ?? 'necessary');
    root.classList.remove('cookies-pending');
    // The button that was pressed has just gone; start from the page again.
    document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true });
  }),
);

// ── Photographs fade in over 200ms once loaded (blueprint 6.8) ───────────────────
// The CSS hides an <img data-fade> only when this script is running, so without it images
// simply show. The hero carries no data-fade and shows at once.
document.querySelectorAll<HTMLImageElement>('img[data-fade]').forEach((img) => {
  const show = () => img.classList.add('is-loaded');
  if (img.complete) show();
  else img.addEventListener('load', show, { once: true });
  img.addEventListener('error', show, { once: true });
});

// ── Cart: the count, the drawer's lines, the stored cart and the other tabs ───────
initCart();

// ── Footer letter form: client-side only, no email is sent (blueprint 2.3, 5.4) ──
const form = document.querySelector<HTMLFormElement>('form[data-newsletter]');
if (form) {
  const input = form.querySelector<HTMLInputElement>('input[type="email"]');
  const error = form.querySelector<HTMLElement>('[data-field-error]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status = form.parentElement?.querySelector<HTMLElement>('[data-newsletter-status]');
  const { errEmpty = '', errIncomplete = '', sending = '', confirmation = '' } = form.dataset;

  const showError = (message: string) => {
    if (!input || !error) return;
    error.textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  if (submit) submit.disabled = false; // it is disabled in the HTML until this script runs
  input?.addEventListener('input', () => showError(''));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input?.value.trim() ?? '';
    const problem =
      value === '' ? errEmpty : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : errIncomplete;
    if (problem) {
      showError(problem);
      input?.focus();
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = sending;
    }
    window.setTimeout(() => {
      form.hidden = true;
      if (status) status.textContent = confirmation;
    }, 600);
  });
}
