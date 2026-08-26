'use client';

import React, { useState } from 'react';
import { Tag, Plus, Copy, Check, Trash2, Edit3, Power, Clock, Percent, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PromoVoucherData } from './PromoFormModal';

interface PromotionsTabProps {
  promotions: PromoVoucherData[];
  onOpenAddPromoModal: () => void;
  onOpenEditPromoModal: (promo: PromoVoucherData) => void;
  onToggleStatus: (promo: PromoVoucherData) => void;
  onDeletePromo: (id: string, code: string) => void;
}

export function PromotionsTab({
  promotions,
  onOpenAddPromoModal,
  onOpenEditPromoModal,
  onToggleStatus,
  onDeletePromo
}: PromotionsTabProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Expired' | 'Disabled'>('All');

  const isExpired = (promo: PromoVoucherData) => {
    return promo.expiryDate && new Date(promo.expiryDate) < new Date();
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

  const filteredPromotions = promotions.filter((promo) => {
    const expired = isExpired(promo);
    if (filter === 'Active') {
      return promo.status === 'Active' && !expired;
    }
    if (filter === 'Expired') {
      return promo.status === 'Expired' || (promo.status === 'Active' && expired);
    }
    if (filter === 'Disabled') {
      return promo.status === 'Disabled';
    }
    return true;
  });

  return (
    <div className="space-y-6 text-stone-900">
      {/* Action Bar */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" />
            <span>Store Promo Codes & Vouchers Management</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time CRUD operations for store coupons, percentage discounts, fixed vouchers, and usage caps.
          </p>
        </div>

        <button
          onClick={onOpenAddPromoModal}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Voucher</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs font-bold scrollbar-none">
        {(['All', 'Active', 'Expired', 'Disabled'] as const).map((tab) => {
          const count =
            tab === 'All'
              ? promotions.length
              : tab === 'Active'
              ? promotions.filter((p) => p.status === 'Active' && !isExpired(p)).length
              : tab === 'Expired'
              ? promotions.filter((p) => p.status === 'Expired' || (p.status === 'Active' && isExpired(p))).length
              : promotions.filter((p) => p.status === 'Disabled').length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-stone-900 text-white shadow-sm font-bold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              <span>{tab}</span>
              <span className="text-[10px] font-mono opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromotions.map((promo) => {
          const promoId = promo._id || promo.id || promo.code;
          const isActive = promo.status === 'Active';
          const expired = isExpired(promo);
          const hasReachedLimit = promo.usageLimit > 0 && (promo.usedCount ?? 0) >= promo.usageLimit;

          return (
            <div
              key={promoId}
              className={`bg-white dark:bg-stone-900 rounded-3xl border p-6 shadow-xs space-y-4 relative overflow-hidden transition-all flex flex-col justify-between ${
                isActive && !expired && !hasReachedLimit
                  ? 'border-stone-200 dark:border-stone-800 hover:border-amber-500/50'
                  : 'border-red-200 dark:border-red-900/50 opacity-80 bg-stone-50/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-400 text-stone-950 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    {promo.discountType === 'percentage' ? (
                      <>
                        <Percent className="w-3 h-3 text-stone-950" /> {promo.discountValue}% OFF
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-3 h-3 text-stone-950" /> ৳{promo.discountValue} OFF
                      </>
                    )}
                  </span>

                  {isActive && expired ? (
                    <span
                      className="text-[10px] font-mono font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-350 border border-rose-200 cursor-help"
                      title="Past expiry date — auto-checked at redemption"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      Expired (Auto)
                    </span>
                  ) : isActive && hasReachedLimit ? (
                    <span
                      className="text-[10px] font-mono font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-350 border border-amber-200 cursor-help"
                      title="Coupon usage limit has been reached"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Limit Reached
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-mono font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-350 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                        }`}
                      />
                      {promo.status}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-mono font-extrabold text-xl text-stone-900 dark:text-stone-100 tracking-wider">
                    {promo.code}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Min spend: <strong className="text-stone-900 dark:text-stone-200">{formatCurrency(promo.minSpend)}</strong>
                    {promo.maxDiscount && promo.maxDiscount > 0 ? ` | Cap: ${formatCurrency(promo.maxDiscount)}` : ''}
                  </p>
                </div>

                {/* Progress bar and usage metrics */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    <span>Usage Progress:</span>
                    <span>
                      {promo.usedCount ?? 0} / {promo.usageLimit === 0 ? 'Unlimited' : promo.usageLimit}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${
                          promo.usageLimit === 0
                            ? 0
                            : Math.min(100, (((promo.usedCount ?? 0) / promo.usageLimit) * 100))
                        }%`
                      }}
                    />
                  </div>
                </div>

                {/* Promo Code Box */}
                <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-stone-400 block uppercase font-bold">EXPIRES</span>
                    <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {promo.expiryDate}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(promo.code)}
                    className="p-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-900 dark:text-stone-100 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
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

              {/* Action Buttons: Edit, Toggle, Delete */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenEditPromoModal(promo)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 rounded-xl transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onToggleStatus(promo)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Disable' : 'Activate'}</span>
                  </button>
                </div>

                <button
                  onClick={() => onDeletePromo(promoId, promo.code)}
                  className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-xl transition-colors cursor-pointer"
                  title="Delete Voucher"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredPromotions.length === 0 && (
          <div className="col-span-full py-16 text-center text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            <Tag className="w-10 h-10 mx-auto text-stone-400 mb-2" />
            <p className="font-bold text-stone-700 dark:text-stone-300">No promo vouchers found.</p>
            <p className="text-xs text-stone-400 mt-1">Click "Create New Voucher" or adjust your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
