---
name: nextjs-seo-optimization
description: Use this skill when configuring search engine optimization (SEO), Open Graph tags, canonical URLs, sitemaps, or robots.txt rules in the Next.js App Router.
---

# Next.js SEO Optimization Guide

This skill details the patterns, conventions, and files used to maintain and optimize search engine visibility, crawling, indexing, and social media preview cards in this codebase.

## 1. Metadata API Configuration

Configure metadata in `layout.tsx` or `page.tsx` files. Always use the built-in Next.js `Metadata` type.

### Global Setup (`src/app/layout.tsx`)
Set the title templates, base description, and canonical URL metadata globally:
```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://falakcloset.com'),
  title: {
    default: 'Falak Closet | Premium Eastern Wear & Modern Fashion',
    template: '%s | Falak Closet'
  },
  description: 'Discover premium Eastern wear, modest outfits, and modern style statements at Falak Closet.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Falak Closet',
    description: 'Discover premium Eastern wear and modest outfits.',
    url: 'https://falakcloset.com',
    siteName: 'Falak Closet',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
      }
    ],
    locale: 'en_US',
    type: 'website',
  }
};
```

---

## 2. Dynamic Sitemap (`src/app/sitemap.ts`)

The sitemap dynamically lists both static pages and catalog products so search engines index them automatically:
- **Location**: [`sitemap.ts`](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/src/app/sitemap.ts)
- **Updating**: When adding new static pages or changing product catalog sources, update the respective mappings in `sitemap.ts`.
- **Precedence/Priority**: Set `/` to priority `1.0`, major landing pages (like `/shop`) to `0.9`, and individual products to `0.8`.

---

## 3. Crawler Instructions (`src/app/robots.ts`)

The [`robots.ts`](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/src/app/robots.ts) file governs search engine crawler behaviors:
- **Allowing**: All public browsing pages are allowed (`/`, `/shop`, `/product/*`).
- **Disallowing**: Private/sensitive routes that do not need to be indexed (e.g. `/checkout`, `/account`) should be explicitly disallowed.
- **Reference**: Must point to `https://falakcloset.com/sitemap.xml`.

---

## 4. Semantic HTML and Image Alt Tags

To optimize page rankings:
- **Heading Hierarchy**: Ensure there is only one `<h1>` tag per page (typically the main header or product title), followed by logical `<h2>` and `<h3>` structures.
- **Alt Attributes**: Every Next.js `<Image>` component MUST include a descriptive, keyword-rich `alt` string attribute (avoid empty or generic text like "product image").
- **Canonical URLs**: Use the `alternates` configuration in metadata on product pages to avoid duplicate indexing if a product is accessible under multiple search categories.
