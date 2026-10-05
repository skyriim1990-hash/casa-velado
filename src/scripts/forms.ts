// The demonstration forms (blueprint 2.3, 9.2): the reservation form on /tasting-room and the contact
// form on /contact. Nothing is sent anywhere: there is no request, no backend and no external form
// service. The script checks the fields, shows each error beside its field, puts a summary
// above the form, moves the focus to the first field to correct, and, when everything is right,
// shows the “demonstration project” confirmation in place of the form.
//
// Without this script the form is whole to read but its button is disabled (as in the footer's
// letter form), a note says the form needs JavaScript, and nothing pretends to be sent.
import { fill } from '../lib/format';

document.querySelectorAll<HTMLFormElement>('form[data-demo-form]').forEach(init);

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function init(form: HTMLFormElement): void {
  const summary = form.querySelector<HTMLElement>('[data-form-summary]');
  const submit = form.querySelector<HTMLButtonElement>('[data-form-submit]');
  const done = document.querySelector<HTMLElement>(`[data-form-done="${form.id}"]`);
  const { summaryText = '', summaryOneText = '', sending = '', confirmation = '' } = form.dataset;
  const submitText = submit?.textContent ?? '';

  // The button waits for this script, so a visitor without it cannot press a button that does nothing.
  if (submit) submit.disabled = false;

  // A reservation cannot be for a day that has passed: the date field starts today.
  const today = (() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  })();
  form.querySelectorAll<HTMLInputElement>('input[type="date"]').forEach((input) => {
    input.min = today;
  });

  // A field that is not on show (the address, when the order is collected) is not checked.
  const controls = () =>
    [...form.querySelectorAll<Control>('input, select, textarea')].filter(
      (c) =>
        !(c instanceof HTMLInputElement && (c.type === 'radio' || c.type === 'submit')) &&
        !c.disabled &&
        !c.closest('[hidden]'),
    );

  /** The message for a field that needs correcting, or '' when it is right. */
  function problem(control: Control): string {
    const value = control.value.trim();
    const { msgEmpty = '', msgInvalid = '', msgPast = '' } = control.dataset;
    if (control.required && value === '') return msgEmpty;
    if (value === '') return '';
    if (control instanceof HTMLInputElement) {
      if (control.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return msgInvalid;
      if (control.type === 'date') {
        // A real date (the browser gives an empty value for one that is not) and not in the past.
        if (Number.isNaN(Date.parse(value))) return msgInvalid;
        if (value < today) return msgPast;
      }
      if (control.type === 'time' && !/^\d{2}:\d{2}$/.test(value)) return msgInvalid;
    }
    if (control instanceof HTMLSelectElement && control.dataset['guests'] !== undefined) {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 6) return msgInvalid;
    }
    return '';
  }

  function show(control: Control, message: string): void {
    const error = control.closest('.field')?.querySelector<HTMLElement>('[data-field-error]');
    if (error) error.textContent = message;
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  }

  // A mistake is cleared as soon as the field is touched again.
  form.addEventListener('input', (event) => {
    const control = event.target as Control;
    if (control.hasAttribute('aria-invalid')) show(control, '');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const bad: Control[] = [];
    controls().forEach((control) => {
      const message = problem(control);
      show(control, message);
      if (message) bad.push(control);
    });

    if (bad.length > 0) {
      if (summary) {
        summary.textContent =
          bad.length === 1 ? summaryOneText : fill(summaryText, { n: bad.length });
      }
      bad[0]?.focus();
      return;
    }

    if (summary) summary.textContent = '';
    if (submit) {
      submit.disabled = true;
      submit.textContent = sending;
    }
    // A pause the length of a short send; no request is made.
    window.setTimeout(() => {
      form.hidden = true;
      if (submit) submit.textContent = submitText;
      if (done) {
        const text = done.querySelector<HTMLElement>('[data-form-done-text]');
        if (text) text.textContent = confirmation;
        done.hidden = false;
        done.focus();
      }
    }, 600);
  });
}
