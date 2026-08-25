import { Product } from '@/data/products';

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// Format currency using Bangladeshi Taka symbol (৳)
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '৳0';
  return `৳${Math.round(amount).toLocaleString('en-IN')}`;
}

export function filterProducts(
  products: Product[],
  filters: {
    category?: string;
    workType?: string;
    occasion?: string;
    material?: material;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
    searchQuery?: string;
    sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  }
): Product[] {
  let result = [...products];

  if (filters.category && filters.category !== 'All') {
    result = result.filter((p) => p.category === filters.category);
  }

  if (filters.workType && filters.workType !== 'All') {
    result = result.filter((p) => p.workType === filters.workType);
  }

  if (filters.occasion && filters.occasion !== 'All') {
    result = result.filter((p) => p.occasion === filters.occasion);
  }

  if (filters.color && filters.color !== 'All') {
    const qColor = filters.color.toLowerCase();
    result = result.filter(
      (p) =>
        p.colors?.some((c) => c.name.toLowerCase().includes(qColor)) ||
        p.variations?.some((v) => v.colorName.toLowerCase().includes(qColor))
    );
  }

  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.workType || '').toLowerCase().includes(q) ||
        (p.material || '').toLowerCase().includes(q) ||
        p.colors?.some((c) => c.name.toLowerCase().includes(q)) ||
        p.variations?.some((v) => v.colorName.toLowerCase().includes(q))
    );
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }
  }

  return result;
}
type material = string;
