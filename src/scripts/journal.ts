// The journal index's one behaviour (blueprint 2.3): a category shows the entries of that category
// and hides the rest. The page already holds all six entries; nothing is fetched or drawn again.
// The chosen category is written to the address (?category=craft) with history.replaceState, so a
// link to it works and the back button is not filled with filter steps. No router.
import { announce } from '../lib/announce';
import { fill } from '../lib/format';

const root = document.querySelector<HTMLElement>('[data-journal]');
if (root) init(root);

function init(root: HTMLElement): void {
  const list = root.querySelector<HTMLElement>('[data-list]');
  const entries = [...root.querySelectorAll<HTMLElement>('[data-entry]')];
  const tabs = [...root.querySelectorAll<HTMLAnchorElement>('[data-category]')].filter(
    (el) => el.tagName === 'A',
  );
  if (!list || entries.length === 0 || tabs.length === 0) return;
  const copy = JSON.parse(root.dataset['copy'] ?? '{}') as { shown: string; shownOne: string };
  const known = new Set(tabs.map((tab) => tab.dataset['category']));

  function apply(category: string, speak: boolean): void {
    const all = category === 'all';
    let shown = 0;
    entries.forEach((entry) => {
      const match = all || entry.dataset['category'] === category;
      entry.hidden = !match;
      if (match) shown++;
    });
    list!.toggleAttribute('data-filtered', !all);
    tabs.forEach((tab) => {
      if (tab.dataset['category'] === category) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
    if (speak) announce(shown === 1 ? copy.shownOne : fill(copy.shown, { n: shown }));
  }

  const fromUrl = new URLSearchParams(location.search).get('category') ?? 'all';
  apply(known.has(fromUrl) ? fromUrl : 'all', false);

  tabs.forEach((tab) =>
    tab.addEventListener('click', (event) => {
      // A modified click (new tab, new window) is left to the browser.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      const category = tab.dataset['category'] ?? 'all';
      apply(category, true);
      history.replaceState(
        null,
        '',
        category === 'all' ? '/journal' : `/journal?category=${category}`,
      );
    }),
  );
}
