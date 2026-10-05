// Speaks a message to screen readers through a polite live region (blueprint 9.2):
// “Galera Robusto added. Your cart has 3 items.”, “8 cigars shown.”
// A modal panel makes the rest of the page inert, and an inert live region is not spoken, so
// while a panel is open the message goes to the region inside it (`data-dialog-status`);
// otherwise to the one in the shell (`data-status`).
export function announce(message: string): void {
  const region =
    document.querySelector<HTMLElement>('dialog[open] [data-dialog-status]') ??
    document.querySelector<HTMLElement>('[data-status]');
  if (!region) return;
  // Clearing first makes a repeated message speak again.
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
