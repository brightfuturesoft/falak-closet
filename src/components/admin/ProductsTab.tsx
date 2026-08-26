'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Grid,
  List,
  Edit,
  Trash2,
  Minus,
  Star
} from 'lucide-react';
import { Product } from '@/data/products';
import { useCategories } from '@/lib/useCategories';
import { formatCurrency } from '@/lib/utils';

interface ProductsTabProps {
  products: Product[];
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateStock: (id: string, newStock: number) => void;
  searchQuery: string;
}

export function ProductsTab({
  products,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduct,
  onUpdateStock,
  searchQuery
}: ProductsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [localQuery, setLocalQuery] = useState('');

  // Managed categories, plus any category a product actually carries — so a
  // product whose category was later renamed or deleted stays reachable here
  // instead of disappearing behind a pill that no longer exists.
  const { categories: managedCategories } = useCategories();
  const categoryPills = React.useMemo(() => {
    const names = managedCategories.map((c) => c.name);
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...names, ...fromProducts]));
  }, [managedCategories, products]);

  // Subcategories of the selected category, from the products in view.
  const subCategoryPills = React.useMemo(() => {
    if (selectedCategory === 'All') return [];
    const managed = managedCategories
      .find((c) => c.name === selectedCategory)
      ?.subCategories.map((s) => s.name) ?? [];
    const fromProducts = products
      .filter((p) => p.category === selectedCategory)
      .map((p) => p.subCategory)
      .filter((s): s is string => Boolean(s));
    return Array.from(new Set([...managed, ...fromProducts]));
  }, [managedCategories, products, selectedCategory]);

  const activeSearch = searchQuery || localQuery;

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedSubCategory !== 'All' && p.subCategory !== selectedSubCategory) return false;
    const stock = p.stock ?? 10;
    if (stockFilter === 'Low' && stock >= 5) return false;
    if (stockFilter === 'Out' && stock > 0) return false;
    if (stockFilter === 'In' && stock === 0) return false;

    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchCode = (p.code || '').toLowerCase().includes(q);
      const matchMaterial = (p.material || '').toLowerCase().includes(q);
      const matchWork = (p.workType || '').toLowerCase().includes(q);
      const matchColor = p.colors?.some((c) => c.name.toLowerCase().includes(q) || (c.hex && c.hex.toLowerCase().includes(q)));
      const matchVar = p.variations?.some((v) => v.colorName.toLowerCase().includes(q) || (v.colorHex && v.colorHex.toLowerCase().includes(q)) || (v.size && v.size.toLowerCase() === q));

      if (!matchName && !matchCategory && !matchCode && !matchMaterial && !matchWork && !matchColor && !matchVar) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-stone-900">
      {/* Top Action Bar */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto text-xs font-bold scrollbar-none">
            {['All', ...categoryPills].map((cat) => {
              const count = cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubCategory('All');
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white shadow-sm font-bold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] font-mono opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Right Actions: View Switch, Add Product Button */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-stone-100 border border-stone-200 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Add New Product Button */}
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Subcategory pills — only meaningful once a category is picked */}
        {subCategoryPills.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-200 text-[11px] font-bold scrollbar-none">
            <span className="text-stone-500 font-medium whitespace-nowrap pr-1">Subcategory:</span>
            {['All', ...subCategoryPills].map((sub) => {
              const count =
                sub === 'All'
                  ? products.filter((p) => p.category === selectedCategory).length
                  : products.filter((p) => p.category === selectedCategory && p.subCategory === sub).length;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedSubCategory === sub
                      ? 'bg-stone-800 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  <span>{sub}</span>
                  <span className="text-[10px] font-mono opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Secondary Filter: Search & Stock Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-200 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search title, work type, material..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-stone-600 font-medium">Stock Status:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-bold"
            >
              <option value="All">All Items</option>
              <option value="In">In Stock (&ge;5)</option>
              <option value="Low">Low Stock (&lt;5)</option>
              <option value="Out">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Mode 1: Table View */}
      {viewMode === 'table' && (
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-stone-500">
              Displaying <strong className="text-stone-900">{filteredProducts.length}</strong> items in inventory
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px]">
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Price (৳)</th>
                  <th className="pb-3 font-semibold">Stock Quantity</th>
                  <th className="pb-3 font-semibold">Fabric / Work</th>
                  <th className="pb-3 font-semibold">Rating</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filteredProducts.map((p) => {
                  const stock = p.stock ?? 10;
                  const isLow = stock < 5;
                  const isOut = stock === 0;

                  // Find matched color or variation if activeSearch query is present
                  let matchedVarPhoto: string | null = null;
                  let matchedVarColorName: string | null = null;
                  let matchedVarHex: string | null = null;

                  if (activeSearch.trim()) {
                    const q = activeSearch.toLowerCase().trim();
                    const cMatch = p.colors?.find((c) => c.name.toLowerCase().includes(q) || (c.hex && c.hex.toLowerCase().includes(q)));
                    if (cMatch) {
                      matchedVarColorName = cMatch.name;
                      matchedVarHex = cMatch.hex;
                      if ((cMatch as any).images && (cMatch as any).images.length > 0) {
                        matchedVarPhoto = (cMatch as any).images[0];
                      } else if (typeof cMatch.imageIndex === 'number' && p.images?.[cMatch.imageIndex]) {
                        matchedVarPhoto = p.images[cMatch.imageIndex];
                      }
                    } else {
                      const vMatch = p.variations?.find((v) => v.colorName.toLowerCase().includes(q) || (v.colorHex && v.colorHex.toLowerCase().includes(q)));
                      if (vMatch) {
                        matchedVarColorName = vMatch.colorName;
                        matchedVarHex = vMatch.colorHex || '#000000';
                        matchedVarPhoto = vMatch.imageUrl || p.images?.[0] || null;
                      }
                    }
                  }

                  const displayImg = matchedVarPhoto || p.images?.[0] || 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=300&q=80';

                  return (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 flex items-center gap-3">
                        <div className="w-12 h-14 relative rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-100 shadow-xs">
                          <Image
                            src={displayImg}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 max-w-[220px] truncate">{p.name}</p>

                          {/* Matched Variation Preview Badge */}
                          {matchedVarColorName && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0" style={{ backgroundColor: matchedVarHex || '#000' }} />
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300/60 px-1.5 py-0.2 rounded font-mono">
                                Match: {matchedVarColorName}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 pt-0.5 text-[10px] font-mono text-stone-500">
                            <span>ID: {p.id}</span>
                            <span>•</span>
                            <span className="text-stone-700 font-semibold">
                              {p.images?.length || 1} image(s)
                            </span>
                            {p.variations && p.variations.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold">
                                  {p.variations.length} vars
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <span className="px-2.5 py-1 bg-stone-100 border border-stone-200 rounded-lg text-[11px] font-semibold text-stone-800">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 font-mono font-bold text-stone-900">
                        {formatCurrency(p.price)}
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="block text-[10px] text-stone-400 line-through font-normal">
                            {formatCurrency(p.originalPrice)}
                          </span>
                        )}
                      </td>

                      {/* In-Line Stock Adjuster */}
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateStock(p.id, Math.max(0, stock - 1))}
                            className="p-1 bg-stone-100 border border-stone-200 rounded hover:bg-stone-200 text-stone-700"
                            title="Decrease Stock"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                              isOut
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {stock} pcs
                          </span>

                          <button
                            onClick={() => onUpdateStock(p.id, stock + 1)}
                            className="p-1 bg-stone-100 border border-stone-200 rounded hover:bg-stone-200 text-stone-700"
                            title="Increase Stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 text-stone-700 text-[11px]">
                        <p className="font-semibold text-stone-900">{p.material || 'Nida Silk'}</p>
                        <p className="text-[10px] text-stone-500">{p.workType || 'Embroidery'}</p>
                      </td>

                      <td className="py-3 text-stone-700 font-mono text-[11px]">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="font-bold text-stone-900">{p.rating || 5.0}</span>
                        </div>
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenEditModal(p)}
                            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-500">
                      No products match your criteria. Click "Add New Product" to create one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Mode 2: Grid Card View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const stock = p.stock ?? 10;
            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:border-stone-400 transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] bg-stone-100">
                  <Image
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80'}
                    alt={p.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 border border-stone-200 rounded-full text-[10px] font-bold text-stone-900">
                    {p.category}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-stone-900 rounded-full text-[10px] font-mono font-bold text-white">
                    Stock: {stock}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{p.name}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">{p.material} • {p.workType}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="font-mono text-base font-black text-stone-900">
                      {formatCurrency(p.price)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenEditModal(p)}
                        className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
