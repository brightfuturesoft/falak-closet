'use client';

import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Sparkles,
  Shirt,
  ShoppingBag,
  Layers,
  Tag,
  Gift,
  Heart,
  Package,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { Category } from '@/data/categories';
import { useCategories, notifyCategoriesUpdated } from '@/lib/useCategories';
import { taxonomyMatches } from '@/lib/utils';
import { Product } from '@/data/products';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface CategoriesTabProps {
  products?: Product[];
  onRefreshProducts?: () => Promise<void>;
}

export function CategoriesTab({ products = [], onRefreshProducts }: CategoriesTabProps) {
  const { categories, isLoading, error: loadError, reload: loadCategories } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'category' | 'occasion'>('all');

  /** Error from the most recent create/update/delete, shown in-place. */
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete Modal State
  const [deletingTarget, setDeletingTarget] = useState<{ id: string; name: string } | null>(null);

  // Category Form State
  const [catFormData, setCatFormData] = useState({
    name: '',
    slug: '',
    type: 'category' as 'category' | 'occasion',
    icon: 'Tag',
    description: '',
    image: '',
    isFeatured: true
  });

  const availableIcons = [
    { name: 'Shirt', icon: Shirt, label: 'Clothing' },
    { name: 'Sparkles', icon: Sparkles, label: 'Hijabs & Glam' },
    { name: 'ShoppingBag', icon: ShoppingBag, label: 'Dresses' },
    { name: 'Layers', icon: Layers, label: 'Co-ords & Sets' },
    { name: 'Tag', icon: Tag, label: 'Kurtis & Tunics' },
    { name: 'Gift', icon: Gift, label: 'Accessories' },
    { name: 'Heart', icon: Heart, label: 'Occasions' }
  ];

  const mutateCategories = async (
    init: RequestInit & { url?: string }
  ): Promise<boolean> => {
    const { url = '/api/categories', ...requestInit } = init;
    setIsSaving(true);
    setActionError(null);

    try {
      const res = await fetch(url, requestInit);
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setActionError(data?.error ?? `Request failed (HTTP ${res.status})`);
        return false;
      }

      await loadCategories();
      notifyCategoriesUpdated();
      await onRefreshProducts?.();
      return true;
    } catch (err) {
      setActionError((err as Error).message || 'Network error — category not saved');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Categories by Search Query & Type Filter
  const filteredCategories = categories.filter((cat) => {
    const catType = cat.type || 'category';
    if (selectedTypeFilter !== 'all' && catType !== selectedTypeFilter) {
      return false;
    }
    const matchName = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSlug = cat.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchName || matchSlug;
  });

  // Total Metrics Calculations
  const mainCategoriesCount = categories.filter((c) => (!c.type || c.type === 'category')).length;
  const occasionsCount = categories.filter((c) => c.type === 'occasion').length;
  const totalMappedProducts = products.length;

  // Open Create/Edit Category Modal
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatFormData({
        name: cat.name,
        slug: cat.slug,
        type: (cat.type as 'category' | 'occasion') || 'category',
        icon: cat.icon || 'Tag',
        description: cat.description || '',
        image: cat.image || '',
        isFeatured: Boolean(cat.isFeatured)
      });
    } else {
      setEditingCategory(null);
      setCatFormData({
        name: '',
        slug: '',
        type: 'category',
        icon: 'Tag',
        description: '',
        image: '',
        isFeatured: true
      });
    }
    setActionError(null);
    setIsCategoryModalOpen(true);
  };

  // Handle Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.name.trim()) return;

    const payload = {
      id: editingCategory?.id,
      name: catFormData.name.trim(),
      slug: catFormData.slug.trim() || catFormData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: catFormData.type,
      icon: catFormData.icon,
      description: catFormData.description.trim(),
      image: catFormData.image.trim(),
      isFeatured: catFormData.isFeatured
    };

    const ok = await mutateCategories({
      method: editingCategory ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        editingCategory
          ? { ...payload, isSubcategory: false }
          : { ...payload, action: 'create_category' }
      )
    });

    if (ok) setIsCategoryModalOpen(false);
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;

    const params = new URLSearchParams({
      id: deletingTarget.id,
      type: 'category'
    });

    const ok = await mutateCategories({
      url: `/api/categories?${params.toString()}`,
      method: 'DELETE'
    });

    if (ok) setDeletingTarget(null);
  };

  /** One-click seed of default categories */
  const handleSeedDefaults = async () => {
    await mutateCategories({ url: '/api/categories/seed', method: 'POST' });
  };

  return (
    <div className="space-y-6 text-stone-900 font-sans">

      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#9B050B]/10 text-[#9B050B] rounded-xl font-bold">
              <FolderTree className="w-5 h-5" />
            </span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
              Category & Occasion Management
            </h2>
          </div>
          <p className="text-xs text-stone-500 font-sans">
            Manage your store taxonomy dynamically — create Main Categories and Occasions synced across storefront filters & forms.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadCategories}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all border border-stone-200 cursor-pointer"
            title="Refresh Taxonomy Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenCategoryModal()}
            className="px-5 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F2C76E]" />
            <span>Add Category / Occasion</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {(loadError || actionError) && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-rose-900">
              {actionError ? 'Could not save changes' : 'Could not load categories'}
            </p>
            <p className="text-rose-700 mt-0.5 font-mono">{actionError || loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="p-1 text-rose-500 hover:text-rose-800 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">Main Categories</span>
            <h3 className="text-2xl font-black text-stone-900 mt-1">{mainCategoriesCount}</h3>
          </div>
          <div className="p-3 bg-[#FDF2F3] text-[#9B050B] rounded-2xl border border-[#F8D2D5]">
            <Shirt className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">Dynamic Occasions</span>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{occasionsCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100">
            <Heart className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">Mapped Products</span>
            <h3 className="text-2xl font-black text-emerald-800 mt-1">{totalMappedProducts}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories or occasions by name or slug..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 shadow-xs font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTypeFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('category')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTypeFilter === 'category'
                ? 'bg-[#9B050B] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Categories ({mainCategoriesCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('occasion')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTypeFilter === 'occasion'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Occasions ({occasionsCount})
          </button>
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCategories.map((cat) => {
          const isOccasion = cat.type === 'occasion';
          const categoryProductsCount = products.filter(
            (p) =>
              isOccasion
                ? taxonomyMatches(p.occasion, cat.name)
                : (p.category || '').toLowerCase() === cat.name.toLowerCase() || (p.category || '').toLowerCase() === cat.slug.toLowerCase()
          ).length;

          return (
            <div
              key={cat.id}
              className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs transition-all hover:shadow-md hover:border-stone-300 flex flex-col justify-between"
            >
              {/* Category Card Header */}
              <div className="space-y-3">
                {cat.image ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/60">
                    <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl border ${
                      isOccasion
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-[#FFFBF0] border-[#F2C76E]/60 text-[#9B050B]'
                    }`}>
                      {isOccasion ? (
                        <Heart className="w-5 h-5 text-amber-700" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-[#9B050B]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-extrabold text-base sm:text-lg text-stone-900">
                          {cat.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-md uppercase ${
                          isOccasion
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {isOccasion ? 'Occasion' : 'Category'}
                        </span>
                        {cat.isFeatured && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-mono font-bold rounded-md uppercase">
                            Featured
                          </span>
                        )}
                      </div>
                      {!isOccasion && (
                        <p className="text-[11px] font-mono text-stone-400 font-bold">
                          /{cat.slug}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                      title="Edit Category / Occasion"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTarget({ id: cat.id, name: cat.name })}
                      className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              {/* Category Card Footer Status */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-mono text-stone-500">
                <span>Products Mapped:</span>
                <span className="font-black text-[#9B050B] bg-[#FDF2F3] px-2.5 py-1 rounded-lg border border-[#F8D2D5]">
                  {categoryProductsCount} Items
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty States */}
      {!isLoading && categories.length === 0 && !loadError && (
        <div className="p-10 bg-white border border-dashed border-stone-300 rounded-3xl text-center space-y-3">
          <FolderTree className="w-8 h-8 text-stone-300 mx-auto" />
          <div>
            <h3 className="font-bold text-sm text-stone-900">No categories or occasions in the database yet</h3>
            <p className="text-xs text-stone-500 mt-1">
              Create your first Category or Occasion, or seed default categories to get started.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isSaving}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? 'Seeding…' : 'Seed Default Categories'}
          </button>
        </div>
      )}

      {!isLoading && categories.length > 0 && filteredCategories.length === 0 && (
        <div className="p-10 bg-white border border-dashed border-stone-300 rounded-3xl text-center">
          <p className="text-xs text-stone-500">
            No items match your search criteria.
          </p>
        </div>
      )}

      {/* Category / Occasion Modal (Create / Edit) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl relative text-stone-900 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-3 border-b border-stone-200 shrink-0">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {editingCategory ? 'Edit Taxonomy Item' : 'Create New Taxonomy Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 bg-stone-100 rounded-xl text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs font-sans flex-1 overflow-y-auto">
              
              {/* Type Selection: Category vs Occasion */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Taxonomy Type *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setCatFormData({ ...catFormData, type: 'category' })}
                    className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      catFormData.type === 'category'
                        ? 'bg-[#9B050B] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Shirt className="w-4 h-4" />
                    <span>Category</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatFormData({ ...catFormData, type: 'occasion' })}
                    className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      catFormData.type === 'occasion'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>Occasion</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">
                  {catFormData.type === 'occasion' ? 'Occasion Name *' : 'Category Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({
                    ...catFormData,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  })}
                  placeholder={catFormData.type === 'occasion' ? 'e.g. Party Wear or Festive & Eid' : 'e.g. Abayas or Luxury Tunics'}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              {catFormData.type === 'category' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={catFormData.slug}
                    onChange={(e) => setCatFormData({ ...catFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                    placeholder="abayas"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Cover Image</label>
                <div className="flex items-center gap-3 pt-1">
                  {catFormData.image ? (
                    <div className="relative w-20 h-20 rounded-2xl border border-stone-300 overflow-hidden bg-stone-100 group shrink-0 shadow-xs">
                      <img
                        src={catFormData.image}
                        alt="Category Cover Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setCatFormData((prev) => ({ ...prev, image: '' }))}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-xs"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}

                  <ImageUploader
                    folder="categories"
                    label={catFormData.image ? 'Change Cover Image' : 'Upload Cover Image'}
                    onUploaded={(res) => {
                      if (res[0]?.url) setCatFormData((prev) => ({ ...prev, image: res[0].url }));
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Description</label>
                <textarea
                  rows={2}
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  placeholder="Short description for storefront cards..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cat-featured"
                  checked={catFormData.isFeatured}
                  onChange={(e) => setCatFormData({ ...catFormData, isFeatured: e.target.checked })}
                  className="w-4 h-4 accent-[#9B050B] rounded cursor-pointer"
                />
                <label htmlFor="cat-featured" className="font-bold text-stone-800 cursor-pointer">
                  Feature on Storefront Home Page
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#9B050B] hover:bg-[#B8000A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  {isSaving ? 'Saving…' : editingCategory ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-sm w-full max-h-[90vh] flex flex-col p-6 space-y-4 shadow-2xl relative text-stone-900 text-center overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-stone-900">
                Delete Taxonomy Item?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-stone-900">"{deletingTarget.name}"</span>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTarget(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                {isSaving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
