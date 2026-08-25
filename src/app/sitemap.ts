import { MetadataRoute } from 'next';
import { PRODUCTS } from '@/data/products';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://falakcloset.com';

  const productUrls = PRODUCTS.map((product) => ({
    url: `${baseUrl}/product/${product?.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }));

  const staticPages = [
    '',
    '/shop',
    '/live-promotions',
    '/cart',
    '/checkout',
    '/track',
    '/account',
    '/how-to-order',
    '/shipping',
    '/returns',
    '/privacy',
    '/terms'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.9
  }));

  return [...staticPages, ...productUrls];
}
