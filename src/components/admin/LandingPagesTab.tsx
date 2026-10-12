'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Video,
  Upload,
  Percent,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Play,
  Layers,
  Tag,
  Info,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Product } from '@/data/products';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';
import { formatCurrency } from '@/lib/utils';
import { sendProductUpdateNotification } from '@/lib/socketClient';
import { getYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/videoUtils';

export function LandingPagesTab() {
  const admin = useAdminDashboard();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');

  // Form fields
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync products from admin context or fetch if empty
  useEffect(() => {
    if (admin.productsList && admin.productsList.length > 0) {
      setProducts(admin.productsList);
      // Default to the hijab landing product if present
      const hijab = admin.productsList.find(
        (p) => p.slug === 'premium-shiny-shade-jersey-branded-stone-hijab'
      );
      if (hijab) {
        setSelectedProductId(hijab.id);
      } else {
        setSelectedProductId(admin.productsList[0].id);
      }
    }
  }, [admin.productsList]);

  // Selected product
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Populate form fields when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      setVideoUrl(selectedProduct.videoUrl || '');
      setDiscountPercent(
        typeof selectedProduct.landingDiscountPercentage === 'number' &&
        selectedProduct.landingDiscountPercentage > 0
          ? String(selectedProduct.landingDiscountPercentage)
          : selectedProduct.discountPercentage && selectedProduct.discountPercentage > 0
          ? String(selectedProduct.discountPercentage)
          : ''
      );
      setSaveSuccess(false);
      setUploadError(null);
    }
  }, [selectedProduct]);

  // Price calculations
  const regularPrice = useMemo(() => {
    if (!selectedProduct) return 850;
    return (selectedProduct.originalPrice && selectedProduct.originalPrice > 0)
      ? selectedProduct.originalPrice
      : (selectedProduct.price || 850);
  }, [selectedProduct]);

  const parsedDiscount = useMemo(() => {
    const val = parseFloat(discountPercent);
    if (isNaN(val) || val < 0) return 0;
    return Math.min(100, val);
  }, [discountPercent]);

  const calculatedOfferPrice = useMemo(() => {
    if (parsedDiscount <= 0) return selectedProduct?.price || regularPrice;
    return Math.max(1, Math.round(regularPrice * (1 - parsedDiscount / 100)));
  }, [regularPrice, parsedDiscount, selectedProduct]);

  const savingsAmount = useMemo(() => {
    return Math.max(0, regularPrice - calculatedOfferPrice);
  }, [regularPrice, calculatedOfferPrice]);

  const isYouTube = useMemo(() => isYouTubeUrl(videoUrl), [videoUrl]);
  const youTubeEmbedUrl = useMemo(() => {
    return isYouTube ? getYouTubeEmbedUrl(videoUrl, { autoplay: false, mute: false, controls: true }) : null;
  }, [videoUrl, isYouTube]);

  // Video file upload handler
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file (.mp4, .webm, .mov).');
      return;
    }

    if (file.size > 60 * 1024 * 1024) {
      setUploadError('Video file size exceeds the 60 MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'landing-videos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload video');
      }

      const uploadedUrl = data.uploaded?.[0]?.secureUrl || data.uploaded?.[0]?.url;
      if (uploadedUrl) {
        setVideoUrl(uploadedUrl);
        admin.addToast('success', 'Video uploaded successfully! Click "Save Changes" to apply.');
      }
    } catch (err) {
      console.error('Video upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Error uploading video');
      admin.addToast('error', 'Video upload failed. You can also paste a direct video URL.');
    } finally {
      setIsUploading(false);
      // Reset input value
      e.target.value = '';
    }
  };

  // Save changes to database
  const handleSave = async () => {
    if (!selectedProduct) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload: Record<string, any> = {
        videoUrl: videoUrl.trim() || null,
        landingDiscountPercentage: discountPercent.trim() ? parseFloat(discountPercent) : null,
      };

      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save landing settings');
      }

      // Update product in local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, videoUrl: payload.videoUrl, landingDiscountPercentage: payload.landingDiscountPercentage }
            : p
        )
      );

      setSaveSuccess(true);
      sendProductUpdateNotification({
        type: 'update',
        product: { ...selectedProduct, ...payload },
        id: selectedProduct.id,
      });
      admin.addToast('success', 'Landing page configuration saved successfully!');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Save error:', err);
      admin.addToast('error', err instanceof Error ? err.message : 'Failed to save landing page settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered products list for selector
  const filteredProducts = useMemo(() => {
    if (!searchFilter.trim()) return products;
    const q = searchFilter.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [products, searchFilter]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F3] border border-[#F8D2D5] text-[#800020] text-xs font-bold mb-2">
            <Video className="w-3.5 h-3.5 text-[#800020]" />
            <span>High-Converting Funnel Customizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight">
            Landing Page Manager
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Manage video showcase, promotional discount rates, and live offer pricing for dedicated product landing pages.
          </p>
        </div>

        {selectedProduct && (
          <Link
            href={`/landing/${selectedProduct.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer shrink-0"
          >
            <span>View Live Landing Page</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* ── Main 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Selector & Preview (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Product Picker Card */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#800020]" />
                <span>Select Target Product</span>
              </label>
              <span className="text-[11px] text-stone-400 font-mono">
                {products.length} products available
              </span>
            </div>

            {/* Search filter for products */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by product name..."
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
              />
            </div>

            {/* Product selection dropdown */}
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs font-semibold p-3 bg-[#FAF6F4] border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] cursor-pointer"
            >
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.price)})
                </option>
              ))}
            </select>

            {/* Selected Product Card Summary */}
            {selectedProduct && (
              <div className="pt-3 border-t border-stone-100 flex gap-4 items-center bg-[#FCFAF8] p-3.5 rounded-2xl border border-stone-200/60">
                <div className="w-16 h-20 rounded-xl overflow-hidden relative shrink-0 border border-stone-200 bg-white shadow-xs">
                  <Image
                    src={selectedProduct.images?.[0] || '/placeholder.png'}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                    {selectedProduct.category}
                  </span>
                  <h4 className="font-serif font-bold text-xs text-stone-900 leading-snug truncate">
                    {selectedProduct.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-400 line-through font-mono text-[11px]">
                      ৳{regularPrice}
                    </span>
                    <span className="font-mono font-bold text-[#800020]">
                      ৳{selectedProduct.price}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-mono truncate">
                    Slug: /landing/{selectedProduct.slug}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Live Pricing Breakdown Card */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#800020]" />
                <span>Live Offer Price Calculation</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Auto-calculated
              </span>
            </div>

            <div className="bg-[#FAF6F4] rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-600">
                <span>Base Regular Price:</span>
                <span className="font-mono font-bold text-stone-900">৳{regularPrice}</span>
              </div>
              <div className="flex justify-between items-center text-stone-600">
                <span>Discount Rate:</span>
                <span className="font-mono font-bold text-[#800020]">
                  {parsedDiscount > 0 ? `${parsedDiscount}%` : '0% (Standard Price)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-600">
                <span>Customer Savings:</span>
                <span className="font-mono font-bold text-emerald-700">৳{savingsAmount}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-stone-200 text-sm font-extrabold">
                <span className="text-stone-900">Calculated Offer Price:</span>
                <span className="font-mono text-xl text-[#800020] font-black">
                  ৳{calculatedOfferPrice}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed flex items-start gap-1.5">
              <Info className="w-4 h-4 text-[#800020] shrink-0 mt-0.5" />
              <span>
                This <strong>Offer Price (৳{calculatedOfferPrice})</strong> will automatically update the landing page hero banner, discount badge ({parsedDiscount}% OFF), mobile buy bar, and checkout order total.
              </span>
            </p>
          </div>
        </div>

        {/* Right Column: Customization Controls (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Video Customization Card */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#800020]" />
                  <span>Product Video Showcase</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Upload a promotional video or paste a video URL. All inputs are optional.
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-full">
                Optional
              </span>
            </div>

            {/* Video Upload Dropzone */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                Option 1: Upload Video File (.mp4, .webm, .mov)
              </label>

              <div className="border-2 border-dashed border-stone-200 hover:border-[#800020]/50 rounded-2xl p-5 text-center bg-stone-50/50 hover:bg-[#FDF2F3]/20 transition-colors">
                <input
                  type="file"
                  id="video-upload-input"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <label
                  htmlFor="video-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FDF2F3] text-[#800020] flex items-center justify-center border border-[#F8D2D5]">
                    {isUploading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#800020]">
                      {isUploading ? 'Uploading Video to Cloudinary...' : 'Click to Browse & Upload Video'}
                    </span>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Max file size: 60 MB. MP4 or WebM format recommended.
                    </p>
                  </div>
                </label>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Video URL Input */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                Option 2: Direct Video URL (YouTube / CDN / Cloudinary)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/... or .mp4 URL"
                className="w-full text-xs px-4 py-3 bg-[#FAF6F4] border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] font-mono"
              />
              <p className="text-[11px] text-stone-400">
                Paste any YouTube video link (Watch, youtu.be, Shorts, Embed) or direct MP4/WebM video file.
              </p>
            </div>

            {/* Live Video Preview or Product Image Fallback Notice */}
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#800020]" />
                <span>Media Display Preview</span>
              </span>

              {videoUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-stone-200 shadow-md">
                    {isYouTube && youTubeEmbedUrl ? (
                      <iframe
                        src={youTubeEmbedUrl}
                        title="YouTube Video Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <video
                        src={videoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isYouTube ? 'YouTube video is active on landing page' : 'Direct video is active on landing page'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVideoUrl('')}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Video</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-stone-200 text-stone-600 text-xs flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-800">
                      Product Photo Fallback Active
                    </p>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      No video is currently specified. As per your preference, the landing page will automatically showcase the primary product photo ({selectedProduct?.name}) in the showcase container.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Discount Percentage Card */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#800020]" />
                  <span>Landing Page Discount Percentage</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Enter custom discount percentage for this landing funnel. Optional.
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-full">
                Optional
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                Discount Rate (%)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full text-base font-mono font-bold px-4 py-3 bg-[#FAF6F4] border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] pr-10"
                />
                <span className="absolute right-4 top-3.5 text-stone-400 font-mono font-bold text-sm">
                  %
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Example: 18% discount on ৳{regularPrice} produces an offer price of ৳{calculatedOfferPrice}. Leave empty to use regular price.
              </p>
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {saveSuccess ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Settings saved and cache revalidated!</span>
                </span>
              ) : (
                <span className="text-xs text-stone-500">
                  Ready to apply settings to live landing page.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !selectedProduct}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#800020] hover:bg-[#660019] disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
