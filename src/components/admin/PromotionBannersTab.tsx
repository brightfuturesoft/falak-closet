'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  RefreshCw,
  AlertTriangle,
  Tag,
  Image as ImageIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PromotionBanner } from '@/lib/promotionBanners';
import { ImageUploader } from '@/components/ui/ImageUploader';

function toDatetimeLocal(isoString: string | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
    return localISOTime;
  } catch {
    return '';
  }
}

export function PromotionBannersTab() {
  const [banners, setBanners] = useState<PromotionBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionBanner | null>(null);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    discountBadge: '',
    code: '',
    bannerImage: '',
    categoryFilter: '',
    minSpend: '',
    isFlashSale: false,
    flashSaleEndsAt: '',
    terms: '',
    isActive: true,
    sortOrder: '0'
  });

  const fetchBanners = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/promotion-banners');
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
      } else {
        setLoadError(data.error || 'Failed to load promotion banners.');
      }
    } catch {
      setLoadError('Network error — failed to load promotion banners.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBanners();
  }, []);

  const handleOpenModal = (banner?: PromotionBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle,
        discountBadge: banner.discountBadge,
        code: banner.code || '',
        bannerImage: banner.bannerImage,
        categoryFilter: banner.categoryFilter || '',
        minSpend: banner.minSpend !== null ? String(banner.minSpend) : '',
        isFlashSale: banner.isFlashSale,
        flashSaleEndsAt: toDatetimeLocal(banner.flashSaleEndsAt),
        terms: banner.terms,
        isActive: banner.isActive,
        sortOrder: String(banner.sortOrder)
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        discountBadge: '',
        code: '',
        bannerImage: '',
        categoryFilter: '',
        minSpend: '',
        isFlashSale: false,
        flashSaleEndsAt: '',
        terms: '',
        isActive: true,
        sortOrder: '0'
      });
    }
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setActionError('Title is required.');
      return;
    }

    setIsSaving(true);
    setActionError(null);

    const payload = {
      id: editingBanner?.id,
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      discountBadge: formData.discountBadge.trim(),
      code: formData.code.trim() || null,
      bannerImage: formData.bannerImage.trim(),
      categoryFilter: formData.categoryFilter.trim() || null,
      minSpend: formData.minSpend !== '' ? Number(formData.minSpend) : null,
      isFlashSale: formData.isFlashSale,
      flashSaleEndsAt: formData.flashSaleEndsAt ? new Date(formData.flashSaleEndsAt).toISOString() : null,
      terms: formData.terms.trim(),
      isActive: formData.isActive,
      sortOrder: Number(formData.sortOrder) || 0
    };

    try {
      const url = '/api/promotion-banners';
      const method = editingBanner ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchBanners();
      } else {
        setActionError(data.error || 'Failed to save promotion banner.');
      }
    } catch {
      setActionError('Network error — failed to save promotion banner.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (banner: PromotionBanner) => {
    try {
      const res = await fetch('/api/promotion-banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id, isActive: !banner.isActive })
      });
      const data = await res.json();
      if (data.success) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
        );
      }
    } catch {
      console.error('Failed to toggle banner active state');
    }
  };

  const handleDeleteBanner = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`/api/promotion-banners?id=${deletingId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setBanners((prev) => prev.filter((b) => b.id !== deletingId));
        setDeletingId(null);
      } else {
        alert(data.error || 'Failed to delete banner.');
      }
    } catch {
      alert('Network error — failed to delete banner.');
    }
  };

  return (
    <div className="space-y-6 text-stone-900">
      {/* Header Info */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#D92670]" />
            <span>Storefront Promotion Banners</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Manage seasonal campaigns, flash sales, discount coupons, and card assets shown on the storefront banner slots.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-[#D92670] hover:bg-[#C2185B] text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-[11px] font-bold text-amber-800 flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0 text-amber-600 animate-pulse" />
        <span>💡 Changes go live within a minute (Next.js 16 incremental caching revalidation).</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-[#D92670] animate-spin" />
          <p className="text-xs text-stone-500 font-bold">Fetching promotional banners...</p>
        </div>
      ) : loadError ? (
        <div className="p-6 text-center bg-red-50 border border-red-200 text-red-800 rounded-3xl max-w-xl mx-auto space-y-2">
          <AlertTriangle className="w-8 h-8 mx-auto text-red-600" />
          <h4 className="font-bold text-sm">Failed to Load Banners</h4>
          <p className="text-xs">{loadError}</p>
          <button
            onClick={fetchBanners}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white dark:bg-stone-900 rounded-3xl border p-5 shadow-xs flex flex-col justify-between space-y-4 relative ${
                banner.isActive
                  ? 'border-stone-200 dark:border-stone-800 hover:border-[#D92670]/30'
                  : 'border-red-200 dark:border-red-900/50 opacity-85 bg-stone-50/50'
              }`}
            >
              <div className="space-y-3">
                {banner.bannerImage ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/50">
                    <img
                      src={banner.bannerImage}
                      alt={banner.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-2xl bg-stone-50 border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 gap-1">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] font-bold">No Image Banner Url</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 bg-pink-100 text-[#D92670] text-[9px] font-black rounded-lg uppercase tracking-wider">
                      {banner.discountBadge || 'Promo Offer'}
                    </span>
                    <span className="text-[9px] font-bold text-stone-400">Order: {banner.sortOrder}</span>
                  </div>
                  <h4 className="font-serif font-extrabold text-sm text-stone-900 dark:text-stone-100 leading-tight">
                    {banner.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">{banner.subtitle}</p>
                </div>

                <div className="pt-2.5 border-t border-stone-100 text-[10px] space-y-1.5 text-stone-600 font-medium">
                  {banner.code && (
                    <div className="flex justify-between">
                      <span>Coupon Code:</span>
                      <span className="font-mono font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                        {banner.code}
                      </span>
                    </div>
                  )}
                  {banner.categoryFilter && (
                    <div className="flex justify-between">
                      <span>Category Link:</span>
                      <span className="font-bold text-stone-900">{banner.categoryFilter}</span>
                    </div>
                  )}
                  {banner.minSpend !== null && (
                    <div className="flex justify-between">
                      <span>Min. Spend:</span>
                      <span className="font-bold text-stone-900">{formatCurrency(banner.minSpend)}</span>
                    </div>
                  )}
                  {banner.isFlashSale && (
                    <div className="flex items-center gap-1 text-[#D92670] font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Flash Sale Countdown Timer Active</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(banner)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl transition-colors cursor-pointer text-[10px] font-extrabold flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3 text-stone-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition-colors cursor-pointer ${
                      banner.isActive
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {banner.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setDeletingId(banner.id);
                    setDeletingTitle(banner.title);
                  }}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  title="Delete Banner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {banners.length === 0 && (
            <div className="col-span-full py-16 text-center text-stone-500 bg-white rounded-3xl border border-stone-200">
              <Megaphone className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p className="font-bold text-stone-700">No promotion banners found.</p>
              <p className="text-xs text-stone-400 mt-1">Create banners to display seasonal vouchers on /live-promotions.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-650">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              <h4 className="font-serif font-bold text-lg">Confirm Deletion</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently delete the promo banner <strong className="text-stone-900">&quot;{deletingTitle}&quot;</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBanner}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Delete Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full shadow-xl animate-scale-up my-8">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h4 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#D92670]" />
                <span>{editingBanner ? 'Edit Promo Banner' : 'Create Promo Banner'}</span>
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Banner Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eid & Monsoon Flash Sale"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Subtitle description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 25% Off across all Embroidered Abayas"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Discount Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FLAT 25% OFF"
                    value={formData.discountBadge}
                    onChange={(e) => setFormData({ ...formData, discountBadge: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FLASH25"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670] uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Banner Image URL
                </label>
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or /images/..."
                    value={formData.bannerImage}
                    onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                  />
                  <ImageUploader
                    folder="banners"
                    label="Upload to Cloudinary"
                    maxSizeMb={5}
                    onUploaded={(results) => {
                      if (results[0]?.url) {
                        setFormData((prev) => ({ ...prev, bannerImage: results[0].url }));
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-stone-400">
                  Paste a URL or upload directly — uploads land in Cloudinary and fill this field.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Category Deep-Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Abayas"
                    value={formData.categoryFilter}
                    onChange={(e) => setFormData({ ...formData, categoryFilter: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Minimum Spend (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={formData.minSpend}
                    onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-stone-100 pt-3">
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={formData.isFlashSale}
                    onChange={(e) => setFormData({ ...formData, isFlashSale: e.target.checked })}
                    className="w-4 h-4 text-[#D92670] border-stone-300 rounded focus:ring-[#D92670]"
                  />
                  <span className="text-xs font-bold text-stone-700">Is Flash Sale (Timer)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#D92670] border-stone-300 rounded focus:ring-[#D92670]"
                  />
                  <span className="text-xs font-bold text-stone-700">Banner Active</span>
                </label>
              </div>

              {formData.isFlashSale && (
                <div className="space-y-1.5 border border-pink-100 p-3 rounded-2xl bg-pink-50/20">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D92670] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 animate-spin" /> Flash Sale Ends At *
                  </label>
                  <input
                    type="datetime-local"
                    required={formData.isFlashSale}
                    value={formData.flashSaleEndsAt}
                    onChange={(e) => setFormData({ ...formData, flashSaleEndsAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Terms & Conditions
                </label>
                <textarea
                  placeholder="e.g. Valid on selected abayas & kaftans. Cannot be combined with other coupons."
                  rows={2}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-750 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#D92670] hover:bg-[#C2185B] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Banner</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
