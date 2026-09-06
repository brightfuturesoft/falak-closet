'use client';

import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Copy,
  Check,
  Trash2,
  Edit3,
  Power,
  Clock,
  Search,
  Grid,
  List,
  TrendingUp,
  AlertCircle,
  ArrowUpDown,
  Ticket,
  Zap,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PromoVoucherData } from './PromoFormModal';

interface PromotionsTabProps {
  promotions: PromoVoucherData[];
  onOpenAddPromoModal: () => void;
  onOpenEditPromoModal: (promo: PromoVoucherData) => void;
  onToggleStatus: (promo: PromoVoucherData) => void;
  onDeletePromo: (id: string, code: string) => void;
}

type FilterTab = 'All' | 'Active' | 'Percentage' | 'Fixed' | 'Expired' | 'Disabled';
type SortOption = 'expiry' | 'discount' | 'used' | 'code';
type ViewMode = 'grid' | 'table';

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

export function PromotionsTab({
  promotions,
  onOpenAddPromoModal,
  onOpenEditPromoModal,
  onToggleStatus,
  onDeletePromo,
}: PromotionsTabProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterTab>('All');
  const [sortBy, setSortBy] = useState<SortOption>('expiry');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const isExpired = (promo: PromoVoucherData) => {
    return Boolean(promo.expiryDate && new Date(promo.expiryDate) < new Date());
  };

  const handleCopy = (code: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textarea);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ─── KPI Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = promotions.length;
    const active = promotions.filter((p) => p.status === 'Active' && !isExpired(p)).length;
    const redemptions = promotions.reduce((sum, p) => sum + (p.usedCount ?? 0), 0);
    const expiringOrMaxed = promotions.filter((p) => {
      const exp = isExpired(p);
      const limitReached = p.usageLimit > 0 && (p.usedCount ?? 0) >= p.usageLimit;
      return exp || limitReached;
    }).length;

    return { total, active, redemptions, expiringOrMaxed };
  }, [promotions]);

  // ─── Filtered & Sorted Promotions ──────────────────────────────────────────
  const filteredPromotions = useMemo(() => {
    return promotions
      .filter((promo) => {
        const expired = isExpired(promo);

        // Search match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCode = promo.code.toLowerCase().includes(q);
          const matchType = promo.discountType.toLowerCase().includes(q);
          if (!matchCode && !matchType) return false;
        }

        // Category Filter
        if (filter === 'Active') return promo.status === 'Active' && !expired;
        if (filter === 'Percentage') return promo.discountType === 'percentage';
        if (filter === 'Fixed') return promo.discountType === 'fixed';
        if (filter === 'Expired') return promo.status === 'Expired' || (promo.status === 'Active' && expired);
        if (filter === 'Disabled') return promo.status === 'Disabled';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry') {
          return new Date(a.expiryDate || '2099-12-31').getTime() - new Date(b.expiryDate || '2099-12-31').getTime();
        }
        if (sortBy === 'discount') {
          return b.discountValue - a.discountValue;
        }
        if (sortBy === 'used') {
          return (b.usedCount ?? 0) - (a.usedCount ?? 0);
        }
        if (sortBy === 'code') {
          return a.code.localeCompare(b.code);
        }
        return 0;
      });
  }, [promotions, searchQuery, filter, sortBy]);

  return (
    <div className="space-y-6 text-stone-900 font-sans">
      {/* ── Action Bar Header ── */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#A80C14]" />
            <span>Store Promo Codes & Vouchers</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Real-time coupon management for store discount vouchers, percentage deals, minimum spend thresholds, and usage caps.
          </p>
        </div>

        <button
          onClick={onOpenAddPromoModal}
          className="px-4.5 py-2.5 bg-[#A80C14] hover:bg-[#8C0A10] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Voucher</span>
        </button>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Zap}
          label="Active Vouchers"
          value={`${stats.active} / ${stats.total}`}
          sub="Live promotions available to users"
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Redemptions"
          value={stats.redemptions}
          sub="Total coupon uses applied"
          tone="rose"
        />
        <StatCard
          icon={Ticket}
          label="Total Catalog"
          value={stats.total}
          sub="Created discount vouchers"
          tone="blue"
        />
        <StatCard
          icon={AlertCircle}
          label="Attention Needed"
          value={stats.expiringOrMaxed}
          sub="Expired or usage limit reached"
          tone="amber"
        />
      </div>

      {/* ── Toolbar: Search, Filters & View Mode ── */}
      <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code (e.g. FALAK20)..."
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

        {/* Sort & View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-stone-700 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="expiry">Soonest Expiry</option>
              <option value="discount">Highest Discount</option>
              <option value="used">Most Redemptions</option>
              <option value="code">Code A-Z</option>
            </select>
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#A80C14] shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#A80C14] shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Category Chips ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
        {(['All', 'Active', 'Percentage', 'Fixed', 'Expired', 'Disabled'] as const).map((tab) => {
          const count =
            tab === 'All'
              ? promotions.length
              : tab === 'Active'
              ? promotions.filter((p) => p.status === 'Active' && !isExpired(p)).length
              : tab === 'Percentage'
              ? promotions.filter((p) => p.discountType === 'percentage').length
              : tab === 'Fixed'
              ? promotions.filter((p) => p.discountType === 'fixed').length
              : tab === 'Expired'
              ? promotions.filter((p) => p.status === 'Expired' || (p.status === 'Active' && isExpired(p))).length
              : promotions.filter((p) => p.status === 'Disabled').length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
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

      {/* ── Grid View ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promo) => {
            const promoId = promo._id || promo.id || promo.code;
            const isActive = promo.status === 'Active';
            const expired = isExpired(promo);
            const hasReachedLimit = promo.usageLimit > 0 && (promo.usedCount ?? 0) >= promo.usageLimit;
            const isPct = promo.discountType === 'percentage';

            return (
              <div
                key={promoId}
                className={`bg-white rounded-3xl border p-6 shadow-xs space-y-4 relative overflow-hidden transition-all flex flex-col justify-between ${
                  isActive && !expired && !hasReachedLimit
                    ? 'border-stone-200 hover:border-amber-500/50'
                    : 'border-red-200 opacity-80 bg-stone-50/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-amber-400 text-stone-950 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      {isPct ? `${promo.discountValue}% OFF` : `৳${promo.discountValue} OFF`}
                    </span>

                    {isActive && expired ? (
                      <span className="text-[10px] font-mono font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        Expired (Auto)
                      </span>
                    ) : isActive && hasReachedLimit ? (
                      <span className="text-[10px] font-mono font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Limit Reached
                      </span>
                    ) : (
                      <span className={`text-[10px] font-mono font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                        {promo.status}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-mono font-extrabold text-xl text-stone-900 tracking-wider">
                      {promo.code}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Min spend: <strong className="text-stone-900">{formatCurrency(promo.minSpend)}</strong>
                      {promo.maxDiscount && promo.maxDiscount > 0 ? ` | Cap: ${formatCurrency(promo.maxDiscount)}` : ''}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-bold text-stone-500">
                      <span>Usage Progress:</span>
                      <span>
                        {promo.usedCount ?? 0} / {promo.usageLimit === 0 ? 'Unlimited' : promo.usageLimit}
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${
                            promo.usageLimit === 0
                              ? 0
                              : Math.min(100, (((promo.usedCount ?? 0) / promo.usageLimit) * 100))
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Expiry & Copy Box */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-stone-400 block uppercase font-bold">EXPIRES</span>
                      <span className="text-xs font-mono font-bold text-stone-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#A80C14]" />
                        {promo.expiryDate}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(promo.code)}
                      className="p-2 bg-stone-200 hover:bg-stone-300 text-stone-900 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                    >
                      {copiedCode === promo.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenEditPromoModal(promo)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => onToggleStatus(promo)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Disable' : 'Activate'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDeletePromo(promoId, promo.code)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition-colors cursor-pointer"
                    title="Delete Voucher"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredPromotions.length === 0 && (
            <div className="col-span-full py-16 text-center text-stone-500 bg-white rounded-3xl border border-stone-200">
              <Tag className="w-10 h-10 mx-auto text-stone-400 mb-2" />
              <p className="font-bold text-stone-700">No promo vouchers found.</p>
              <p className="text-xs text-stone-400 mt-1">Click "Create New Voucher" or adjust your search filters.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Table View ── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-5">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min Spend / Cap</th>
                  <th className="py-3.5 px-4">Redemptions</th>
                  <th className="py-3.5 px-4">Expiry</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPromotions.map((promo) => {
                  const promoId = promo._id || promo.id || promo.code;
                  const isActive = promo.status === 'Active';
                  const expired = isExpired(promo);
                  const isPct = promo.discountType === 'percentage';

                  return (
                    <tr key={promoId} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-[#0D153A] bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                            {promo.code}
                          </span>
                          <button
                            onClick={() => handleCopy(promo.code)}
                            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === promo.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-stone-900">
                        {isPct ? (
                          <span className="text-amber-800 font-mono font-bold">{promo.discountValue}% OFF</span>
                        ) : (
                          <span className="text-[#A80C14] font-mono font-bold">৳{promo.discountValue} OFF</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-stone-600 font-mono">
                        <p>Min: {promo.minSpend > 0 ? formatCurrency(promo.minSpend) : 'None'}</p>
                        <p className="text-[10px] text-stone-400">
                          Cap: {promo.maxDiscount && promo.maxDiscount > 0 ? formatCurrency(promo.maxDiscount) : 'Uncapped'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1 w-28">
                          <span className="font-mono text-xs font-bold text-stone-700">
                            {promo.usedCount ?? 0} / {promo.usageLimit === 0 ? '∞' : promo.usageLimit}
                          </span>
                          <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#A80C14] h-1.5 rounded-full"
                              style={{
                                width: `${
                                  promo.usageLimit === 0
                                    ? 0
                                    : Math.min(100, (((promo.usedCount ?? 0) / promo.usageLimit) * 100))
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-stone-600 text-xs">
                        {promo.expiryDate}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                          isActive && !expired
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}>
                          {promo.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditPromoModal(promo)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleStatus(promo)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer"
                            title="Toggle Status"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePromo(promoId, promo.code)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
