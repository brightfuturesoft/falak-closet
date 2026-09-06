'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag, Sparkles, Clock, Check, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface PromoVoucherData {
  _id?: string;
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount?: number;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Disabled';
}

interface PromoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePromotion: (promoData: Partial<PromoVoucherData>) => Promise<void>;
  editingPromo?: PromoVoucherData | null;
}

const PRESETS = [
  { label: '10% Welcome OFF', code: 'WELCOME10', type: 'percentage' as const, value: 10, minSpend: 1000, maxCap: 500 },
  { label: '20% Mega Deal', code: 'MEGA20', type: 'percentage' as const, value: 20, minSpend: 2500, maxCap: 1000 },
  { label: '৳300 Flat Voucher', code: 'SAVE300', type: 'fixed' as const, value: 300, minSpend: 2000, maxCap: 0 },
  { label: '৳500 Eid Special', code: 'EID500', type: 'fixed' as const, value: 500, minSpend: 3500, maxCap: 0 },
];

export function PromoFormModal({
  isOpen,
  onClose,
  onSavePromotion,
  editingPromo,
}: PromoFormModalProps) {
  const [formData, setFormData] = useState<PromoVoucherData>({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minSpend: 2000,
    maxDiscount: 1000,
    usageLimit: 500,
    expiryDate: '2026-12-31',
    status: 'Active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingPromo) {
      setFormData({
        _id: editingPromo._id || editingPromo.id,
        id: editingPromo.id || editingPromo._id,
        code: editingPromo.code || '',
        discountType: editingPromo.discountType || 'percentage',
        discountValue: editingPromo.discountValue || 15,
        minSpend: editingPromo.minSpend || 0,
        maxDiscount: editingPromo.maxDiscount || 0,
        usageLimit: editingPromo.usageLimit || 100,
        expiryDate: editingPromo.expiryDate || '2026-12-31',
        status: editingPromo.status || 'Active',
      });
    } else {
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 15,
        minSpend: 2000,
        maxDiscount: 1000,
        usageLimit: 500,
        expiryDate: '2026-12-31',
        status: 'Active',
      });
    }
  }, [editingPromo, isOpen]);

  if (!isOpen) return null;

  const applyPreset = (p: typeof PRESETS[number]) => {
    setFormData((prev) => ({
      ...prev,
      code: p.code,
      discountType: p.type,
      discountValue: p.value,
      minSpend: p.minSpend,
      maxDiscount: p.maxCap,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSavePromotion({
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountValue: Number(formData.discountValue),
        minSpend: Number(formData.minSpend),
        maxDiscount: Number(formData.maxDiscount || 0),
        usageLimit: Number(formData.usageLimit),
      });
      onClose();
    } catch {
      // Handled upstream in AdminDashboardContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPct = formData.discountType === 'percentage';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-stone-900 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-stone-200 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-[#A80C14] border border-rose-200 rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-extrabold text-xl text-stone-900">
                {editingPromo ? 'Edit Store Voucher' : 'Create New Voucher'}
              </h3>
              <p className="text-xs text-stone-500">
                Set coupon discount value, order spend thresholds, usage limit, and expiry date.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Split Form & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
          
          {/* Form Side (7 Cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 p-6 space-y-5 text-xs bg-white">
            
            {/* Quick Presets Bar */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#A80C14]" />
                Quick Preset Templates
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl transition-all cursor-pointer text-[10px] font-bold"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-800 flex items-center justify-between">
                <span>Coupon Code (Auto Uppercase)</span>
                <span className="text-[10px] text-stone-400 font-mono">Unique Code</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })}
                placeholder="e.g. FALAK20 or EID2026"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-base font-black text-[#0D153A] focus:outline-none focus:ring-2 focus:ring-[#A80C14] tracking-wider"
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-800">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#A80C14] cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed BDT Amount (৳)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-800">
                  Discount Value {isPct ? '(%)' : '(৳)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full pl-4 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-stone-400">
                    {isPct ? '%' : '৳'}
                  </span>
                </div>
              </div>
            </div>

            {/* Min Spend & Max Discount Cap */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-800">Min Order Spend (৳)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.minSpend}
                  onChange={(e) => setFormData({ ...formData, minSpend: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
                />
                <span className="text-[10px] text-stone-400">0 = No minimum required</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-800">Max Discount Cap (৳)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.maxDiscount || 0}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
                />
                <span className="text-[10px] text-stone-400">0 = Uncapped limit</span>
              </div>
            </div>

            {/* Usage Limit, Expiry & Status */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-800">Usage Limit</label>
                <input
                  type="number"
                  min={0}
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-800">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-800">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.code.trim()}
                className="px-6 py-2.5 bg-[#A80C14] hover:bg-[#8C0A10] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingPromo ? 'Update Voucher' : 'Publish Voucher'}
              </button>
            </div>
          </form>

          {/* Live Preview Side (5 Cols) */}
          <div className="lg:col-span-5 p-6 bg-stone-50 flex flex-col items-center justify-center space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Eye className="w-3 h-3 text-[#A80C14]" /> LIVE VOUCHER PREVIEW
              </span>
              <p className="text-xs text-stone-500">
                Real-time ticket preview for admin & checkout display.
              </p>
            </div>

            {/* Live Voucher Card Mockup */}
            <div className="w-full max-w-sm bg-white rounded-3xl border border-stone-200 shadow-sm relative overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-400 text-stone-950 rounded-full text-xs font-black uppercase tracking-wider">
                  {isPct ? `${formData.discountValue || 0}% OFF` : `৳${formData.discountValue || 0} OFF`}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {formData.status}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase text-stone-400 font-bold">COUPON CODE</p>
                <p className="font-mono font-extrabold text-xl text-[#0D153A] tracking-wider">
                  {formData.code || 'COUPON_CODE'}
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Min Spend:</span>
                  <span className="font-bold text-stone-700">
                    {formData.minSpend > 0 ? formatCurrency(formData.minSpend) : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Max Cap:</span>
                  <span className="font-bold text-stone-700">
                    {formData.maxDiscount ? formatCurrency(formData.maxDiscount) : 'Uncapped'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Expires:</span>
                  <span className="font-bold text-stone-700">{formData.expiryDate || 'N/A'}</span>
                </div>
              </div>

              <div className="text-[10px] text-center text-stone-400 font-mono">
                Falak Closet Official Coupon Voucher
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
