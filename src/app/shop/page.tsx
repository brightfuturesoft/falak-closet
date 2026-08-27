import React from 'react';
import { Metadata } from 'next';
import ShopClient from './ShopClient';

// Dynamic Open Graph & Metadata Generator for Catalog Page
export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;

  const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;
  const color = typeof resolvedSearchParams.color === 'string' ? resolvedSearchParams.color : undefined;
  const q = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;
  const page = Math.max(1, parseInt(String(resolvedSearchParams.page ?? '1'), 10) || 1);
  const pageSuffix = page > 1 ? ` | Page ${page}` : '';

  let title = 'Haute Couture Modest Fashion Catalog | Falak Closet';
  let description = 'Explore handcrafted luxury abayas, designer hijabs, kaftans, borkha, and modest fashion creations in Bangladesh. Fast nationwide shipping.';

  if (q) {
    title = `Search results for "${q}" | Falak Closet${pageSuffix}`;
    description = `Browse Modest Fashion designs matching "${q}" at Falak Closet. Quality craftsmanship and fast delivery in Bangladesh.`;
  } else if (category && category !== 'All') {
    title = `${category} Collection | Falak Closet Modest Fashion${pageSuffix}`;
    description = `Explore our hand-stitched ${category} collection. Handcrafted luxury modest fashion from Falak Closet with express delivery.`;
  } else if (color && color !== 'All') {
    title = `${color} Modest Fashion Collection | Falak Closet${pageSuffix}`;
    description = `Discover premium ${color} abayas, hijabs, and kaftans at Falak Closet. Elegant design and premium fabrics.`;
  } else if (pageSuffix) {
    title = `Haute Couture Modest Fashion Catalog${pageSuffix} | Falak Closet`;
  }

  const canonicalUrl = `https://falakcloset.com/shop${category ? `?category=${encodeURIComponent(category)}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Falak Closet Modest Fashion',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80',
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80']
    }
  };
}

export default function ShopPage() {
  return <ShopClient />;
}
