/**
 * Two distinct things live in this file:
 *
 * - `Promotion` / `PROMOTIONS` — marketing **banners** for /live-promotions.
 *   Presentation only; never written to the database.
 * - `Coupon` / `DEFAULT_COUPONS` — the seed payload for the `Promotion` table,
 *   i.e. real redeemable **discount codes** validated at checkout.
 *
 * They are not interchangeable. Writing a banner into the coupon collection is
 * what the old /api/seed route did, and it produced records that
 * /api/promotions/validate could not read.
 */

export interface Promotion {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  discountBadge: string;
  discountPercentage: number;
  expiryTimestamp: number; // UNIX timestamp in ms
  bannerImage: string;
  categoryFilter?: string;
  minSpend?: number;
  isFlashSale: boolean;
  terms: string;
}

// Set default live sale end times relative to now (e.g. 2 days / 12 hours from now)
const NOW = Date.now();
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

export const PROMOTIONS: Promotion[] = [
  {
    id: 'promo-01',
    code: 'FLASH25',
    title: 'Eid & Monsoon Flash Sale',
    subtitle: 'Flat 25% Off across all Embroidered Abayas & Velvet Kaftans',
    discountBadge: 'FLAT 25% OFF',
    discountPercentage: 25,
    expiryTimestamp: NOW + TWELVE_HOURS,
    bannerImage: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&q=80',
    categoryFilter: 'Abayas',
    isFlashSale: true,
    terms: 'Valid on selected abayas & kaftans. Cannot be combined with other coupons.'
  },
  {
    id: 'promo-02',
    code: 'HIJAB15',
    title: 'Hijab Bundle Bonanza',
    subtitle: 'Buy 2 Premium Chiffon Hijabs & Get 15% Instant Cashback',
    discountBadge: '15% OFF BUNDLE',
    discountPercentage: 15,
    expiryTimestamp: NOW + THREE_DAYS,
    bannerImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80',
    categoryFilter: 'Hijabs & Dupattas',
    minSpend: 30,
    isFlashSale: false,
    terms: 'Applies automatically when 2 or more hijabs are added to cart.'
  },
  {
    id: 'promo-03',
    code: 'FREESHIP100',
    title: 'Free Worldwide Express Shipping',
    subtitle: 'Enjoy complementary VIP doorstep delivery on all orders over $100',
    discountBadge: 'FREE SHIPPING',
    discountPercentage: 0,
    expiryTimestamp: NOW + (7 * 24 * 60 * 60 * 1000),
    bannerImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=80',
    minSpend: 100,
    isFlashSale: false,
    terms: 'Valid globally for standard express shipping.'
  }
];

// ─── Coupons (the `Promotion` table's seed payload) ──────────────────────────

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string; // 'YYYY-MM-DD'
  status: 'Active' | 'Expired' | 'Disabled';
}

export const DEFAULT_COUPONS: Coupon[] = [
  {
    code: 'EID2026',
    discountType: 'percentage',
    discountValue: 15,
    minSpend: 2500,
    maxDiscount: 1000,
    usageLimit: 500,
    usedCount: 0,
    expiryDate: '2026-06-30',
    status: 'Active'
  },
  {
    code: 'FALAK10',
    discountType: 'percentage',
    discountValue: 10,
    minSpend: 1500,
    maxDiscount: 500,
    usageLimit: 1000,
    usedCount: 0,
    expiryDate: '2026-12-31',
    status: 'Active'
  },
  {
    code: 'WELCOME500',
    discountType: 'fixed',
    discountValue: 500,
    minSpend: 3500,
    maxDiscount: 500,
    usageLimit: 200,
    usedCount: 0,
    expiryDate: '2026-09-30',
    status: 'Active'
  }
];
