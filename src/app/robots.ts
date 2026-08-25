import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/account']
    },
    sitemap: 'https://falakcloset.com/sitemap.xml'
  };
}
