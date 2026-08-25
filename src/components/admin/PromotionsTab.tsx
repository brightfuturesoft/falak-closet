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

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => {
          const promoId = promo._id || promo.id || promo.code;
          const isActive = promo.status === 'Active';

          return (
            <div
              key={promoId}
              className={`bg-white dark:bg-stone-900 rounded-3xl border p-6 shadow-xs space-y-4 relative overflow-hidden transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-stone-200 dark:border-stone-800 hover:border-amber-500/50'
                  : 'border-red-200 dark:border-red-900/50 opacity-80'
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

                  <span
                    className={`text-[10px] font-mono font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
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

        {promotions.length === 0 && (
          <div className="col-span-full py-16 text-center text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            <Tag className="w-10 h-10 mx-auto text-stone-400 mb-2" />
            <p className="font-bold text-stone-700 dark:text-stone-300">No promo vouchers found.</p>
            <p className="text-xs text-stone-400 mt-1">Click "Create New Voucher" to add your first promotion.</p>
          </div>
        )}
      </div>
    </div>
  );
}
