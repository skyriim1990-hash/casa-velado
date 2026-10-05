// Values the owner has not supplied (blueprint 0.2 and Appendix C). They are shown on the
// site exactly as written here, visibly, until the owner gives a value. Never fill them in.
// When a value arrives, it changes here and nowhere else.

export const PLACEHOLDER_TOKENS = [
  '[CITY]',
  '[ADDRESS]',
  '[PHONE]',
  '[EMAIL]',
  '[HOURS]',
  '[AREA]',
  '[NUMBER]',
  '[DATE]',
  '[TIMEFRAME]',
  '[PRICE]',
  '[LINK]',
  '[YEAR]',
  '[SHIPPING REGIONS]',
] as const;

export type PlaceholderToken = (typeof PLACEHOLDER_TOKENS)[number];

export const PH = {
  city: '[CITY]',
  address: '[ADDRESS]',
  phone: '[PHONE]',
  email: '[EMAIL]',
  hours: '[HOURS]',
  area: '[AREA]',
  number: '[NUMBER]',
  date: '[DATE]',
  timeframe: '[TIMEFRAME]',
  price: '[PRICE]',
  link: '[LINK]',
  year: '[YEAR]',
  shippingRegions: '[SHIPPING REGIONS]',
} as const satisfies Record<string, PlaceholderToken>;

/** Where each owner value is used, from blueprint Appendix C and the pages that name it. */
export const ownerValues = [
  { token: PH.city, usedFor: 'Tasting Room city (home R7 label, /tasting-room)' },
  {
    token: PH.address,
    usedFor:
      'Tasting Room address (also checkout collection, /shipping); the factory in Estelí (/contact); the seller (/terms, /privacy)',
  },
  { token: PH.phone, usedFor: '/contact' },
  { token: PH.email, usedFor: '/contact; questions on /terms and /privacy' },
  { token: PH.hours, usedFor: 'Tasting Room opening hours (also checkout collection, /shipping)' },
  { token: PH.area, usedFor: 'The first land (Our House, “The beginning”)' },
  {
    token: PH.number,
    usedFor: 'Number of Cosecha 2020 boxes; Tobacco stage figures not yet confirmed',
  },
  { token: PH.timeframe, usedFor: 'Delivery time under the purchase block (also /shipping)' },
  {
    token: PH.shippingRegions,
    usedFor: 'Delivery regions (purchase block, checkout, /shipping)',
  },
  {
    token: PH.price,
    usedFor:
      'Gift wrapping price (cart, checkout, /shipping); the shipping cost (checkout, /shipping)',
  },
  {
    token: PH.date,
    usedFor:
      'Next batch of a sold-out cigar; publication date of each journal entry; “Last updated” on the legal pages',
  },
  { token: PH.link, usedFor: 'Instagram link in the mobile menu' },
  { token: PH.year, usedFor: 'Year of the middle ring (Our House, band-mid)' },
] as const;

/** True when the whole string is a placeholder token. */
export function isPlaceholder(value: string): value is PlaceholderToken {
  return (PLACEHOLDER_TOKENS as readonly string[]).includes(value);
}
