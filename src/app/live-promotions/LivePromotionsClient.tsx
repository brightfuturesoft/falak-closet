'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Clock, Copy, Check } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { PromotionBanner } from '@/lib/promotionBanners';
import { Product } from '@/data/products';

interface CountdownTimerProps {
  saleEndsAt: string;
}

function CountdownTimer({ saleEndsAt }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = new Date(saleEndsAt).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, target - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [saleEndsAt]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-[#D92670] font-extrabold text-sm bg-pink-100 px-3 py-1.5 rounded-full border border-pink-200 shadow-xs">
        <Clock className="w-4 h-4" />
        <span>00h : 00m : 00s</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 font-mono text-[#D92670] font-extrabold text-sm bg-pink-100 px-3 py-1.5 rounded-full border border-pink-200 shadow-xs animate-pulse">
      <Clock className="w-4 h-4" />
      <span>
        {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
}

interface LivePromotionsClientProps {
  banners: PromotionBanner[];
  flashProducts: Product[];
  saleEndsAt: string | null;
}

export default function LivePromotionsClient({
  banners,
  flashProducts,
  saleEndsAt
}: LivePromotionsClientProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
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
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 pb-28 lg:pb-12 text-stone-900">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="px-3.5 py-1 bg-pink-100 text-[#D92670] text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
          <Flame className="w-4 h-4 fill-[#D92670]" /> Special Discounts & Vouchers
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-stone-900">
          Live Seasonal Offers & Flash Deals
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Apply promotional codes at checkout for instant savings across Bangladesh.
        </p>
      </div>

      {banners.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-pink-100 shadow-xs max-w-xl mx-auto space-y-3">
          <Flame className="w-10 h-10 mx-auto text-[#D92670] fill-[#D92670]/20 animate-pulse" />
          <h3 className="font-bold text-lg text-stone-900">No live offers right now</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            We are preparing new discount vouchers and flash deals. Check back soon for exclusive modest fashion collections!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {banners.map((promo) => (
            <div
              key={promo.id}
              className="p-6 bg-white rounded-3xl border border-pink-100 shadow-xs space-y-4 flex flex-col justify-between hover:border-[#D92670]/30 transition-all duration-300"
            >
              <div className="space-y-3">
                {promo.bannerImage && (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-stone-100">
                    <img
                      src={promo.bannerImage}
                      alt={promo.title}
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-pink-100 text-[#D92670] text-[10px] font-extrabold rounded-lg uppercase">
                      {promo.discountBadge}
                    </span>
                    {promo.minSpend !== null && (
                      <span className="text-[10px] text-stone-500 font-mono">
                        Min. ৳{promo.minSpend.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-stone-900 leading-tight">{promo.title}</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">{promo.subtitle}</p>
                </div>
              </div>

              {promo.code && (
                <div className="pt-4 border-t border-pink-50 flex items-center justify-between gap-2">
                  <div className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-2xl font-mono font-extrabold text-stone-900 text-xs tracking-wider uppercase">
                    {promo.code}
                  </div>
                  <button
                    onClick={() => handleCopyCode(promo.code!)}
                    className="px-4 py-2 bg-[#D92670] hover:bg-[#C2185B] text-white text-xs font-bold rounded-2xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode === promo.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode === promo.code ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {flashProducts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-pink-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-sans text-2xl font-extrabold text-stone-900 flex items-center gap-2">
                <Flame className="w-6 h-6 text-[#D92670] fill-[#D92670]" /> Limited-Time Flash Sale Items
              </h2>
              <p className="text-xs text-stone-500">Up to 30% discount on select modest designs.</p>
            </div>
            {saleEndsAt && <CountdownTimer saleEndsAt={saleEndsAt} />}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {flashProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
