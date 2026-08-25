'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  Grid2X2,
  Palette,
  Shirt,
  Tag,
  Sun,
  Search
} from 'lucide-react';
import {
  PRODUCTS,
  WORK_TYPES,
  COLOR_FAMILIES,
  MATERIALS,
  OCCASIONS,
  WEATHER_TYPES,
  Product
} from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';
import { Category, INITIAL_CATEGORIES, getStoredCategories } from '@/data/categories';
import { filterProducts } from '@/lib/utils';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useCart } from '@/context/CartContext';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const { wishlist, products } = useCart();

  // Read URL query params
  const qParam = searchParams.get('q') || '';
  const catParam = searchParams.get('category') || 'All';
  const subCategoryParam = searchParams.get('subCategory') || 'All';
  const workParam = searchParams.get('work') || 'All';
  const occasionParam = searchParams.get('occasion') || 'All';
  const matParam = searchParams.get('material') || 'All';
  const colorParam = searchParams.get('color') || 'All';
  const weatherParam = searchParams.get('weather') || 'All';
  const sortParam = searchParams.get('sort') || 'recommended';
  const wishlistParam = searchParams.get('wishlist') === 'true';

  // Mobile Filter Drawer Toggle
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Search filter query inside sidebar cards
  const [workSearch, setWorkSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  // Perform catalog filtering source
  const allCatalogProducts = products.length > 0 ? products : PRODUCTS;

  // Dynamically extract ONLY active colors present in the actual product dataset
  const activeProductColors = React.useMemo(() => {
    const colorMap = new Map<string, { name: string; hex: string; count: number }>();

    allCatalogProducts.forEach((p) => {
      const productSeenColors = new Set<string>();

      if (p.colors && p.colors.length > 0) {
        p.colors.forEach((c) => {
          if (c.name && !productSeenColors.has(c.name.toLowerCase())) {
            productSeenColors.add(c.name.toLowerCase());
            const key = c.name.toLowerCase();
            const existing = colorMap.get(key);
            if (existing) {
              existing.count += 1;
            } else {
              colorMap.set(key, {
                name: c.name,
                hex: c.hex || '#000000',
                count: 1
              });
            }
          }
        });
      }

      if (p.variations && p.variations.length > 0) {
        p.variations.forEach((v) => {
          if (v.colorName && !productSeenColors.has(v.colorName.toLowerCase())) {
            productSeenColors.add(v.colorName.toLowerCase());
            const key = v.colorName.toLowerCase();
            const existing = colorMap.get(key);
            if (existing) {
              existing.count += 1;
            } else {
              colorMap.set(key, {
                name: v.colorName,
                hex: v.colorHex || '#000000',
                count: 1
              });
            }
          }
        });
      }
    });

    return Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  }, [allCatalogProducts]);

  // Helper to update search params dynamically
  const updateFilterParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'All' || value === '' || value === 'recommended') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/shop?${params.toString()}`);
  };

  const handleResetFilters = () => {
    router.push('/shop');
    setWorkSearch('');
    setColorSearch('');
    setMaterialSearch('');
  };

  // Managed Categories State
  const [managedCategories, setManagedCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  useEffect(() => {
    import('@/actions/categoryActions').then(({ getCategories }) => {
      getCategories()
        .then((data) => {
          if (data.success && Array.isArray(data.categories)) {
            setManagedCategories(data.categories as any);
          } else {
            setManagedCategories(getStoredCategories());
          }
        })
        .catch(() => {
          setManagedCategories(getStoredCategories());
        });
    });
  }, []);

  // Filtered dataset
  const filteredProducts = React.useMemo(() => {
    let list = filterProducts(allCatalogProducts, {
      category: catParam,
      workType: workParam,
      occasion: occasionParam,
      material: matParam,
      color: colorParam,
      searchQuery: qParam
    });

    if (subCategoryParam !== 'All') {
      const targetSub = subCategoryParam.toLowerCase();
      const targetSubSlug = targetSub.replace(/[^a-z0-9]+/g, '-');
      list = list.filter((p) => {
        const pSub = ((p as any).subCategory || '').toLowerCase();
        const pSubSlug = pSub.replace(/[^a-z0-9]+/g, '-');
        return pSub === targetSub || pSubSlug === targetSubSlug || pSubSlug === targetSub || pSub === targetSubSlug;
      });
    }

    if (wishlistParam) {
      const wishlistIds = new Set(wishlist.map((w) => w.id));
      list = list.filter((p) => wishlistIds.has(p.id));
    }

    // Sort logic
    if (sortParam === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortParam === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortParam === 'rating') {
      list.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else if (sortParam === 'newest') {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return list;
  }, [allCatalogProducts, catParam, subCategoryParam, workParam, occasionParam, matParam, colorParam, qParam, wishlistParam, sortParam, wishlist]);

  useEffect(() => {
    trackEvent('search_query', {
      search_term: qParam || 'catalog_browse',
      category: catParam,
      color: colorParam,
      results_count: filteredProducts.length
    });
  }, [qParam, catParam, colorParam, filteredProducts.length, trackEvent]);

  // Filter sidebar card search filtering lists
  const filteredWorkTypes = WORK_TYPES.filter((w) =>
    w.toLowerCase().includes(workSearch.toLowerCase())
  );
  const filteredMaterials = MATERIALS.filter((m) =>
    m.toLowerCase().includes(materialSearch.toLowerCase())
  );
  const filteredColors = activeProductColors.filter((c) =>
    c.name.toLowerCase().includes(colorSearch.toLowerCase())
  );

  const hasActiveFilters =
    catParam !== 'All' ||
    workParam !== 'All' ||
    occasionParam !== 'All' ||
    matParam !== 'All' ||
    colorParam !== 'All' ||
    qParam !== '' ||
    wishlistParam;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 pb-32 lg:pb-12 text-stone-900">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-pink-100 pb-6 gap-4">
        <div>
          <span className="px-3.5 py-1 bg-pink-100 text-[#D92670] text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Haute Couture Catalog
          </span>
          <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2">
            {catParam === 'All' ? 'Complete Collection' : `${catParam} Collection`}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Showing <strong className="text-stone-900 font-bold">{filteredProducts.length}</strong> luxurious modest designs
            {qParam && <span> matching &quot;<strong className="text-[#D92670]">{qParam}</strong>&quot;</span>}
          </p>
        </div>

        {/* Top Controls: Mobile Filter Drawer Button & Desktop Sorting */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden px-4 py-2.5 bg-white border border-pink-200 text-[#D92670] text-xs font-bold rounded-full hover:bg-pink-50 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters ({hasActiveFilters ? 'Active' : 'All'})</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider hidden sm:inline">Sort By:</span>
            <select
              value={sortParam}
              onChange={(e) => updateFilterParam('sort', e.target.value)}
              className="px-4 py-2 bg-white border border-pink-200 rounded-full text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#D92670] shadow-xs cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-pink-100">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#D92670]" /> Filter Catalog
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#D92670] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
            )}
          </div>

          {/* Category & Subcategory Filter */}
          <div className="p-4 bg-white rounded-2xl border border-pink-100 shadow-xs space-y-3 font-sans">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Grid2X2 className="w-3.5 h-3.5 text-[#D92670]" /> Category & Subcategory
              </span>
              {subCategoryParam !== 'All' && (
                <span className="text-[10px] font-mono text-[#D92670] font-bold bg-pink-50 px-2 py-0.5 rounded-full">
                  Sub: {subCategoryParam}
                </span>
              )}
            </h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => {
                  updateFilterParam('category', 'All');
                  updateFilterParam('subCategory', 'All');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer ${catParam === 'All'
                  ? 'bg-[#D92670] text-white shadow-xs'
                  : 'text-stone-700 hover:bg-pink-50'
                  }`}
              >
                <span>All Products</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${catParam === 'All' ? 'bg-white/20 text-white' : 'bg-pink-100 text-[#D92670]'
                  }`}>
                  {allCatalogProducts.length}
                </span>
              </button>

              {managedCategories.map((catObj) => {
                const catName = catObj.name;
                const isSelectedCat = catParam.toLowerCase() === catName.toLowerCase() || catParam.toLowerCase() === catObj.slug.toLowerCase();
                const catProductsCount = allCatalogProducts.filter(
                  (p) => (p.category || '').toLowerCase() === catName.toLowerCase() || (p.category || '').toLowerCase() === catObj.slug.toLowerCase()
                ).length;

                return (
                  <div key={catObj.id} className="space-y-1">
                    <button
                      onClick={() => {
                        updateFilterParam('category', isSelectedCat ? 'All' : catName);
                        updateFilterParam('subCategory', 'All');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer ${isSelectedCat
                        ? 'bg-[#D92670] text-white shadow-xs'
                        : 'text-stone-700 hover:bg-pink-50'
                        }`}
                    >
                      <span>{catName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelectedCat ? 'bg-white/20 text-white' : 'bg-pink-100 text-[#D92670]'
                        }`}>
                        {catProductsCount}
                      </span>
                    </button>

                    {/* Subcategories Tree (Expanded when category selected or active) */}
                    {isSelectedCat && catObj.subCategories.length > 0 && (
                      <div className="pl-3 space-y-1 py-1 border-l-2 border-[#D92670]/40 ml-3">
                        {catObj.subCategories.map((sub) => {
                          const isSelectedSub = subCategoryParam.toLowerCase() === sub.name.toLowerCase() || subCategoryParam.toLowerCase() === sub.slug.toLowerCase();
                          const subCount = allCatalogProducts.filter(
                            (p) => (p as any).subCategory?.toLowerCase() === sub.name.toLowerCase() || (p as any).subCategory?.toLowerCase() === sub.slug.toLowerCase()
                          ).length;

                          return (
                            <button
                              key={sub.id}
                              onClick={() => updateFilterParam('subCategory', isSelectedSub ? 'All' : sub.name)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${isSelectedSub
                                ? 'bg-[#9B050B] text-white'
                                : 'text-stone-600 hover:bg-stone-100'
                                }`}
                            >
                              <span>• {sub.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelectedSub ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700 font-mono'
                                }`}>
                                {subCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color Family Filter */}
          <div className="p-4 bg-white rounded-2xl border border-pink-100 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#D92670]" /> Color Family
              </span>
              <span className="text-[10px] text-pink-500 font-normal">{filteredColors.length} available</span>
            </h4>

            {activeProductColors.length > 5 && (
              <div className="relative">
                <input
                  type="text"
                  value={colorSearch}
                  onChange={(e) => setColorSearch(e.target.value)}
                  placeholder="Search colors..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-pink-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D92670]"
                />
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1 text-xs pr-1">
              <button
                onClick={() => updateFilterParam('color', 'All')}
                className={`w-full text-left px-3 py-1.5 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer ${colorParam === 'All'
                  ? 'bg-[#D92670] text-white shadow-xs'
                  : 'text-stone-700 hover:bg-pink-50'
                  }`}
              >
                <span>All Colors</span>
              </button>

              {filteredColors.map((col) => (
                <button
                  key={col.name}
                  onClick={() => updateFilterParam('color', col.name)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer ${colorParam.toLowerCase() === col.name.toLowerCase()
                    ? 'bg-[#D92670] text-white shadow-xs'
                    : 'text-stone-700 hover:bg-pink-50'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-inner" style={{ backgroundColor: col.hex }} />
                    <span>{col.name}</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colorParam.toLowerCase() === col.name.toLowerCase() ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                    }`}>
                    {col.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid Section */}
        <main className="lg:col-span-9 space-y-6">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-pink-100 p-8 space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto text-[#D92670]">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                No designs match your active filters
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try resetting your search query or color filters to discover more items.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-[#D92670] hover:bg-[#C2185B] text-white font-bold text-xs uppercase tracking-wider rounded-full transition-colors shadow-sm cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden flex justify-end">
          <div className="w-full max-w-xs bg-white h-full overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-pink-100">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-stone-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#D92670]" /> Catalog Filters
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">Category</h4>
                <div className="space-y-1 text-xs">
                  {['All', ...managedCategories.map((c) => c.name)].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        updateFilterParam('category', cat);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-bold ${catParam === cat ? 'bg-[#D92670] text-white' : 'bg-stone-50 text-stone-800'
                        }`}
                    >
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-pink-100 flex gap-2">
              <button
                onClick={() => {
                  handleResetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-3 bg-stone-100 text-stone-800 font-bold text-xs rounded-full"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-[#D92670] text-white font-bold text-xs rounded-full shadow-md"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Loading catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
