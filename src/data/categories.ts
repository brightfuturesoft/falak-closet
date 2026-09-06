/**
 * Category taxonomy types + seed data.
 *
 * The live taxonomy lives in MongoDB and is read through `/api/categories`
 * (see `useCategories()` for clients, `fetchCategories()` for Server Components).
 * `INITIAL_CATEGORIES` is only a seed payload (POST /api/categories/seed) and an
 * offline fallback for storefront components.
 */

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type?: 'category' | 'occasion' | string;
  icon?: string;
  description?: string;
  image?: string;
  subCategories?: SubCategory[];
  isFeatured?: boolean;
  productCount?: number;
}

export const INITIAL_CATEGORIES: Category[] = [];
