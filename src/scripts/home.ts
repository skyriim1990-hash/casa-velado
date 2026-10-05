// The home page's three small behaviours (blueprint 3, 8). No library, no scroll listeners.
//   R3  the picture beside the lines follows the row you point at or focus (200ms fade in CSS)
//   R4  the picture beside the text follows the text that passes the middle of the screen
//   all section headings and large pictures fade in once as they come into view
// Without this script the page is whole: R3 shows Galera, R4 is five blocks one after another.

// ── Fade in on view ────────────────────────────────────────────────────────
const still = matchMedia('(prefers-reduced-motion: reduce)');
const reveals = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
if (!still.matches && reveals.length > 0 && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('reveal-ready');
  const seen = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 },
  );
  reveals.forEach((el) => seen.observe(el));
}

// ── R3: the picture beside the lines ───────────────────────────────────────
const lines = document.querySelector<HTMLElement>('[data-lines]');
if (lines) {
  const slides = [...lines.querySelectorAll<HTMLElement>('[data-slide]')];
  const show = (id: string | undefined) => {
    if (!id) return;
    slides.forEach((slide) => slide.classList.toggle('is-active', slide.dataset['slide'] === id));
  };
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  lines.querySelectorAll<HTMLElement>('[data-line]').forEach((row) => {
    row.addEventListener('pointerenter', (event) => {
      if (fine.matches && event.pointerType === 'mouse') show(row.dataset['line']);
    });
    // The keyboard gets the same picture as the pointer.
    row.addEventListener('focus', () => show(row.dataset['line']));
  });
}

// ── R4: the picture beside the text ────────────────────────────────────────
const story = document.querySelector<HTMLElement>('[data-process]');
if (story && 'IntersectionObserver' in window) {
  const figures = [...story.querySelectorAll<HTMLElement>('[data-figure]')];
  const copies = [...story.querySelectorAll<HTMLElement>('[data-copy]')];
  // A text counts when it crosses the middle of the screen: a line one pixel high there.
  const watch = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = copies.indexOf(entry.target as HTMLElement);
        figures.forEach((figure, i) => figure.classList.toggle('is-active', i === index));
      });
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  copies.forEach((copy) => watch.observe(copy));
}
