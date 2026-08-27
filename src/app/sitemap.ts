import { MetadataRoute } from 'next';
import { getProductSlugs } from '@/lib/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://falakcloset.com';
  const now = new Date();

  // Real slugs from the database. Listing the seed array here advertised
  // /product/<slug> URLs for demo items that 404 on a live store, and omitted
  // every product the admin actually created.
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getProductSlugs();
    productUrls = slugs.map(({ slug, updatedAt }) => ({
      url: `${baseUrl}/product/${slug}`,
      lastModified: new Date(updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }));
  } catch (err) {
    // A sitemap missing its product URLs still beats a 500 that tells crawlers
    // the whole site is broken.
    console.error('[sitemap] could not list product slugs:', err);
  }

  // /checkout and /account are disallowed in robots.ts — listing them here
  // would tell crawlers to fetch URLs they are told to ignore.
  const staticPages = [
    '',
    '/shop',
    '/live-promotions',
    '/cart',
    '/track',
    '/how-to-order',
    '/shipping',
    '/returns',
    '/privacy',
    '/terms'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.9
  }));

  return [...staticPages, ...productUrls];
}
