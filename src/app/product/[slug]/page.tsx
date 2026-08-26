import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlugOrId } from '@/lib/products';
import { formatCurrency } from '@/lib/utils';
import ProductDetailClient from './ProductDetailClient';

/**
 * Resolve the product for both `generateMetadata` and the page body. Next
 * de-duplicates the two calls per request, and `getProductBySlugOrId` is itself
 * cached, so this is one query.
 */
async function loadProduct(slug: string) {
  try {
    return await getProductBySlugOrId(slug);
  } catch (err) {
    console.error('[product] lookup failed for', slug, err);
    return null;
  }
}

// Dynamic Open Graph & Twitter Social Media Card Metadata Generator
export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slug = resolvedParams.slug;
  const colorQuery = typeof resolvedSearchParams.color === 'string' ? resolvedSearchParams.color : undefined;

  // Live product, and no `|| PRODUCTS[0]`: that fallback served a *different*
  // product's title, price, and image to every crawler that hit an
  // admin-created URL.
  const product = await loadProduct(slug);

  if (!product) {
    return {
      title: 'Product not found | Falak Closet',
      description: 'This design is no longer available. Browse the current Falak Closet collection.',
      robots: { index: false, follow: true }
    };
  }

  let selectedColorName = colorQuery;
  let previewImage = product.images?.[0] || 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80';
  let matchedPrice = product.price || 0;

  if (colorQuery) {
    // 1. Check colors array
    const matchedColorObj = product.colors?.find(
      (c) => c.name.toLowerCase() === colorQuery.toLowerCase()
    );
    if (matchedColorObj) {
      selectedColorName = matchedColorObj.name;
      if (matchedColorObj.images && matchedColorObj.images.length > 0) {
        previewImage = matchedColorObj.images[0];
      } else if (typeof matchedColorObj.imageIndex === 'number' && product.images?.[matchedColorObj.imageIndex]) {
        previewImage = product.images[matchedColorObj.imageIndex];
      }
    }

    // 2. Check variations matrix array
    const matchedVar = product.variations?.find(
      (v) => v.colorName.toLowerCase() === colorQuery.toLowerCase()
    );
    if (matchedVar) {
      if (!selectedColorName) selectedColorName = matchedVar.colorName;
      if (matchedVar.imageUrl) previewImage = matchedVar.imageUrl;
      if (matchedVar.priceOverride || matchedVar.price) {
        matchedPrice = matchedVar.priceOverride || matchedVar.price || product.price;
      }
    }
  }

  const title = selectedColorName
    ? `${product.name} - ${selectedColorName} | Falak Closet`
    : `${product.name} | Falak Closet Modest Fashion`;

  const description = `${product.name}${selectedColorName ? ` in ${selectedColorName}` : ''}. Premium ${product.category || 'Modest Fashion'} from Falak Closet. Price: ${formatCurrency(matchedPrice)}. Code: ${product.code || 'FLK'}. ${product.description || ''}`.trim();

  const canonicalUrl = `https://falakcloset.com/product/${product.slug}${selectedColorName ? `?color=${encodeURIComponent(selectedColorName)}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Falak Closet Modest Fashion',
      images: [
        {
          url: previewImage,
          width: 1200,
          height: 630,
          alt: `${product.name}${selectedColorName ? ` - ${selectedColorName}` : ''}`,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [previewImage],
    },
    other: {
      'product:price:amount': String(matchedPrice),
      'product:price:currency': 'BDT',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'product:brand': 'Falak Closet',
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  // A missing product is a 404, not a redirect to whatever happened to be first
  // in the catalog.
  if (!product) notFound();

  // The client reads `?color=` with useSearchParams, which needs a boundary to
  // stay prerenderable.
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs font-mono text-stone-500">Loading product details...</div>}>
      <ProductDetailClient initialProduct={product} />
    </Suspense>
  );
}
