'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

export function WishlistTab() {
  const { wishlist } = useCart();

  return (
    <div className="space-y-4">
      <h2 className="font-serif font-bold text-base text-[#0C163A]">
        Saved Items ({wishlist.length})
      </h2>
      {wishlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {wishlist.map(item => (
            <div
              key={item.id}
              className="p-3 bg-white rounded-2xl border border-[#F2C76E]/40 space-y-2 text-xs"
            >
              <p className="font-bold text-[#0C163A] line-clamp-1">{item.name}</p>
              <p className="font-mono text-[#9B050B] font-extrabold">
                {formatCurrency(item.price)}
              </p>
              <Link
                href={`/product/${item.slug}`}
                className="block text-center py-1.5 bg-[#9B050B] text-[#FFFBF0] font-bold rounded-xl text-[11px]"
              >
                View Product
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#F2C76E]/40 space-y-2">
          <Heart className="w-8 h-8 text-[#9B050B] mx-auto" />
          <p className="text-xs text-stone-500 font-medium">Your wishlist is empty.</p>
        </div>
      )}
    </div>
  );
}
