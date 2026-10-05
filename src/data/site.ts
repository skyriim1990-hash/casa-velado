import { delivery as shipping } from './contact.ts';
import { PH } from './placeholders.ts';

// Brand-wide content that more than one page uses: identity, navigation, and the approved
// microcopy of blueprint Appendix B and sections 2.3, 4.6, 4.7 and 5.4. Page copy that only
// one page uses stays with that page. Templates use {n} and {price}; nothing is invented.

export const identity = {
  established: 1987,
  city: 'Estelí',
  country: 'Nicaragua',
  /** The signature (blueprint 1.2). It appears rarely: footer, back of the box, end of Our House. */
  signature: 'Enough, and no more.',
  /** The one-sentence description (blueprint 1.4). */
  oneSentence: 'A small family house in Estelí that prints the harvest year on every box.',
  /** The short story for the site (blueprint 1.7). */
  shortStory:
    'Casa Velado began in 1987 as a family farm outside Estelí, in northern Nicaragua. For the first years we sold our leaf to other houses and learned from what they sent back. Today we roll our own cigars: four lines and one edition a year, from tobacco we have cured, fermented and waited for. Every box carries the harvest year. Enough, and no more.',
  /** Quiet disclosure, last line of the footer (blueprint 2.3). */
  fictionNotice: 'Casa Velado is a fictional brand created as a design portfolio project.',
  /** The “demonstration project” confirmations (blueprint 2.3, 4.6). */
  demo: {
    order: 'This is a demonstration project. Your order has not been placed.',
    reservation: 'Thank you. This is a demonstration project, so no reservation has been made.',
    contact: 'Thank you. This is a demonstration project, so your message has not been sent.',
    notify: 'Thank you. This is a demonstration project, so no email will be sent.',
    newsletter:
      'You’re on the list. The first letter arrives with the new harvest. (This is a demonstration project; no emails are sent.)',
  },
} as const;

export const nav = {
  primary: [
    { label: 'Cigars', href: '/cigars' },
    { label: 'Tobacco', href: '/tobacco' },
    { label: 'Our House', href: '/our-house' },
    { label: 'Journal', href: '/journal' },
    { label: 'Tasting Room', href: '/tasting-room' },
  ],
  /** Mobile menu, below the primary links (blueprint 5.4). Instagram is a placeholder, not a link. */
  secondary: [
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping', href: '/shipping' },
    { label: 'Instagram', href: null, placeholder: PH.link },
  ],
  legal: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Shipping', href: '/shipping' },
  ],
  /** Footer column “The house”. The “Collection” column is read from the lines. */
  footerHouse: [
    { label: 'Tobacco', href: '/tobacco' },
    { label: 'Our House', href: '/our-house' },
    { label: 'Journal', href: '/journal' },
    { label: 'Tasting Room', href: '/tasting-room' },
    { label: 'Contact', href: '/contact' },
  ],
} as const;

