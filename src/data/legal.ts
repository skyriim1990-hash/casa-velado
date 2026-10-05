import { contact, delivery } from './contact.ts';
import { formatPrice } from '../lib/format.ts';
import { microcopy } from './site.ts';

// The four legal pages (blueprint 2.1: /terms, /privacy, /cookies, /shipping, one shared
// template). The blueprint gives no text for them, so this is written from what the site really
// does: nothing is sent, charged or shipped, and the browser keeps four small items. Where a
// real house would state a fact (the seller, an address, delivery regions and time, a price),
// the fictional values of src/data/contact.ts are used.

export interface LegalRow {
  label: string;
  value: string;
}

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  /** Real data set as book-line rows (for example the items the browser keeps). */
  rows?: LegalRow[];
}

export interface LegalPage {
  id: 'terms' | 'privacy' | 'cookies' | 'shipping';
  /** Sentence case, as in the footer. */
  title: string;
  /** English, at most 155 characters. */
  description: string;
  intro: string;
  sections: LegalSection[];
}

/** Said at the top of every legal page, so the template carries it once. */
export const legalMeta = {
  updated: 'Last updated',
  updatedValue: '5 October 2026',
  related: 'Other pages',
} as const;

export const legalPages: LegalPage[] = [
  {
    id: 'terms',
    title: 'Terms',
    description:
      'The terms for using the Casa Velado site. It is a demonstration project: nothing is sold, charged or shipped.',
    intro:
      'These terms say what this site is and what it is not. The shop is a demonstration, so no sale is made under them.',
    sections: [
      {
        id: 'what-this-site-is',
        heading: 'What this site is',
        paragraphs: [
          'Casa Velado is a fictional brand created as a design portfolio project. The house, its history, its cigars, its prices and its figures are written for the project.',
          'The cart and the checkout work in your browser so that you can see how a purchase would go. They are not connected to a shop, a payment service or a warehouse.',
        ],
      },
      {
        id: 'orders-and-payment',
        heading: 'Orders and payment',
        paragraphs: [
          'Pressing “Place order” does not place an order. No payment is taken, no card or bank details are collected, and nothing is dispatched. The confirmation you see says the same.',
          'Prices are shown in euros so that the pages read as a real catalogue would. They are not offers for sale.',
        ],
      },
      {
        id: 'adults-only',
        heading: 'Adults only',
        paragraphs: [
          'The site is about tobacco products and is meant for adults. The question asked when you first arrive is a notice, not a check of your age.',
          'Tobacco seriously damages your health.',
        ],
      },
      {
        id: 'the-seller',
        heading: 'The seller',
        paragraphs: [
          `The seller is Casa Velado, ${contact.address}. To reach the house, write to ${contact.email}.`,
        ],
      },
      {
        id: 'questions',
        heading: 'Questions',
        paragraphs: [`For any question about these terms, write to ${contact.email}.`],
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    description:
      'How the Casa Velado site treats your details: the forms send nothing, and the browser keeps only what the cart and the notices need.',
    intro:
      'This site collects nothing. What you type into a form stays in your browser and is not sent anywhere.',
    sections: [
      {
        id: 'forms',
        heading: 'The forms',
        paragraphs: [
          'The contact form, the reservation form, the letter sign-up, the “notify me” field and the checkout all check what you type in your browser. When you send one, the page shows a confirmation that says it is a demonstration. No request is made, and no one receives anything.',
          'Real personal details are not needed to try the site.',
        ],
      },
      {
        id: 'the-cart',
        heading: 'The cart',
        paragraphs: [
          'Your cart is kept in your browser’s local storage, so that it is still there when you come back and so that your tabs agree with each other. It holds the cigars, the format and the quantity, and whether gift wrapping is ticked. It never leaves your device.',
          'The Cookies page lists everything the browser keeps.',
        ],
      },
      {
        id: 'third-parties',
        heading: 'Third parties',
        paragraphs: [
          'The site does not load analytics, advertising, social media or tracking services. The typefaces are served from the site itself, and the Tasting Room map is a picture, not an embedded service.',
        ],
      },
      {
        id: 'the-controller',
        heading: 'Who is responsible',
        paragraphs: [
          `Because nothing is collected, no one holds your data. If orders or messages were collected, Casa Velado, ${contact.address}, would be responsible for them. You can reach the house at ${contact.email}.`,
        ],
      },
      {
        id: 'your-questions',
        heading: 'Your questions',
        paragraphs: [`For any question about privacy, write to ${contact.email}.`],
      },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies',
    description:
      'The site sets no cookies. It keeps four small items in your browser, listed here with what each is for and how long it lasts.',
    intro:
      'The site sets no cookies and loads no analytics. It keeps four small items in your browser, and this page lists them.',
    sections: [
      {
        id: 'what-the-browser-keeps',
        heading: 'What the browser keeps',
        paragraphs: [
          'Three items are kept in local storage, which stays until you clear it or it expires. One is kept in session storage, which goes when you close the tab.',
        ],
        rows: [
          { label: 'cv-age-ok', value: 'Your answer to the age question, for 30 days' },
          { label: 'cv-cookies', value: 'Your choice on the cookie notice, until cleared' },
          { label: 'cv-cart', value: 'The contents of your cart, until cleared' },
          { label: 'cv-drawer-seen', value: 'That the cart has opened once, until the tab closes' },
        ],
      },
      {
        id: 'the-notice',
        heading: 'The cookie notice',
        paragraphs: [
          'The notice mentions optional analytics. This site loads none, so “Accept” and “Necessary only” change nothing except that your choice is remembered and the notice does not return.',
        ],
      },
      {
        id: 'clearing',
        heading: 'Clearing them',
        paragraphs: [
          'You can remove all four at any time from your browser’s settings. The site then asks the age question again and the cart is empty.',
        ],
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping',
    description:
      'How Casa Velado would deliver: to selected regions, to adults only, or by collection from the Tasting Room. Nothing is shipped in this demonstration.',
    intro:
      'This page says how an order would reach you. It is a demonstration project, so nothing is shipped.',
    sections: [
      {
        id: 'delivery',
        heading: 'Delivery',
        paragraphs: [
          'A house like this delivers to a short list of regions and says plainly how long it takes.',
        ],
        rows: [
          { label: 'Delivery to', value: delivery.regions },
          { label: 'Delivery within', value: delivery.timeframe },
          { label: 'Shipping cost', value: formatPrice(delivery.shippingCents) },
        ],
      },
      {
        id: 'adults-only',
        heading: 'Adults only',
        paragraphs: [
          'Tobacco is delivered to adults only. A real order would be handed over to a person who is 18 or older.',
        ],
      },
      {
        id: 'collection',
        heading: 'Collection',
        paragraphs: [
          'An order could instead be collected from the Tasting Room, where there is no shipping to pay.',
        ],
        rows: [
          { label: 'Address', value: microcopy.tastingRoom.addressValue },
          { label: 'Hours', value: microcopy.tastingRoom.hoursValue },
        ],
      },
      {
        id: 'gift-wrapping',
        heading: 'Gift wrapping',
        paragraphs: [
          `Gift wrapping can be ticked in the cart. It costs ${formatPrice(delivery.giftWrapCents)}.`,
        ],
      },
    ],
  },
];
