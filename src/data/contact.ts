// The fictional contact and delivery values of the house (a portfolio project). They are shown
// as written here; no street address is given. When a value changes, it changes here.

export const contact = {
  email: 'hello@casavelado.com',
  phone: '+505 0000 1987',
  address: 'Estelí, Nicaragua',
} as const;

export const delivery = {
  regions: 'Nicaragua, Europe and North America',
  timeframe: '7–14 business days',
  shippingCents: 1200,
  giftWrapCents: 400,
} as const;
