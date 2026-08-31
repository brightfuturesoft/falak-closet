'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';

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

export function PromoFormModal({
  isOpen,
  onClose,
  onSavePromotion,
  editingPromo
}: PromoFormModalProps) {
  const [formData, setFormData] = useState<PromoVoucherData>({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minSpend: 2000,
    maxDiscount: 1000,
    usageLimit: 500,
    expiryDate: '2026-12-31',
    status: 'Active'
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
        status: editingPromo.status || 'Active'
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
        status: 'Active'
      });
    }
  }, [editingPromo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSavePromotion({
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountValue: Number(formData.discountValue),
        minSpend: Number(formData.minSpend),
        maxDiscount: Number(formData.maxDiscount),
        usageLimit: Number(formData.usageLimit)
      });
      onClose();
    } catch {
      // Handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative text-stone-900 dark:text-stone-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              {editingPromo ? 'Edit Store Voucher' : 'Create New Store Voucher'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs flex-1 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="font-bold text-stone-700 dark:text-stone-300">Promo Code (Uppercase)</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. EID2026 or FALAK20"
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono text-base font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed BDT Amount (৳)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">Discount Value</label>
              <input
                type="number"
                required
                min={1}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">Minimum Order Spend (৳)</label>
              <input
                type="number"
                min={0}
                value={formData.minSpend}
                onChange={(e) => setFormData({ ...formData, minSpend: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">Max Discount Cap (৳)</label>
              <input
                type="number"
                min={0}
                value={formData.maxDiscount || 0}
                onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">Usage Limit</label>
              <input
                type="number"
                min={1}
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">Expiry Date</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-2 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingPromo ? 'Update Voucher' : 'Publish Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
