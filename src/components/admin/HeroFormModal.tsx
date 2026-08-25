'use client';

import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Sparkles } from 'lucide-react';

export interface HeroSlideData {
  _id?: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  order: number;
  isActive: boolean;
}

interface HeroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSlide: (slideData: Partial<HeroSlideData>) => Promise<void>;
  editingSlide?: HeroSlideData | null;
}

export function HeroFormModal({
  isOpen,
  onClose,
  onSaveSlide,
  editingSlide
}: HeroFormModalProps) {
  const [formData, setFormData] = useState<HeroSlideData>({
    tag: '',
    title: '',
    subtitle: '',
    ctaText: '',
    ctaLink: '',
    image: '',
    order: 0,
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingSlide) {
      setFormData({
        _id: editingSlide._id,
        tag: editingSlide.tag || '',
        title: editingSlide.title || '',
        subtitle: editingSlide.subtitle || '',
        ctaText: editingSlide.ctaText || '',
        ctaLink: editingSlide.ctaLink || '',
        image: editingSlide.image || '',
        order: editingSlide.order || 0,
        isActive: editingSlide.isActive !== false
      });
    } else {
      setFormData({
        tag: '',
        title: '',
        subtitle: '',
        ctaText: '',
        ctaLink: '',
        image: '',
        order: 0,
        isActive: true
      });
    }
    setErrorMsg(null);
  }, [editingSlide, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (!formData.tag.trim() || !formData.title.trim() || !formData.subtitle.trim() || 
          !formData.ctaText.trim() || !formData.ctaLink.trim() || !formData.image.trim()) {
        throw new Error('All banner fields are required');
      }

      await onSaveSlide({
        ...formData,
        order: Number(formData.order) || 0
      });
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              {editingSlide ? 'Edit Hero Banner' : 'Create New Hero Banner'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-400 font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">Category Tag (Caps)</label>
              <input
                type="text"
                required
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                placeholder="e.g. SEASONAL DEALS"
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">Display Order</label>
              <input
                type="number"
                required
                min={0}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-stone-700 dark:text-stone-300">Main Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Modest Luxury Collections"
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-stone-700 dark:text-stone-300">Subtitle Description</label>
            <textarea
              required
              rows={3}
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g. Discover modular kaftans, modish abayas and soft premium fabrics."
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">CTA Button Text</label>
              <input
                type="text"
                required
                value={formData.ctaText}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                placeholder="e.g. Shop Now"
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">CTA Link Path</label>
              <input
                type="text"
                required
                value={formData.ctaLink}
                onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                placeholder="e.g. /shop or /live-promotions"
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-stone-700 dark:text-stone-300">Background Image URL</label>
            <input
              type="url"
              required
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="e.g. https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-amber-600 border-stone-300 rounded-sm focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="isActive" className="font-bold text-stone-700 dark:text-stone-300 cursor-pointer select-none">
              Publish slide immediately (Active)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 font-bold transition-all text-stone-700 dark:text-stone-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl hover:bg-stone-800 dark:hover:bg-stone-200 font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isSubmitting ? 'Saving Banner...' : editingSlide ? 'Save Banner Changes' : 'Create Banner Slide'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
