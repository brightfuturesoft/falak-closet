'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tag, Sparkles, Truck, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';
import type { PromotionBanner } from '@/lib/promotionBanners';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface PromoBannerSectionProps {
  /**
   * Top active banner (first by sortOrder), fetched server-side via
   * getActiveBannersSafe(). Null → only the evergreen perks box renders.
   */
  banner: PromotionBanner | null;
}

export function PromoBannerSection({ banner }: PromoBannerSectionProps) {
  const { freeShippingThreshold } = useCart();
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!banner?.code) return;
    navigator.clipboard.writeText(banner.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // The promo card CTA deep-links the shop grid when the banner targets a
  // category, otherwise it stays the plain shop entry point.
  const shopHref = banner?.categoryFilter ? `/shop?category=${encodeURIComponent(banner.categoryFilter)}` : '/shop';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${banner ? 'lg:grid-cols-3' : ''}`}>
        {/* Main Banner Card — admin-managed (Live Promotion Banners, top row) */}
        {banner && (
          <div className="lg:col-span-2 bg-gradient-to-r from-[#A80C14] via-[#8C0A10] to-[#A80C14] rounded-3xl p-5 sm:p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-between gap-5 sm:gap-6">
            {/* Admin-uploaded art (optional) sits behind the brand gradient */}
            {banner.bannerImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner.bannerImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
              />
            )}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2.5 sm:space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#F2C76E]" />
                <span>{banner.discountBadge || 'Limited Time Offer'}</span>
              </div>
              <h3 className="font-serif text-xl sm:text-3xl font-extrabold text-[#FFFBF0] leading-tight">
                {banner.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-200 max-w-lg leading-relaxed">
                {banner.subtitle}
              </p>
            </div>

            {/* Promo code — big tappable chip, tap-to-copy (thumb-friendly) */}
            {banner.code && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="relative z-10 flex items-center justify-between gap-3 w-full sm:max-w-md bg-[#FFFBF0]/10 hover:bg-[#FFFBF0]/20 active:bg-[#FFFBF0]/25 border-2 border-dashed border-[#F2C76E]/70 rounded-2xl px-4 min-h-[52px] transition-colors cursor-pointer group"
                aria-label={`Copy promo code ${banner.code}`}
              >
                <div className="flex items-center gap-2.5 min-w-0 text-left">
                  <Tag className="w-4 h-4 text-[#F2C76E] shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[9px] uppercase tracking-widest text-stone-300 font-bold">
                      {copiedCode ? 'Copied to clipboard' : 'Tap to copy promo code'}
                    </span>
                    <span className="block font-mono font-black text-base sm:text-lg text-[#F2C76E] tracking-wider truncate">
                      {banner.code}
                    </span>
                  </div>
                </div>
                <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${copiedCode ? 'bg-emerald-500 text-white' : 'bg-[#F2C76E] text-[#0D153A] group-hover:scale-110'}`}>
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </span>
              </button>
            )}
            {banner.code && banner.minSpend && banner.minSpend > 0 && (
              <p className="relative z-10 -mt-3 text-[10px] text-stone-300">
                Valid on orders {formatCurrency(banner.minSpend)}+
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-4 relative z-10">
              <Link
                href={shopHref}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 px-6 bg-[#F2C76E] hover:bg-[#E5B550] text-[#0D153A] font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Shop the Offer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/live-promotions"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 px-6 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all active:scale-95 cursor-pointer"
              >
                <Tag className="w-4 h-4 text-[#F2C76E]" />
                <span>View All Vouchers</span>
              </Link>
            </div>
          </div>
        )}

        {/* Perks / Free Shipping Highlight Box — evergreen, always renders */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 sm:gap-6 shadow-xs">
          <div className="space-y-3.5 sm:space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-[#FDF2F3] text-[#A80C14] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif font-bold text-sm sm:text-base text-[#0D153A]">
                Free Delivery Offer
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed">
                Enjoy free express doorstep shipping across Bangladesh on orders{' '}
                {formatCurrency(freeShippingThreshold)} and above.
              </p>
            </div>

            <div className="pt-2 border-t border-stone-100 space-y-2 text-[11px] sm:text-xs">
              <div className="flex items-center gap-2 text-stone-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Authentic Fabric Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cash on Delivery (COD) Available</span>
              </div>
            </div>
          </div>

          <Link
            href="/shipping"
            className="inline-flex min-h-[44px] items-center justify-center w-full py-2.5 bg-[#0D153A] hover:bg-[#122050] text-[#FFFBF0] text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Delivery Info &amp; Policies
          </Link>
        </div>
      </div>
    </section>
  );
}
