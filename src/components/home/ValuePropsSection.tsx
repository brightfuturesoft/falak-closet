'use client';

import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  HeartHandshake,
  BadgeCheck,
  Medal,
  Gem,
  Crown,
  Recycle,
  Palette,
  PackageCheck,
  Headphones,
  type LucideIcon
} from 'lucide-react';
import type { ValuePropItem } from '@/lib/siteSettings';

/**
 * Admins pick an icon by key (Settings → Value Props). Whitelisted here so
 * arbitrary components never cross the client boundary.
 */
const ICONS: Record<string, LucideIcon> = {
  award: Award,
  shield: ShieldCheck,
  truck: Truck,
  rotate: RotateCcw,
  heart: HeartHandshake,
  sparkles: Sparkles,
  'badge-check': BadgeCheck,
  medal: Medal,
  gem: Gem,
  crown: Crown,
  recycle: Recycle,
  palette: Palette,
  package: PackageCheck,
  headphones: Headphones,
};

export function ValuePropsSection({ items }: { items: ValuePropItem[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full" aria-label="Why choose Falak Closet">
      <div className="bg-white border border-pink-100 rounded-3xl p-4 sm:p-10 space-y-5 sm:space-y-8 shadow-xs">
        <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 border border-pink-200 rounded-full text-[10px] sm:text-xs text-[#D92670] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Falak Closet Standard</span>
          </div>
          <h2 className="font-serif text-xl sm:text-3xl font-extrabold text-[#0C163A] leading-tight">
            Why Modest Fashion Lovers Choose Us
          </h2>
          <p className="text-[11px] sm:text-sm text-stone-600 leading-relaxed">
            We blend timeless elegance with modern modest tailoring, ensuring premium comfort and elegance in every stitch.
          </p>
        </div>

        {/* Compact 2-up tiles on phones, full 4-up row on large screens */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {items.map((item, idx) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <div
                key={`${item.title}-${idx}`}
                className="bg-white p-3.5 sm:p-5 rounded-2xl border border-stone-200/70 space-y-1.5 sm:space-y-3 shadow-xs hover:border-pink-300 hover:shadow-md transition-all"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pink-50 text-[#D92670] flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                </div>
                <h3 className="font-serif font-bold text-xs sm:text-sm text-[#0C163A] leading-snug">
                  {item.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-stone-500 leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
