'use client';

// TODO: Migrate this section to dynamic backend-loaded banners using getActiveBanners()
// once home page routing allows server component props.

import React from 'react';
import Link from 'next/link';
import { Tag, Sparkles, Truck, ShieldCheck, ArrowRight } from 'lucide-react';

export function PromoBannerSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Banner Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-[#9B050B] via-[#C71B20] to-[#9B050B] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-between space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#F2C76E]" />
              <span>Limited Time Offer</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#FFFBF0] leading-tight">
              Luxury Abaya & Hijab Flash Discount
            </h3>
            <p className="text-xs sm:text-sm text-stone-200 max-w-lg">
              Use promo code <strong className="bg-[#F2C76E] text-[#0C163A] px-2 py-0.5 rounded font-mono">FLASH25</strong> at checkout to get 25% instant discount on your order.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 relative z-10 pt-2">
            <Link
              href="/shop"
              className="px-6 py-3 bg-[#F2C76E] hover:bg-[#E5B550] text-[#0C163A] font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md flex items-center gap-2 hover:scale-105"
            >
              <span>Shop Flash Sale</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/live-promotions"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all flex items-center gap-2"
            >
              <Tag className="w-4 h-4 text-[#F2C76E]" />
              <span>View All Vouchers</span>
            </Link>
          </div>
        </div>

        {/* Perks / Free Shipping Highlight Box */}
        <div className="bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#9B050B]/10 text-[#9B050B] flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base text-[#0C163A]">
                Free Delivery Offer
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Enjoy free express doorstep shipping across Bangladesh on orders ৳100 and above.
              </p>
            </div>

            <div className="pt-2 border-t border-[#F2C76E]/30 space-y-2 text-xs">
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
            className="w-full py-2.5 bg-[#0C163A] hover:bg-[#122050] text-[#FFFBF0] text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            Delivery Info & Policies
          </Link>
        </div>
      </div>
    </section>
  );
}
