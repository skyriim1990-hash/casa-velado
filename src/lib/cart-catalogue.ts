// The catalogue the cart works from, built once at build time from the approved records and put
// in every page (src/components/shell/CartDrawer.astro). The browser never decides a price: it
// reads the price, the option label and the limit from here (blueprint 4.6, 4.7).
import { getLine, getProducts, productPath } from './catalogue.ts';
import { optionLabel } from './format.ts';
import { optionLimit, type Catalogue } from './cart.ts';

export async function getCartCatalogue(): Promise<Catalogue> {
  const products = await getProducts();
  const entries = await Promise.all(
    products.map(async (product) => {
      const line = await getLine(product.line);
      return [
        product.id,
        {
          id: product.id,
          name: product.kind === 'cigar' ? `${line.name} ${product.vitola}` : line.name,
          href: productPath(product),
          soldOut: product.availability === 'sold_out',
          options: product.options.map((o) => ({
            type: o.type,
            label: optionLabel(o, product, line.kind === 'edition'),
            priceCents: o.priceCents,
            max: optionLimit(o.type, product),
          })),
        },
      ] as const;
    }),
  );
  return Object.fromEntries(entries);
}
