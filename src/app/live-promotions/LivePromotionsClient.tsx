'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, Copy, Check, ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { useCart } from '@/context/CartContext';

function CountdownTimer({ expiryTimestamp }: { expiryTimestamp: number }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, expiryTimestamp - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTimestamp]);

  return (
    <div className="flex items-center gap-1.5 font-mono text-[#D92670] font-extrabold text-sm bg-pink-100 px-3 py-1.5 rounded-full border border-pink-200 shadow-xs">
      <Clock className="w-4 h-4" />
      <span>
        {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
}

export default function LivePromotionsClient() {
  const { products } = useCart();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<any[]>([]);

  useEffect(() => {
    import('@/actions/orderActions').then(({ getPromotions }) => {
      getPromotions().then((res) => {
        if (res.success && res.promotions) {
          const mapped = res.promotions.map((promo: any) => {
            const badge = promo.discountType === 'percentage'
              ? `${promo.discountValue}% OFF`
              : `৳${promo.discountValue} OFF`;
            const title = `Falak Closet Coupon - ${promo.code}`;
            const subtitle = promo.discountType === 'percentage'
              ? `Save ${promo.discountValue}% on orders over ৳${promo.minSpend.toLocaleString()}${promo.maxDiscount ? ` (Up to ৳${promo.maxDiscount})` : ''}`
              : `Flat ৳${promo.discountValue} discount on orders over ৳${promo.minSpend.toLocaleString()}`;
            return {
              id: promo.id || promo.code,
              code: promo.code,
              discountBadge: badge,
              minSpend: promo.minSpend,
              title,
              subtitle
            };
          });
          setPromotions(mapped);
        }
      });
    });
  }, []);

  const flashProducts = products.filter((p) => p.isFlashSale);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 pb-28 lg:pb-12 text-stone-900">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="px-3.5 py-1 bg-pink-100 text-[#D92670] text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
          <Flame className="w-4 h-4 fill-[#D92670]" /> Special Discounts & Vouchers.
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-stone-900">
          Live Seasonal Offers & Flash Deals
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Apply promotional codes at checkout for instant savings across Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="p-6 bg-white rounded-3xl border border-pink-100 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-pink-100 text-[#D92670] text-[10px] font-extrabold rounded-lg uppercase">
                  {promo.discountBadge}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Min. ৳{promo.minSpend || 1000}</span>
              </div>
              <h3 className="font-bold text-base text-stone-900">{promo.title}</h3>
              <p className="text-xs text-stone-500">{promo.subtitle}</p>
            </div>

            <div className="pt-4 border-t border-pink-50 flex items-center justify-between gap-2">
              <div className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-2xl font-mono font-extrabold text-stone-900 text-xs tracking-wider">
                {promo.code}
              </div>
              <button
                onClick={() => handleCopyCode(promo.code)}
                className="px-4 py-2 bg-[#D92670] hover:bg-[#C2185B] text-white text-xs font-bold rounded-2xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode === promo.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode === promo.code ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {flashProducts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-pink-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-sans text-2xl font-extrabold text-stone-900 flex items-center gap-2">
                <Flame className="w-6 h-6 text-[#D92670] fill-[#D92670]" /> Limited-Time Flash Sale Items
              </h2>
              <p className="text-xs text-stone-500">Up to 30% discount on select modest designs.</p>
            </div>
            <CountdownTimer expiryTimestamp={Date.now() + 18 * 60 * 60 * 1000} />
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
