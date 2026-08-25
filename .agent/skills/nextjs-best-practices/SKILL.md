---
name: nextjs-best-practices
description: Use this skill when working with Next.js App Router, configuring Server/Client Components, optimization patterns (fonts, images), routing, and metadata configuration.
---

# Next.js 16 App Router Best Practices

This guide establishes the rules and patterns for building SEO-optimized, highly responsive, and modular interfaces using Next.js 16 App Router.

## Server vs. Client Components

Next.js components are **Server Components** by default. Use this hierarchy to structure your page:

- **Server Components (Default)**:
  - Use for fetching data directly from database models (e.g. using Mongoose) or external APIs.
  - Use to render static content, layout, headers, and footer.
  - Keeps bundle size small by executing on the server.
- **Client Components (indicated by `"use client"` directive)**:
  - Use when the component needs state (`useState`, `useReducer`), React lifecycle effects (`useEffect`), browser APIs (geolocation, local storage), or user interaction event listeners (`onClick`, `onChange`).
  - Keep Client Components at the leaves of the component tree to maximize server-side rendering benefits.

---

## SEO and Metadata Configuration

For pages and layouts, export a static or dynamic `metadata` object to optimize for search engines.

### 1. Static Metadata
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Falak Closet | Premium Clothing Store',
  description: 'Explore the latest fashion collections at Falak Closet.',
};
```

### 2. Dynamic Metadata (for product detail pages)
```typescript
import type { Metadata } from 'next';
import { ProductModel } from '@/models/Product';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await ProductModel.findOne({ slug });
  
  return {
    title: `${product?.name || 'Product'} | Falak Closet`,
    description: product?.description || 'Explore our fashion selection.',
  };
}
```

---

## Optimizations

### 1. Image Optimization (`next/image`)
Never use standard HTML `<img>` tags unless strictly necessary. Always use the Next.js `Image` component to benefit from auto-resizing, lazy-loading, WebP compression, and preventing Layout Shift.
- **Rules**:
  - Always provide `width` and `height` to prevent layout shifts, OR use the `fill` property inside a relative container.
  - Add `priority` to images that appear above the fold (e.g., Hero section images) to optimize Largest Contentful Paint (LCP).

### 2. Custom Loading and Error States
- Provide `loading.tsx` inside route directories to render a skeleton UI during page transition.
- Provide `error.tsx` to safely catch and display error fallbacks without crashing the app shell.
- Provide `not-found.tsx` to handle missing slugs or invalid IDs gracefully.
