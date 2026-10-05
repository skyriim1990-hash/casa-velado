// The collection page's behaviour (blueprint 4.4, 7.3, 8): the view switch, the filters, the
// sort and the URL. It works on the cards already in the page: nothing is fetched, nothing is
// drawn again, the cards are only shown, hidden and moved. Without this script the page lists
// every cigar by line. No library, no router.
//
// The filter groups are one element. From 1024px they sit in the toolbar, each button opening
// a panel under it; below 1024px they are moved into the native <dialog>, a drawer from 640px
// (changes apply at once) and a full screen below it (changes wait for “Show n cigars”).
import { announce } from '../lib/announce';
import { fill } from '../lib/format';
import {
  GROUP_IDS,
  compareBy,
  countFor,
  emptySelection,
  matches,
  parseQuery,
  readItem,
  selectedCount,
  stringifyQuery,
  type GroupId,
  type Item,
  type Selection,
  type SortId,
  type State,
  type View,
} from '../lib/collection';

const root = document.querySelector<HTMLElement>('[data-collection]');
if (root) init(root);

function init(root: HTMLElement): void {
  const q = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector);
  const qa = <T extends HTMLElement>(selector: string) => [...root.querySelectorAll<T>(selector)];

  const lists = q('[data-lists]');
  const byLine = q('[data-by-line]');
  const allWrap = q('[data-all]');
  const allGrid = q('[data-all] [data-grid]');
  const emptyState = q('[data-empty]');
  const groupsEl = q('[data-groups]');
  const toolbar = q('[data-toolbar]');
  const toolbarSlot = q('[data-groups-slot="toolbar"]');
  const dialog = q<HTMLDialogElement>('[data-filter-dialog]');
  const dialogSlot = q('[data-groups-slot="dialog"]');
  const opener = q<HTMLButtonElement>('[data-filters-open]');
  const openerLabel = q('[data-filters-open-label]');
  const sortSelect = q<HTMLSelectElement>('[data-sort]');
  const applyButton = q<HTMLButtonElement>('[data-filter-apply]');
  const chipsRow = q('[data-chips]');
  const chipList = q('[data-chip-list]');
  const count = q('[data-results-count]');
  if (
    !lists ||
    !byLine ||
    !allWrap ||
    !allGrid ||
    !emptyState ||
    !groupsEl ||
    !toolbar ||
    !toolbarSlot ||
    !dialog ||
    !dialogSlot ||
    !opener ||
    !openerLabel ||
    !sortSelect ||
    !applyButton ||
    !chipsRow ||
    !chipList ||
    !count
  ) {
    return;
  }

  // The few strings the script writes come from data/site.ts, through the page.
  const copy = JSON.parse(root.dataset['copy'] ?? '{}') as Record<string, string>;
  const t = (key: string, values: Record<string, string | number> = {}) =>
    fill(copy[key] ?? '', values);

  // ── What is on the page ──────────────────────────────────────────────────
  interface Entry {
    el: HTMLElement;
    item: Item;
  }
  const entries: Entry[] = qa('[data-item]').map((el) => ({ el, item: readItem(el.dataset) }));
  const items = entries.map((e) => e.item);
  const total = items.length;
  const sections = qa('[data-line-section]').map((el) => ({
    id: el.dataset['lineSection'] ?? '',
    el,
    grid: el.querySelector<HTMLElement>('[data-grid]'),
  }));

  const inputs = qa<HTMLInputElement>('input[data-filter]');
  const triggers = qa<HTMLButtonElement>('[data-group-trigger]');
  const allowed = Object.fromEntries(GROUP_IDS.map((g) => [g, [] as string[]])) as Record<
    GroupId,
    string[]
  >;
  const labels = new Map<string, string>();
  const groupLabels = new Map<string, string>();
  for (const input of inputs) {
    const group = input.dataset['groupId'] as GroupId;
    allowed[group].push(input.value);
    const text = input.closest('label')?.querySelector('.text')?.textContent;
    labels.set(`${group}:${input.value}`, text ?? input.value);
  }
  for (const trigger of triggers) {
    const label = trigger.querySelector('.trigger-label')?.textContent ?? '';
    groupLabels.set(trigger.dataset['groupTrigger'] ?? '', label);
  }

  // ── State ────────────────────────────────────────────────────────────────
  const parsed = parseQuery(location.search, allowed);
  let applied: State = parsed.state;
  // Whether the view is “All” only because a filter was chosen: clearing the filters then goes
  // back to “By line”. A press on a view button makes the choice the reader's own.
  let autoView =
    !new URLSearchParams(location.search).has('view') && selectedCount(applied.selection) > 0;
  let staged: Selection | null = null;

  const mqDrawer = matchMedia('(max-width: 1023.98px)');
  const mqStaged = matchMedia('(max-width: 639.98px)');

  const clone = (s: Selection): Selection => ({
    line: [...s.line],
    strength: [...s.strength],
    time: [...s.time],
    vitola: [...s.vitola],
    wrapper: [...s.wrapper],
  });

  const readInputs = (): Selection => {
    const selection = emptySelection();
    for (const input of inputs) {
      if (input.checked) selection[input.dataset['groupId'] as GroupId].push(input.value);
    }
    return selection;
  };

  const resultCount = (selection: Selection) =>
    items.filter((item) => matches(item, selection)).length;

  // ── Painting ─────────────────────────────────────────────────────────────
  // The cards fade over 150ms (100ms under reduced motion; the CSS decides) when the list
  // changes. Nothing is reordered with movement.
  function fade(): void {
    lists!.classList.remove('is-fading');
    void lists!.offsetWidth;
    lists!.classList.add('is-fading');
  }
  lists.addEventListener('animationend', () => lists.classList.remove('is-fading'));

  function paintLists(): void {
    const { selection, sort, view } = applied;
    const compare = compareBy(sort);
    let shown = 0;
    for (const entry of entries) {
      const ok = matches(entry.item, selection);
      entry.el.hidden = !ok;
      if (ok) shown += 1;
    }
    emptyState!.hidden = shown > 0;
    byLine!.hidden = shown === 0 || view !== 'line';
    allWrap!.hidden = shown === 0 || view !== 'all';

    if (view === 'all') {
      for (const entry of [...entries].sort((a, b) => compare(a.item, b.item))) {
        allGrid!.append(entry.el);
      }
    } else {
      for (const section of sections) {
        const own = entries
          .filter((e) => e.item.line === section.id)
          .sort((a, b) => compare(a.item, b.item));
        for (const entry of own) section.grid?.append(entry.el);
        section.el.hidden = own.every((e) => e.el.hidden);
      }
    }
  }

  /** Counts, dimmed values, ticks and the number on each group, for a selection. */
  function paintControls(selection: Selection): void {
    for (const input of inputs) {
      const group = input.dataset['groupId'] as GroupId;
      const n = countFor(items, selection, group, input.value);
      input.checked = selection[group].includes(input.value);
      // A value that would give nothing cannot be chosen; one already chosen can be removed.
      input.disabled = n === 0 && !input.checked;
      const label = input.closest('label');
      const number = label?.querySelector('[data-count]');
      const unit = label?.querySelector('.unit');
      if (number) number.textContent = String(n);
      if (unit) unit.textContent = ` ${n === 1 ? copy['cigarWord'] : copy['cigarsWord']}`;
    }
    for (const trigger of triggers) {
      const chosen = selection[trigger.dataset['groupTrigger'] as GroupId].length;
      const badge = trigger.querySelector('[data-selected]');
      if (badge) badge.textContent = chosen > 0 ? String(chosen) : '';
    }
  }

  function paintApply(selection: Selection): void {
    const n = resultCount(selection);
    applyButton!.textContent = n === 1 ? t('showOne') : t('show', { n });
  }

  function paintChips(): void {
    chipList!.textContent = '';
    for (const group of GROUP_IDS) {
      for (const value of applied.selection[group]) {
        const name = groupLabels.get(group) ?? group;
        const label = labels.get(`${group}:${value}`) ?? value;
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chip';
        button.dataset['chipGroup'] = group;
        button.dataset['chipValue'] = value;
        button.setAttribute('aria-label', t('remove', { group: name, value: label }));
        const inner = document.createElement('span');
        inner.className = 'chip-inner';
        inner.append(`${t('chip', { group: name, value: label })} `);
        const cross = document.createElement('span');
        cross.setAttribute('aria-hidden', 'true');
        cross.textContent = '×';
        inner.append(cross);
        button.append(inner);
        li.append(button);
        chipList!.append(li);
      }
    }
    chipsRow!.hidden = selectedCount(applied.selection) === 0;
  }

  function paintToolbar(): void {
    const n = selectedCount(applied.selection);
    openerLabel!.textContent = n > 0 ? t('withCount', { n }) : t('title');
    for (const button of qa<HTMLButtonElement>('[data-view]')) {
      button.setAttribute('aria-pressed', String(button.dataset['view'] === applied.view));
    }
    sortSelect!.value = applied.sort;
    count!.textContent =
      n > 0 ? t('itemsOf', { n: resultCount(applied.selection), total }) : t('items', { n: total });
  }

  function writeUrl(): void {
    const query = stringifyQuery(applied);
    history.replaceState(
      null,
      '',
      `${location.pathname}${query ? `?${query}` : ''}${location.hash}`,
    );
  }

  // One spoken message after a run of changes, not one per tick.
  let speak = 0;
  function speakResults(): void {
    window.clearTimeout(speak);
    speak = window.setTimeout(() => {
      const n = resultCount(applied.selection);
      announce(n === 1 ? t('shownOne') : t('shown', { n }));
    }, 500);
  }

  /** Keep the results in view when the toolbar is stuck and the list changes under it. */
  function keepInView(): void {
    const gap = lists!.getBoundingClientRect().top - toolbar!.getBoundingClientRect().bottom;
    if (gap < 0 && window.scrollY > 0) window.scrollBy({ top: gap, behavior: 'auto' });
  }

  /** Make `next` the page's state: lists, controls, chips, URL. */
  function commit(next: State, { user = true }: { user?: boolean } = {}): void {
    applied = next;
    paintLists();
    paintControls(applied.selection);
    paintChips();
    paintToolbar();
    paintApply(staged ?? applied.selection);
    writeUrl();
    if (user) {
      fade();
      keepInView();
      speakResults();
    }
  }

  /** A new selection: “All” when filters first appear; back to “By line” when they all go. */
  function withSelection(selection: Selection): State {
    let view = applied.view;
    const before = selectedCount(applied.selection);
    const after = selectedCount(selection);
    if (before === 0 && after > 0 && view === 'line') {
      view = 'all';
      autoView = true;
    } else if (after === 0 && autoView) {
      view = 'line';
      autoView = false;
    }
    return { ...applied, selection, view };
  }

  // ── The view and the sort ────────────────────────────────────────────────
  for (const button of qa<HTMLButtonElement>('[data-view]')) {
    button.addEventListener('click', () => {
      autoView = false;
      commit({ ...applied, view: button.dataset['view'] as View });
    });
  }
  sortSelect.addEventListener('change', () => {
    commit({ ...applied, sort: sortSelect.value as SortId });
  });

  // ── Chips and “Clear all” ────────────────────────────────────────────────
  chipList.addEventListener('click', (event) => {
    const chip = (event.target as HTMLElement).closest<HTMLElement>('[data-chip-group]');
    if (!chip) return;
    const group = chip.dataset['chipGroup'] as GroupId;
    const selection = clone(applied.selection);
    selection[group] = selection[group].filter((v) => v !== chip.dataset['chipValue']);
    commit(withSelection(selection));
    // The chip is gone: focus goes to the first one left, or to the sort.
    (chipList.querySelector<HTMLElement>('.chip') ?? sortSelect).focus();
  });

  for (const button of qa('[data-filter-clear-all]')) {
    button.addEventListener('click', () => {
      if (staged) {
        // The full-screen panel: the choices are cleared in the panel, not yet on the page.
        staged = emptySelection();
        paintControls(staged);
        paintApply(staged);
        return;
      }
      const inPanel = dialog.contains(button);
      commit(withSelection(emptySelection()));
      // The button went with the chips or the empty state; focus starts again at the toolbar.
      if (!inPanel) qa<HTMLElement>('[data-view]')[0]?.focus();
    });
  }

  // ── The groups: one element, in the toolbar or in the panel ──────────────
  const panelOf = (trigger: HTMLElement) =>
    document.getElementById(trigger.getAttribute('aria-controls') ?? '');
  const inDrawer = () => groupsEl.dataset['mode'] === 'drawer';

  function setOpen(trigger: HTMLElement, open: boolean): void {
    trigger.setAttribute('aria-expanded', String(open));
    const panel = panelOf(trigger);
    if (panel) panel.hidden = !open;
  }

  function closeGroups(except?: HTMLElement): void {
    for (const trigger of triggers) if (trigger !== except) setOpen(trigger, false);
  }

  for (const trigger of triggers) {
    trigger.addEventListener('click', () => {
      const open = trigger.getAttribute('aria-expanded') !== 'true';
      // In the toolbar one panel is open at a time; in the filter panel each section is its own.
      if (!inDrawer() && open) closeGroups(trigger);
      setOpen(trigger, open);
    });
  }

  // Escape closes the panel under a button and returns to the button.
  groupsEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || inDrawer()) return;
    const open = triggers.find((trigger) => trigger.getAttribute('aria-expanded') === 'true');
    if (!open) return;
    event.preventDefault();
    setOpen(open, false);
    open.focus();
  });

  // Tabbing out of a group closes its panel. Only the keyboard does this: a mouse press on
  // plain text moves focus to <main>, and that must not close the panel under the pointer.
  groupsEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || inDrawer()) return;
    const group = (event.target as HTMLElement).closest<HTMLElement>('[data-group]');
    if (!group) return;
    window.setTimeout(() => {
      if (group.contains(document.activeElement)) return;
      const trigger = group.querySelector<HTMLElement>('[data-group-trigger]');
      if (trigger) setOpen(trigger, false);
    }, 0);
  });
  // A click outside the groups closes the open panel.
  document.addEventListener('pointerdown', (event) => {
    if (!inDrawer() && !groupsEl.contains(event.target as Node)) closeGroups();
  });

  // A box ticked: from 1024px and in the drawer it applies at once; in the full-screen panel
  // it is staged until “Show n cigars”.
  groupsEl.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLInputElement) || !event.target.matches('[data-filter]')) {
      return;
    }
    const selection = readInputs();
    if (staged) {
      staged = selection;
      paintControls(staged);
      paintApply(staged);
    } else {
      commit(withSelection(selection));
    }
  });

  // ── The panel below 1024px ───────────────────────────────────────────────
  // The same native-dialog behaviour as the cart drawer in shell.ts: the page behind is inert,
  // Escape closes, a click on the dimmed page closes, focus goes back to the button. Kept here
  // so the shell stays one small script on every page.
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

  opener.addEventListener('click', () => {
    if (mqStaged.matches) {
      staged = clone(applied.selection);
      paintControls(staged);
    }
    paintApply(staged ?? applied.selection);
    dialog.showModal();
    opener.setAttribute('aria-expanded', 'true');
  });

  dialog.querySelectorAll('[data-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    opener.setAttribute('aria-expanded', 'false');
    // Closed without “Show n cigars”: the staged choices are dropped.
    if (staged) {
      staged = null;
      paintControls(applied.selection);
    }
    opener.focus();
  });

  applyButton.addEventListener('click', () => {
    if (staged) {
      const selection = staged;
      staged = null;
      commit(withSelection(selection));
    }
    dialog.close();
  });

  // ── Which layout, by width ───────────────────────────────────────────────
  function applyMode(): void {
    if (mqDrawer.matches) {
      if (groupsEl!.parentElement !== dialogSlot) dialogSlot!.append(groupsEl!);
      groupsEl!.dataset['mode'] = 'drawer';
      // Full screen: the first group open. Drawer: all of them, there is room.
      triggers.forEach((trigger, i) => setOpen(trigger, mqStaged.matches ? i === 0 : true));
    } else {
      if (dialog!.open) dialog!.close();
      if (groupsEl!.parentElement !== toolbarSlot) toolbarSlot!.append(groupsEl!);
      groupsEl!.dataset['mode'] = 'popover';
      closeGroups();
    }
    // From the full screen to the drawer with choices staged: they are dropped.
    if (staged && !mqStaged.matches) {
      staged = null;
      paintControls(applied.selection);
    }
  }
  mqDrawer.addEventListener('change', applyMode);
  mqStaged.addEventListener('change', applyMode);

  // ── Start ────────────────────────────────────────────────────────────────
  applyMode();
  commit(applied, { user: false });
  // A hand-edited or stale link is tidied: only known values, in the fixed order.
  if (!parsed.clean) writeUrl();
  document.documentElement.classList.remove('cx-pending');
}
