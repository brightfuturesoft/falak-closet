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
  icon?: string;
  description?: string;
  image?: string;
  subCategories: SubCategory[];
  isFeatured?: boolean;
  productCount?: number;
}

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-abayas',
    name: 'Abayas',
    slug: 'abayas',
    icon: 'Shirt',
    description: 'Handcrafted luxury open, closed, and kimono abayas in premium silk and georgette.',
    isFeatured: true,
    subCategories: [
      { id: 'sub-front-open', name: 'Front Open Abayas', slug: 'front-open-abayas', description: 'Flowing open front designs' },
      { id: 'sub-closed', name: 'Closed Abayas', slug: 'closed-abayas', description: 'Classic full coverage abayas' },
      { id: 'sub-kimono', name: 'Kimono Abayas', slug: 'kimono-abayas', description: 'Wide sleeve Japanese kimono cut' },
      { id: 'sub-butterfly', name: 'Butterfly Abayas', slug: 'butterfly-abayas', description: 'Farasha butterfly silhouette' },
      { id: 'sub-umbrella', name: 'Umbrella Abayas', slug: 'umbrella-abayas', description: 'Flared umbrella cut bottom' },
      { id: 'sub-[#0C163A]', name: 'Inner Slip Dresses', slug: 'inner-slip-dresses', description: 'Under-abaya matching slip dresses' }
    ]
  },
  {
    id: 'cat-hijabs',
    name: 'Hijabs & Dupattas',
    slug: 'hijabs-dupattas',
    icon: 'Sparkles',
    description: 'Breathable crinkle, silk, chiffon hijabs, and embroidered dupattas.',
    isFeatured: true,
    subCategories: [
      { id: 'sub-crinkle', name: 'Crinkle Hijabs', slug: 'crinkle-hijabs', description: 'Cool comfort non-iron crinkle hijabs' },
      { id: 'sub-silk', name: 'Silk Hijabs', slug: 'silk-hijabs', description: 'Lustrous mulberry silk hijabs' },
      { id: 'sub-chiffon', name: 'Chiffon Hijabs', slug: 'chiffon-hijabs', description: 'Lightweight formal chiffon wraps' },
      { id: 'sub-jersey', name: 'Jersey Hijabs', slug: 'jersey-hijabs', description: 'Stretchable casual cotton jersey' },
      { id: 'sub-dupattas', name: 'Premium Dupattas', slug: 'premium-dupattas', description: 'Heavily embroidered festive dupattas' },
      { id: 'sub-undercaps', name: 'Undercaps & Pins', slug: 'undercaps-pins', description: 'Tube caps, magnet pins & accessories' }
    ]
  },
  {
    id: 'cat-dresses',
    name: 'Modest Dresses',
    slug: 'modest-dresses',
    icon: 'ShoppingBag',
    description: 'Full length kaftans, maxi gowns, and festive modest ensembles.',
    isFeatured: true,
    subCategories: [
      { id: 'sub-kaftans', name: 'Kaftans', slug: 'kaftans', description: 'Embroidered Arabian kaftan gowns' },
      { id: 'sub-maxi', name: 'Maxi Dresses', slug: 'maxi-dresses', description: 'Tiered and pleated maxi dresses' },
      { id: 'sub-anarkali', name: 'Anarkali Suits', slug: 'anarkali-suits', description: 'Flared ethnic anarkali ensembles' },
      { id: 'sub-[#9B050B]', name: 'Festive Gowns', slug: 'festive-gowns', description: 'Eid and wedding guest occasion wear' }
    ]
  },
  {
    id: 'cat-coord',
    name: 'Co-ord Sets',
    slug: 'coord-sets',
    icon: 'Layers',
    description: 'Matching 2-piece abaya, tunic, and trousers co-ord sets.',
    isFeatured: false,
    subCategories: [
      { id: 'sub-abaya-scarf', name: 'Abaya & Scarf Sets', slug: 'abaya-scarf-sets', description: 'Matching color abaya & hijab combo' },
      { id: 'sub-tunic-set', name: '2-Piece Tunic Sets', slug: '2-piece-tunic-sets', description: 'Tunic top with matching trousers' },
      { id: 'sub-lounge', name: 'Loungewear Sets', slug: 'loungewear-sets', description: 'Relaxed home and travel sets' }
    ]
  },
  {
    id: 'cat-tunics',
    name: 'Luxury Tunics',
    slug: 'luxury-tunics',
    icon: 'Tag',
    description: 'Embroidered long tunics, kurtis, and modest shirt dresses.',
    isFeatured: false,
    subCategories: [
      { id: 'sub-emb-tunics', name: 'Embroidered Tunics', slug: 'embroidered-tunics', description: 'Resham and zari detailed tunics' },
      { id: 'sub-kurtis', name: 'Long Kurtis', slug: 'long-kurtis', description: 'Straight cut modest kurtis' },
      { id: 'sub-shirts', name: 'Shirt Dresses', slug: 'shirt-dresses', description: 'Button down modest shirt dresses' }
    ]
  },
  {
    id: 'cat-acc',
    name: 'Accessories',
    slug: 'accessories',
    icon: 'Gift',
    description: 'No-snag magnetic hijab pins, arm sleeves, brooches, and gift boxes.',
    isFeatured: false,
    subCategories: [
      { id: 'sub-[#F2C76E]', name: 'Hijab Magnets', slug: 'hijab-magnets', description: 'Strong magnetic hijab fasteners' },
      { id: 'sub-sleeves', name: 'Arm Sleeves', slug: 'arm-sleeves', description: 'Full coverage stretch arm sleeves' },
      { id: 'sub-brooches', name: 'Brooches & Rings', slug: 'brooches-rings', description: 'Crystal brooches and scarf rings' },
      { id: 'sub-boxes', name: 'Luxury Gift Boxes', slug: 'luxury-gift-boxes', description: 'Custom branded gift packaging' }
    ]
  }
];

const STORAGE_KEY = 'falak_categories_store_v1';

export function getStoredCategories(): Category[] {
  if (typeof window === 'undefined') return INITIAL_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveStoredCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('falak_categories_updated'));
  } catch {
    // Local storage fallback
  }
}
