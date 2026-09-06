'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Image as ImageIcon,
  Zap,
  Search,
  CheckCircle2,
  Layers,
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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'stone',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'stone' | 'amber' | 'emerald' | 'rose' | 'blue';
}) {
  const tones = {
    stone: 'bg-stone-100 text-stone-700 border-stone-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-[#A80C14] border-rose-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  } as const;

  return (
    <div className="p-4 sm:p-5 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2 hover:border-stone-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className={`w-8 h-8 rounded-xl border flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-mono font-bold text-xl sm:text-2xl text-stone-900 leading-none">{value}</p>
      {sub && <p className="text-[10px] text-stone-500 font-medium truncate">{sub}</p>}
    </div>
  );
}

export function PromotionBannersTab() {
  const [banners, setBanners] = useState<PromotionBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Flash Sale' | 'Inactive'>('All');

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
    sortOrder: '0',
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
    fetchBanners();
  }, []);

  // ─── KPI Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = banners.length;
    const active = banners.filter((b) => b.isActive).length;
    const flashSales = banners.filter((b) => b.isFlashSale).length;
    const withCoupon = banners.filter((b) => Boolean(b.code)).length;
    return { total, active, flashSales, withCoupon };
  }, [banners]);

  // ─── Filtered Banners ──────────────────────────────────────────────────────
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchSub = b.subtitle.toLowerCase().includes(q);
        const matchCode = (b.code || '').toLowerCase().includes(q);
        const matchBadge = (b.discountBadge || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSub && !matchCode && !matchBadge) return false;
      }

      if (filter === 'Active') return b.isActive;
      if (filter === 'Flash Sale') return b.isFlashSale;
      if (filter === 'Inactive') return !b.isActive;
      return true;
    });
  }, [banners, searchQuery, filter]);

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
        sortOrder: String(banner.sortOrder),
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
        sortOrder: '0',
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
      sortOrder: Number(formData.sortOrder) || 0,
    };

    try {
      const url = '/api/promotion-banners';
      const method = editingBanner ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        body: JSON.stringify({ id: banner.id, isActive: !banner.isActive }),
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
        method: 'DELETE',
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
    <div className="space-y-6 text-stone-900 font-sans">
      {/* ── Action Bar Header ── */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#A80C14]" />
            <span>Storefront Promotion Banners</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Manage storefront marketing banners, flash sales countdown timers, seasonal offers, and landing page campaign cards.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4.5 py-2.5 bg-[#A80C14] hover:bg-[#8C0A10] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle2}
          label="Active Banners"
          value={`${stats.active} / ${stats.total}`}
          sub="Live campaign slots on site"
          tone="emerald"
        />
        <StatCard
          icon={Zap}
          label="Flash Sales"
          value={stats.flashSales}
          sub="Countdown sale banners"
          tone="rose"
        />
        <StatCard
          icon={Tag}
          label="Coupon Banners"
          value={stats.withCoupon}
          sub="Banners with discount codes"
          tone="blue"
        />
        <StatCard
          icon={Layers}
          label="Total Banners"
          value={stats.total}
          sub="Marketing banner slots"
          tone="stone"
        />
      </div>

      {/* ── Toolbar: Search & Filter Chips ── */}
      <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search banner title or code..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14] transition-all placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar">
          {(['All', 'Active', 'Flash Sale', 'Inactive'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? banners.length
                : tab === 'Active'
                ? banners.filter((b) => b.isActive).length
                : tab === 'Flash Sale'
                ? banners.filter((b) => b.isFlashSale).length
                : banners.filter((b) => !b.isActive).length;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filter === tab
                    ? 'bg-stone-900 text-white shadow-xs font-bold'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                <span>{tab}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white rounded-3xl border border-stone-200">
          <RefreshCw className="w-7 h-7 text-[#A80C14] animate-spin" />
          <p className="text-xs text-stone-500 font-bold">Loading promotion banners...</p>
        </div>
      ) : loadError ? (
        <div className="p-6 text-center bg-red-50 border border-red-200 text-red-800 rounded-3xl max-w-xl mx-auto space-y-2">
          <AlertTriangle className="w-7 h-7 mx-auto text-red-600" />
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
          {filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between space-y-4 relative ${
                banner.isActive
                  ? 'border-stone-200 hover:border-[#A80C14]/30'
                  : 'border-red-200 opacity-80 bg-stone-50/50'
              }`}
            >
              <div className="space-y-3">
                {banner.bannerImage ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/60">
                    <img
                      src={banner.bannerImage}
                      alt={banner.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-36 rounded-2xl bg-stone-50 border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 gap-1">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] font-bold">No Image Banner URL</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-[#FDF2F3] text-[#A80C14] border border-[#F8D2D5] text-[9px] font-extrabold rounded-lg uppercase tracking-wider">
                      {banner.discountBadge || 'Promo Offer'}
                    </span>
                    <span className="text-[9px] font-bold text-stone-400">Sort: #{banner.sortOrder}</span>
                  </div>
                  <h4 className="font-serif font-extrabold text-base text-stone-900 leading-tight pt-1">
                    {banner.title}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">{banner.subtitle}</p>
                </div>

                <div className="pt-2.5 border-t border-stone-100 text-xs space-y-1.5 text-stone-600 font-medium">
                  {banner.code && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Coupon Code:</span>
                      <span className="font-mono font-bold text-[#0D153A] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {banner.code}
                      </span>
                    </div>
                  )}
                  {banner.categoryFilter && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Category Link:</span>
                      <span className="font-bold text-stone-900">{banner.categoryFilter}</span>
                    </div>
                  )}
                  {banner.minSpend !== null && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Min Spend:</span>
                      <span className="font-bold text-stone-900">{formatCurrency(banner.minSpend)}</span>
                    </div>
                  )}
                  {banner.isFlashSale && (
                    <div className="flex items-center gap-1.5 text-[#A80C14] font-bold text-[11px] pt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Flash Sale Countdown Active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(banner)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-stone-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
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
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredBanners.length === 0 && (
            <div className="col-span-full py-16 text-center text-stone-500 bg-white rounded-3xl border border-stone-200 p-6 space-y-2">
              <Megaphone className="w-8 h-8 mx-auto text-stone-300" />
              <p className="font-bold text-stone-700">No promotion banners found.</p>
              <p className="text-xs text-stone-400">Click "Add New Banner" or adjust your search filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-650">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h4 className="font-serif font-bold text-lg text-stone-900">Confirm Deletion</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently delete the banner <strong className="text-stone-900">&quot;{deletingTitle}&quot;</strong>? This action cannot be undone.
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
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
              <h4 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#A80C14]" />
                <span>{editingBanner ? 'Edit Promo Banner' : 'Create Promo Banner'}</span>
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 flex-1 overflow-y-auto bg-white">
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
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
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
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
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
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
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
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14] uppercase"
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
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
                  />
                  <ImageUploader
                    folder="banners"
                    label="Upload Image"
                    maxSizeMb={5}
                    onUploaded={(results) => {
                      if (results[0]?.url) {
                        setFormData((prev) => ({ ...prev, bannerImage: results[0].url }));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Category Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Abayas"
                    value={formData.categoryFilter}
                    onChange={(e) => setFormData({ ...formData, categoryFilter: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
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
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-stone-100 pt-3">
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={formData.isFlashSale}
                    onChange={(e) => setFormData({ ...formData, isFlashSale: e.target.checked })}
                    className="w-4 h-4 text-[#A80C14] border-stone-300 rounded focus:ring-[#A80C14]"
                  />
                  <span className="text-xs font-bold text-stone-700">Is Flash Sale (Timer)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#A80C14] border-stone-300 rounded focus:ring-[#A80C14]"
                  />
                  <span className="text-xs font-bold text-stone-700">Banner Active</span>
                </label>
              </div>

              {formData.isFlashSale && (
                <div className="space-y-1.5 border border-[#F8D2D5] p-3 rounded-2xl bg-[#FDF2F3]">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#A80C14] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Flash Sale Ends At *
                  </label>
                  <input
                    type="datetime-local"
                    required={formData.isFlashSale}
                    value={formData.flashSaleEndsAt}
                    onChange={(e) => setFormData({ ...formData, flashSaleEndsAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
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
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
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
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#A80C14] hover:bg-[#8C0A10] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
