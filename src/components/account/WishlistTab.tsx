'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

export function WishlistTab() {
  const { wishlist } = useCart();

  return (
    <div className="space-y-4">
      {wishlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {wishlist.map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.slug}`}
              className="group bg-white rounded-2xl border border-stone-200/70 hover:border-[#A80C14]/40 hover:shadow-md overflow-hidden transition-all"
            >
              <div className="relative aspect-[3/4] bg-stone-50 overflow-hidden">
                {item.images?.[0] ? (
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-stone-200" />
                  </div>
                )}
                <span className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xs">
                  <Heart className="w-3.5 h-3.5 text-[#A80C14] fill-[#A80C14]" />
                </span>
              </div>

              <div className="p-3 space-y-2">
                <p className="font-bold text-[#0D153A] text-xs line-clamp-1">{item.name}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[#A80C14] font-extrabold text-sm">
                    {formatCurrency(item.price)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-400 group-hover:text-[#A80C14] uppercase tracking-wide transition-colors">
                    View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-10 text-center bg-white rounded-3xl border border-stone-200/70 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FDF2F3] border border-[#F8D2D5] flex items-center justify-center">
            <Heart className="w-7 h-7 text-[#A80C14]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-base text-[#0D153A]">Your wishlist is empty</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Tap the heart on any product to save it here for later.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#A80C14] hover:bg-[#8C0A10] text-white text-xs font-bold rounded-full transition-colors"
          >
            Discover Collections <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