export const microcopy = {
  skipLink: 'Skip to content',
  menu: 'Menu',
  close: 'Close',
  cart: 'Cart ({n})',
  cartTitle: 'Cart ({n})',
  addToCart: 'Add to cart · {price}',
  added: 'Added ✓',
  notifyMe: 'Notify me when it returns',
  options: { single: 'Single cigar', five: 'Pack of 5', box: 'Box of {n}' },
  availability: {
    in_stock: 'In stock',
    low: 'Few remaining',
    limited: 'Limited',
    sold_out: 'Sold out',
  },
  /** The badge on a product card: one at most (blueprint 4.5). */
  badges: { limited: 'Limited', low: 'Few remaining', sold_out: 'Sold out' },
  /** Read aloud with the strength bars (blueprint 5.4). */
  strengthSr: 'Strength: {n} of 5, {word}',
  fromPrice: 'From {price}',
  limitedPerOrder: 'Limited to {n} boxes per order.',
  delivery: `Delivered within ${shipping.timeframe} to ${shipping.regions}. Adults only.`,
  noscriptCart: 'Please enable JavaScript to use the cart.',
  /** The collection page (blueprint 2.3, 4.4, Appendix B). Fixed text; the counts are worked out. */
  collection: {
    title: 'Cigars',
    intro: 'Four permanent lines and one edition a year. Every cigar is rolled by hand in Estelí.',
    description:
      'Fifteen cigars and a sampler, from four permanent lines and one edition a year, rolled by hand in Estelí.',
    items: '{n} items',
    itemsOf: '{n} of {total} items',
    aboutLine: 'About this line',
    noscript: 'Filters and sorting need JavaScript. Every cigar is listed below, by line.',
    jump: 'Lines',
    allHeading: 'All cigars',
  },
  filters: {
    title: 'Filters',
    /** “Filters (2)” once something is chosen; “Filters” while nothing is. */
    withCount: 'Filters ({n})',
    clearAll: 'Clear all',
    clear: 'Clear filters',
    show: 'Show {n} cigars',
    showOne: 'Show 1 cigar',
    none: 'No cigars match these filters.',
    shown: '{n} cigars shown.',
    shownOne: '1 cigar shown.',
    byLine: 'By line',
    all: 'All',
    view: 'View',
    sort: 'Sort',
    active: 'Active filters',
    remove: 'Remove filter: {group}, {value}',
    chip: '{group}: {value}',
    selected: '{n} selected',
    cigarsWord: 'cigars',
    cigarWord: 'cigar',
  },
  cartDrawer: {
    remove: 'Remove',
    subtotal: 'Subtotal',
    shipping: 'Shipping: calculated at checkout',
    shippingLabel: 'Shipping',
    shippingValue: 'Calculated at checkout',
    total: 'Total',
    giftWrapping: 'Gift wrapping',
    checkout: 'Go to checkout',
    continue: 'Continue browsing',
    empty: 'Your cart is empty.',
    browse: 'Browse the cigars',
    muestrarioHint: 'Not sure where to start? The Muestrario holds one cigar from each line.',
    decrease: 'Decrease quantity',
    increase: 'Increase quantity',
    announce: '{name} added. Your cart has {n} items.',
    announceOne: '{name} added. Your cart has 1 item.',
    /** Spoken after a change in another tab, and as the tail of a removal. */
    has: 'Your cart has {n} items.',
    hasOne: 'Your cart has 1 item.',
    /** Names for the row controls and the spoken messages (blueprint 9.2). */
    decreaseFor: 'Decrease quantity: {name}, {option}',
    increaseFor: 'Increase quantity: {name}, {option}',
    quantityFor: 'Quantity: {name}, {option}',
    removeFor: 'Remove {name}, {option}',
    quantityNow: '{name}, {option}: quantity {n}. {count}',
    removed: '{name}, {option} removed. {count}',
    atMost: 'The most you can order is {n}.',
    giftOn: 'Gift wrapping added.',
    giftOff: 'Gift wrapping removed.',
  },
  /** The Tasting Room (blueprint 2.3, 3 R7). The city, address and hours are placeholders until the owner gives them. */
  tastingRoom: {
    title: 'Tasting Room',
    description:
      'The Casa Velado Tasting Room: a humidor, coffee and rum pairings and someone who knows the leaf. Ask for a table.',
    label: 'The Tasting Room, {city}',
    lead: 'A table, coffee, and someone who knows the leaf.',
    intro:
      'The Tasting Room is where Casa Velado has a table in {city}. There is a humidor, coffee and rum to pair with a cigar, and someone who knows the leaf: where it grew, how it was cured and fermented, and how many months it has aged. Those figures are written in the ledger, and the same ledger is on the box. This page is for asking for a table. The address and the hours are given below.',
    points: ['The humidor', 'Coffee and rum pairings', 'Someone who knows the leaf'],
    practical: 'Where and when',
    address: 'Address',
    hours: 'Hours',
    city: 'Estelí',
    addressValue: 'Estelí, Nicaragua',
    hoursValue: 'Mon–Sat, 09:00–18:00',
    mapName: 'Map of the Tasting Room area',
    reserve: 'Reserve a table',
    reserveLead: 'This is a demonstration project: no reservation is made and nothing is sent.',
  },
  /** Contact (blueprint 2.3). */
  contact: {
    title: 'Contact',
    description:
      'Contact Casa Velado about a general enquiry, trade or press. This is a demonstration project: nothing is sent.',
    lead: 'A general enquiry, trade or press.',
    topic: 'Topic',
    details: 'Details',
    email: 'Email',
    phone: 'Phone',
    factory: 'Factory address in Estelí',
    demo: 'This is a demonstration project: no message is sent.',
  },
  /** The journal (blueprint 2.3, 4.3, 9.2). The entries themselves are the records in src/content/journal. */
  journal: {
    title: 'Journal',
    description:
      'Notes from the house: the harvest, the craft, pairings and guides, in the order the journal keeps them.',
    categories: 'Categories',
    all: 'All',
    shown: '{n} entries shown.',
    shownOne: '1 entry shown.',
    back: 'Journal',
    readingTime: '{n} min read',
    cigarInEntry: 'The cigar in this entry',
    more: 'More from the journal',
    /** Where an entry leads at its end: the process entries to Tobacco, the rest to the cigars. */
    toTobacco: 'How we work',
    toCigars: 'Browse the cigars',
  },
  /** Our House (blueprint 1.8, 2.3). The history, the places, the rings and the list come from the house record. */
  ourHouse: {
    title: 'Our House',
    description:
      'A small family house in Estelí that has kept a ledger since 1987: its history, the places it works with and what it chooses not to do.',
    chapter: 'Chapter',
    facts: {
      founded: 'Founded',
      land: 'Land',
      permanentLines: 'Permanent lines',
      edition: 'Edition',
      editionValue: 'One each year',
      harvests: 'Harvests on the boxes',
      rolling: 'Rolling',
    },
    places: {
      title: 'The places',
      groupNorth: 'Northern Nicaragua',
      groupApart: 'Apart',
      mapName: 'Places connected to the house',
      mapDescription:
        'Estelí, Condega and Jalapa are grouped together under Northern Nicaragua. Ometepe is set apart.',
      note: 'A diagram of the places, not a map: the order and the spacing show no distance.',
      leafIn: 'Leaf in',
      listTitle: 'Lines with leaf from each place',
    },
    bands: {
      title: 'The band',
      label: 'Casa Velado band, {version}',
      middle: 'the middle version',
      today: 'today',
    },
    wontDo: { title: 'What we don’t do' },
    closing: { primary: 'How we work', secondary: 'Browse the cigars' },
  },
  /** The Tobacco page (blueprint 2.3). The chapters, the table and the glossary are read from the data. */
  tobacco: {
    title: 'Tobacco',
    description:
      'From the field to the box: how Casa Velado cures, ferments, ages and rolls its tobacco, and the figures its harvest ledger keeps.',
    intro:
      'Every box carries the harvest year and the months the leaf has aged. Here is where those figures come from: five stages, from the field to the box, as the ledger keeps them.',
    chapters: 'Five stages',
    ledger: {
      title: 'The harvest ledger',
      line: 'Line',
      harvest: 'Harvest',
      fermentation: 'Fermentation',
      leafAgeing: 'Leaf ageing',
      cigarAgeing: 'Cigar ageing',
    },
    glossary: 'Glossary',
    cta: 'Browse the cigars',
  },
  /** The home page (blueprint 3, R1–R7). The figures and prices are read from the catalogue. */
  home: {
    hero: {
      label: 'ESTELÍ, NICARAGUA · EST. 1987',
      title: 'Tobacco, left to mature.',
      subtitle:
        'A family cigar house. Four lines, rolled by hand from leaf we have grown, cured and waited for.',
      cta: 'Explore the cigars',
      link: 'How we work',
    },
    name: {
      label: 'The name',
      lead: '<i lang="es">Velar</i> means to keep watch. During the curing season, someone stays in the <i lang="es">galera</i> through the night, opening and closing the doors as the air changes. It is the quietest part of the work, and the part everything else depends on.',
      link: 'The story of the house',
    },
    lines: {
      label: 'The collection',
      title: 'Four lines and one harvest a year.',
      cta: 'View the full collection',
      from: 'From {price}',
    },
    process: {
      label: 'How we work',
      title: 'Five stages. About four years.',
      cta: 'More about the tobacco',
      stage: 'Stage {n}',
    },
    cosecha: {
      label: 'This year’s edition',
      title: 'Cosecha 2020',
      text: 'Leaf from a single harvest, aged for five years. Every box is numbered.',
      cta: 'View Cosecha 2020',
      price: '{single} per cigar · {box} for a numbered box of 10',
      format: 'Format',
      boxes: 'Boxes',
    },
    journal: {
      label: 'Journal',
      cta: 'All entries',
    },
    tastingRoom: {
      label: 'The Tasting Room, {city}',
      title: 'A table, coffee, and someone who knows the leaf.',
      lines: [
        'A humidor to choose from, coffee and rum to pair it with, and someone who knows the leaf.',
        'We are at {address}, and open {hours}.',
      ],
      cta: 'Reserve a table',
    },
  },
  /** The product page (blueprint 4.6): headings and labels. The facts come from the catalogue. */
  product: {
    cigars: 'Cigars',
    breadcrumbs: 'Breadcrumb',
    format: 'Format',
    quantity: 'Quantity',
    atMost: 'Up to {n}',
    gallery: 'Photographs',
    photoOf: 'Photograph {n} of {total}',
    counter: '{n} / {total}',
    tasting: 'Tasting notes',
    thirds: [
      { numeral: 'I', title: 'First third' },
      { numeral: 'II', title: 'Second third' },
      { numeral: 'III', title: 'Final third' },
    ],
    ledger: 'The ledger',
    pairing: 'Pairing',
    sameLine: 'Same line, other sizes',
    journal: 'From the journal',
    strength: 'Strength',
    addShort: 'Add',
    addFor: 'Add {name} to cart',
    notifyEmail: 'Email',
    notifySend: 'Notify me',
  },
  ageGate: {
    question: 'This website contains information about tobacco products. Are you 18 or older?',
    yes: 'Yes, I am 18 or older',
    no: 'No',
    refused: 'This website is only available to adults.',
  },
  newsletter: {
    title: 'Letters from Estelí',
    text: 'Four letters a year: on the harvest, new batches and the Tasting Room.',
    submit: 'Sign up',
  },
  forms: {
    fields: {
      email: 'Email',
      date: 'Date',
      time: 'Time',
      guests: 'Guests',
      name: 'Name',
      phone: 'Phone',
      note: 'Note',
      message: 'Message',
    },
    optional: '(optional)',
    reserve: 'Reserve a table',
    contactIntents: ['General enquiry', 'Trade', 'Press'],
    send: 'Send message',
    sending: 'Sending…',
    summary: 'Please correct the {n} fields marked below.',
    summaryOne: 'Please correct the field marked below.',
    choose: 'Choose',
    noscript: 'Please enable JavaScript to use this form.',
    errors: {
      email: 'Please enter your email address.',
      emailIncomplete: 'This email address looks incomplete.',
      date: 'Please choose a date.',
      datePast: 'Please choose a date that has not passed.',
      time: 'Please choose a time.',
      guests: 'Please choose between 1 and 6 guests.',
      name: 'Please enter your name.',
      phone: 'Please enter a phone number.',
      message: 'Please write a message.',
    },
  },
  /** Checkout (blueprint 2.3, Appendix B): three blocks, the summary as book lines, a demonstration. */
  checkout: {
    title: 'Checkout',
    description:
      'Checkout for Casa Velado: contact, delivery and payment on one page. A demonstration project: nothing is charged and no order is placed.',
    lead: 'This is a demonstration project: nothing is charged and no order is placed.',
    sections: ['Contact', 'Delivery', 'Payment'],
    place: 'Place order',
    summary: 'Your order',
    editCart: 'Edit cart',
    empty: 'Your cart is empty.',
    browse: 'Browse the cigars',
    noscript: 'Please enable JavaScript to use the checkout.',
    deliveryMethod: 'Delivery method',
    paymentMethod: 'Payment method',
    methods: {
      address: 'Delivery to an address',
      collection: 'Collection from the Tasting Room',
    },
    payment: {
      card: 'Card',
      bank: 'Bank transfer',
      cardNote: 'Card details would be asked for here.',
      bankNote: 'Bank details would be shown after the order.',
      illustration: 'Payment is shown for illustration. No card or bank details are collected.',
    },
    fields: {
      address: 'Address',
      city: 'Town or city',
      postcode: 'Postcode',
      country: 'Country',
    },
    countryHint: `We deliver to ${shipping.regions}.`,
    collectionNote: 'Collect your order from the Tasting Room. Nothing is shipped.',
    line: '{option} × {n}',
    shippingNone: 'Not applicable',
    legalLead: 'Before you order, see',
    errors: {
      address: 'Please enter your address.',
      city: 'Please enter your town or city.',
      postcode: 'Please enter your postcode.',
      country: 'Please enter your country.',
    },
  },
  notFound: {
    text: 'This page doesn’t exist.',
    home: 'Back to the home page',
    browse: 'Browse the cigars',
  },
  cookies: {
    text: 'We use only the cookies this site needs to work, plus optional analytics.',
    accept: 'Accept',
    necessaryOnly: 'Necessary only',
  },
  footer: {
    adults: 'For adults only.',
    health: 'Tobacco seriously damages your health.',
  },
} as const;
