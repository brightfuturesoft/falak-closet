'use client';

import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Sparkles,
  Shirt,
  ShoppingBag,
  Layers,
  Tag,
  Gift,
  ChevronRight,
  Package,
  Layers3,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Category, SubCategory } from '@/data/categories';
import { useCategories, notifyCategoriesUpdated } from '@/lib/useCategories';
import { Product } from '@/data/products';

interface CategoriesTabProps {
  products?: Product[];
  onRefreshProducts?: () => Promise<void>;
}

// `products` defaults to empty, never to the seed array: a per-category count
// backed by demo data would tell the admin a category is in use when it is not.
export function CategoriesTab({ products = [], onRefreshProducts }: CategoriesTabProps) {
  const { categories, isLoading, error: loadError, reload: loadCategories } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');

  /** Error from the most recent create/update/delete, shown in-place. */
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<{ sub: SubCategory; parentId: string } | null>(null);
  const [presetParentCategoryId, setPresetParentCategoryId] = useState<string>('');

  // Delete Modal State
  const [deletingTarget, setDeletingTarget] = useState<{ id: string; name: string; isSubcategory: boolean; parentId?: string } | null>(null);

  // Category Form State
  const [catFormData, setCatFormData] = useState({
    name: '',
    slug: '',
    icon: 'Tag',
    description: '',
    isFeatured: true
  });

  // Subcategory Form State
  const [subFormData, setSubFormData] = useState({
    parentCategoryId: '',
    name: '',
    slug: '',
    description: ''
  });

  const availableIcons = [
    { name: 'Shirt', icon: Shirt, label: 'Clothing' },
    { name: 'Sparkles', icon: Sparkles, label: 'Hijabs & Glam' },
    { name: 'ShoppingBag', icon: ShoppingBag, label: 'Dresses' },
    { name: 'Layers', icon: Layers, label: 'Co-ords & Sets' },
    { name: 'Tag', icon: Tag, label: 'Kurtis & Tunics' },
    { name: 'Gift', icon: Gift, label: 'Accessories' }
  ];

  /**
   * Single write path to /api/categories. `fetch` resolves for 4xx/5xx too, so the
   * response body has to be inspected — otherwise a rejected write looks like a success.
   */
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

  // Filter Categories by Search Query
  const filteredCategories = categories.filter((cat) => {
    const matchName = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSlug = cat.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSub = cat.subCategories.some((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || sub.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchName || matchSlug || matchSub;
  });

  // Total Metrics Calculations
  const totalCategoriesCount = categories.length;
  const totalSubcategoriesCount = categories.reduce((sum, c) => sum + (c.subCategories?.length || 0), 0);
  const totalMappedProducts = products.length;

  // Open Create/Edit Category Modal
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatFormData({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon || 'Tag',
        description: cat.description || '',
        isFeatured: Boolean(cat.isFeatured)
      });
    } else {
      setEditingCategory(null);
      setCatFormData({
        name: '',
        slug: '',
        icon: 'Tag',
        description: '',
        isFeatured: true
      });
    }
    setActionError(null);
    setIsCategoryModalOpen(true);
  };

  // Open Create/Edit Subcategory Modal
  const handleOpenSubcategoryModal = (sub?: SubCategory, parentId?: string) => {
    const parentIdToUse = parentId || (categories[0]?.id || '');
    if (sub && parentId) {
      setEditingSubcategory({ sub, parentId });
      setSubFormData({
        parentCategoryId: parentId,
        name: sub.name,
        slug: sub.slug,
        description: sub.description || ''
      });
    } else {
      setEditingSubcategory(null);
      setSubFormData({
        parentCategoryId: parentIdToUse,
        name: '',
        slug: '',
        description: ''
      });
    }
    setActionError(null);
    setIsSubcategoryModalOpen(true);
  };

  // Handle Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.name.trim()) return;

    const payload = {
      id: editingCategory?.id,
      name: catFormData.name.trim(),
      slug: catFormData.slug.trim() || catFormData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: catFormData.icon,
      description: catFormData.description.trim(),
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

  // Handle Save Subcategory
  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subFormData.name.trim() || !subFormData.parentCategoryId) return;

    const payload = {
      id: editingSubcategory?.sub.id,
      parentCategoryId: subFormData.parentCategoryId,
      name: subFormData.name.trim(),
      slug: subFormData.slug.trim() || subFormData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: subFormData.description.trim()
    };

    const ok = await mutateCategories({
      method: editingSubcategory ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        editingSubcategory
          ? { ...payload, isSubcategory: true }
          : { ...payload, action: 'create_subcategory' }
      )
    });

    if (ok) setIsSubcategoryModalOpen(false);
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;

    const params = new URLSearchParams({
      id: deletingTarget.id,
      type: deletingTarget.isSubcategory ? 'subcategory' : 'category'
    });
    if (deletingTarget.parentId) params.set('parentId', deletingTarget.parentId);

    const ok = await mutateCategories({
      url: `/api/categories?${params.toString()}`,
      method: 'DELETE'
    });

    if (ok) setDeletingTarget(null);
  };

  /** One-click seed of INITIAL_CATEGORIES for a fresh database. */
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
              Category & Subcategory Management
            </h2>
          </div>
          <p className="text-xs text-stone-500 font-sans">
            Full CRUD category taxonomy synced live with products, admin forms, and storefront navigation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadCategories}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all border border-stone-200 cursor-pointer"
            title="Refresh Taxonomy Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleOpenSubcategoryModal()}
            className="px-4 py-2.5 bg-white border border-stone-300 hover:border-stone-900 text-stone-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#9B050B]" />
            <span>Add Subcategory</span>
          </button>

          <button
            onClick={() => handleOpenCategoryModal()}
            className="px-5 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F2C76E]" />
            <span>Add Main Category</span>
          </button>
        </div>
      </div>

      {/* Error Banner — load or mutation failure */}
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
            <h3 className="text-2xl font-black text-stone-900 mt-1">{totalCategoriesCount}</h3>
          </div>
          <div className="p-3 bg-[#FDF2F3] text-[#9B050B] rounded-2xl border border-[#F8D2D5]">
            <Shirt className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">Subcategories</span>
            <h3 className="text-2xl font-black text-stone-900 mt-1">{totalSubcategoriesCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100">
            <Layers3 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">Mapped Products</span>
            <h3 className="text-2xl font-black text-stone-900 mt-1">{totalMappedProducts}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories or subcategories by name or slug..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 shadow-xs font-sans"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-3.5 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCategories.map((cat) => {
          const categoryProductsCount = products.filter(
            (p) => (p.category || '').toLowerCase() === cat.name.toLowerCase() || (p.category || '').toLowerCase() === cat.slug.toLowerCase()
          ).length;

          return (
            <div
              key={cat.id}
              className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs transition-all hover:shadow-md hover:border-stone-300 flex flex-col justify-between"
            >
              {/* Category Card Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 text-[#9B050B] rounded-2xl">
                      <Sparkles className="w-5 h-5 text-[#9B050B]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-extrabold text-base sm:text-lg text-stone-900">
                          {cat.name}
                        </h3>
                        {cat.isFeatured && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-mono font-bold rounded-md uppercase">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-stone-400 font-bold">
                        /{cat.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                      title="Edit Main Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingTarget({ id: cat.id, name: cat.name, isSubcategory: false })}
                      className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Category"
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

                {/* Subcategories List Header */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1">
                    <span>Subcategories</span>
                    <span className="px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded-full text-[10px]">
                      {cat.subCategories.length}
                    </span>
                  </span>

                  <button
                    onClick={() => handleOpenSubcategoryModal(undefined, cat.id)}
                    className="text-[11px] font-extrabold text-[#9B050B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subcategory</span>
                  </button>
                </div>

                {/* Subcategory Pills Grid */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {cat.subCategories.length > 0 ? (
                    cat.subCategories.map((sub) => {
                      const subProductsCount = products.filter(
                        (p) => (p as any).subCategory?.toLowerCase() === sub.name.toLowerCase() || (p as any).subCategory?.toLowerCase() === sub.slug.toLowerCase()
                      ).length;

                      return (
                        <div
                          key={sub.id}
                          className="group/sub flex items-center gap-2 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-2xl text-xs font-medium text-stone-800 transition-all shadow-2xs"
                        >
                          <span className="font-bold">{sub.name}</span>
                          <span className="px-1.5 py-0.5 bg-white border border-stone-200 rounded-full font-mono text-[9px] font-bold text-stone-600">
                            {subProductsCount}
                          </span>

                          <div className="hidden group-hover/sub:flex items-center gap-1 ml-1 border-l border-stone-300 pl-1.5">
                            <button
                              onClick={() => handleOpenSubcategoryModal(sub, cat.id)}
                              className="text-stone-500 hover:text-stone-900"
                              title="Edit Subcategory"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeletingTarget({ id: sub.id, name: sub.name, isSubcategory: true, parentId: cat.id })}
                              className="text-rose-500 hover:text-rose-700"
                              title="Delete Subcategory"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-stone-400 italic">No subcategories created yet. Click "+ Add Subcategory" to create one.</span>
                  )}
                </div>
              </div>

              {/* Category Card Footer Status */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-mono text-stone-500">
                <span>Products in Category:</span>
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
            <h3 className="font-bold text-sm text-stone-900">No categories in the database yet</h3>
            <p className="text-xs text-stone-500 mt-1">
              Create your first category, or seed the six default Falak Closet categories to get started.
            </p>
          </div>
          <button
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
            No categories match <span className="font-bold text-stone-900">&ldquo;{searchQuery}&rdquo;</span>.
          </p>
        </div>
      )}

      {/* 1. Category Modal (Create / Edit) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {editingCategory ? 'Edit Main Category' : 'Create New Main Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 bg-stone-100 rounded-xl text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({
                    ...catFormData,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  })}
                  placeholder="e.g. Abayas or Luxury Tunics"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Category URL Slug</label>
                <input
                  type="text"
                  required
                  value={catFormData.slug}
                  onChange={(e) => setCatFormData({ ...catFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                  placeholder="abayas"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Description</label>
                <textarea
                  rows={3}
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  placeholder="Short description for storefront category cards..."
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
                  Feature in Home Page Header & Quick Cards
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#9B050B] hover:bg-[#B8000A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  {isSaving ? 'Saving…' : editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Subcategory Modal (Create / Edit) */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {editingSubcategory ? 'Edit Subcategory' : 'Create New Subcategory'}
              </h3>
              <button
                onClick={() => setIsSubcategoryModalOpen(false)}
                className="p-1.5 bg-stone-100 rounded-xl text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Parent Main Category *</label>
                <select
                  value={subFormData.parentCategoryId}
                  onChange={(e) => setSubFormData({ ...subFormData, parentCategoryId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  value={subFormData.name}
                  onChange={(e) => setSubFormData({
                    ...subFormData,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  })}
                  placeholder="e.g. Front Open Abayas or Crinkle Hijabs"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">URL Slug</label>
                <input
                  type="text"
                  required
                  value={subFormData.slug}
                  onChange={(e) => setSubFormData({ ...subFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                  placeholder="front-open-abayas"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Description</label>
                <textarea
                  rows={2}
                  value={subFormData.description}
                  onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
                  placeholder="Optional subcategory description..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsSubcategoryModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#9B050B] hover:bg-[#B8000A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  {isSaving ? 'Saving…' : editingSubcategory ? 'Update Subcategory' : 'Save Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-stone-900 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-stone-900">
                Delete {deletingTarget.isSubcategory ? 'Subcategory' : 'Main Category'}?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-stone-900">"{deletingTarget.name}"</span>? Products mapped to this item will remain intact under uncategorized.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingTarget(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
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
