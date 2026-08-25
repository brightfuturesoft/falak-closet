'use client';

import React, { useState, useEffect } from 'react';
import { 
  Images, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ArrowUpDown, 
  RefreshCw, 
  ExternalLink 
} from 'lucide-react';
import Image from 'next/image';
import { HeroFormModal, HeroSlideData } from './HeroFormModal';

interface HeroTabProps {
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export function HeroTab({ addToast }: HeroTabProps) {
  const [slides, setSlides] = useState<HeroSlideData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideData | null>(null);

  const fetchSlides = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/hero-slides');
      const data = await res.json();
      if (data.success) {
        setSlides(data.slides || []);
      } else {
        addToast('error', data.error || 'Failed to retrieve hero slides');
      }
    } catch (err) {
      addToast('error', 'Connection to database failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleSaveSlide = async (slideData: Partial<HeroSlideData>) => {
    try {
      const isEdit = !!slideData._id;
      const url = isEdit 
        ? `/api/admin/hero-slides/${slideData._id}` 
        : '/api/admin/hero-slides';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideData)
      });
      const data = await res.json();

      if (data.success) {
        addToast('success', isEdit ? 'Hero slide updated successfully!' : 'New hero slide added!');
        fetchSlides();
      } else {
        addToast('error', data.error || 'Failed to save slide');
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleToggleActive = async (slide: HeroSlideData) => {
    try {
      const res = await fetch(`/api/admin/hero-slides/${slide._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !slide.isActive })
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', `Slide is now ${!slide.isActive ? 'Active' : 'Inactive'}`);
        setSlides(prev => prev.map(s => s._id === slide._id ? { ...s, isActive: !s.isActive } : s));
      } else {
        addToast('error', data.error || 'Failed to update visibility');
      }
    } catch {
      addToast('error', 'Failed to communicate with DB');
    }
  };

  const handleOrderChange = async (slide: HeroSlideData, newOrder: number) => {
    try {
      const res = await fetch(`/api/admin/hero-slides/${slide._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });
      const data = await res.json();
      if (data.success) {
        setSlides(prev => prev.map(s => s._id === slide._id ? { ...s, order: newOrder } : s).sort((a, b) => a.order - b.order));
      } else {
        addToast('error', data.error || 'Failed to update sorting order');
      }
    } catch {
      addToast('error', 'Failed to communicate with DB');
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this hero slide banner?')) return;

    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Hero slide deleted successfully');
        setSlides(prev => prev.filter(s => s._id !== id));
      } else {
        addToast('error', data.error || 'Failed to delete slide');
      }
    } catch {
      addToast('error', 'Failed to communicate with DB');
    }
  };

  return (
    <div className="space-y-6 text-stone-900 dark:text-stone-100">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="space-y-1">
          <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Images className="w-5 h-5 text-amber-600" />
            <span>Homepage Hero Banner Slider Manager</span>
          </h2>
          <p className="text-xs text-stone-500">
            Configure tags, main titles, call-to-actions, and background banners dynamically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSlides}
            className="p-2.5 bg-stone-100 hover:bg-stone-250 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-300 transition-all cursor-pointer"
            title="Refresh Banners List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingSlide(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slide Banner</span>
          </button>
        </div>
      </div>

      {/* Grid Banners Preview / Manager */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-amber-600 animate-spin" />
          <span className="text-xs text-stone-500 font-bold">Querying Hero Slide Collection...</span>
        </div>
      ) : slides.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl space-y-4 shadow-xs">
          <p className="text-sm text-stone-500">No custom hero slides currently defined in Database.</p>
          <button
            onClick={() => {
              setEditingSlide(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Slide</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slides.map((slide) => (
            <div 
              key={slide._id} 
              className={`group bg-white dark:bg-stone-900 border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                slide.isActive 
                  ? 'border-stone-200 dark:border-stone-800' 
                  : 'border-dashed border-stone-300 dark:border-stone-700 opacity-70'
              }`}
            >
              {/* Image Banner Container */}
              <div className="relative h-48 bg-stone-950/20 overflow-hidden">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  unoptimized={slide.image.startsWith('http')}
                />
                {/* Visual Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-950/50 to-transparent" />

                {/* Banner Content overlay */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#F2C76E] bg-stone-900/60 px-2 py-0.5 rounded-md border border-[#F2C76E]/30 uppercase">
                      {slide.tag}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      slide.isActive 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-stone-500/20 text-stone-300 border border-stone-500/30'
                    }`}>
                      {slide.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif font-extrabold text-base leading-tight text-white drop-shadow-xs">
                      {slide.title}
                    </h3>
                    <p className="text-stone-300 text-[10px] leading-relaxed line-clamp-2 drop-shadow-xs max-w-sm">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls bar */}
              <div className="p-4 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-4 text-xs">
                {/* Order controls */}
                <div className="flex items-center gap-1.5 font-mono">
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-stone-500 text-[10px] font-bold">SORT:</span>
                  <input
                    type="number"
                    value={slide.order}
                    onChange={(e) => handleOrderChange(slide, Number(e.target.value))}
                    className="w-12 px-1.5 py-1 text-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-950 dark:text-stone-100 focus:outline-none"
                  />
                </div>

                {/* Operations */}
                <div className="flex items-center gap-2">
                  <a 
                    href={slide.ctaLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg border border-stone-200/50 dark:border-stone-800 transition-all"
                    title={`Test link to: ${slide.ctaLink}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleToggleActive(slide)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      slide.isActive 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                        : 'bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-250 dark:bg-stone-850 dark:border-stone-750 dark:text-stone-400'
                    }`}
                    title={slide.isActive ? 'Make Slide Inactive' : 'Publish Slide'}
                  >
                    {slide.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setEditingSlide(slide);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-lg transition-all cursor-pointer"
                    title="Edit Slide Details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteSlide(slide._id!)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-all cursor-pointer"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Modal */}
      <HeroFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlide(null);
        }}
        onSaveSlide={handleSaveSlide}
        editingSlide={editingSlide}
      />
    </div>
  );
}
