import { products } from './products';

export const featuredProductSlugs = ['ash', 'rosebud', 'rocky-ai', 'eleos-health'] as const;

export const featuredProducts = featuredProductSlugs
  .map((slug) => products.find((product) => product.slug === slug))
  .filter((product): product is NonNullable<typeof product> => Boolean(product));
