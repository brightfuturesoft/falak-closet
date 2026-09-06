import React from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Flame, Tag, Truck, HelpCircle, ShieldCheck, Heart, User, ChevronDown } from 'lucide-react';
import { INITIAL_CATEGORIES } from '@/data/categories';
import { useCategories } from '@/lib/useCategories';
import { useCart } from '@/context/CartContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { wishlist } = useCart();
  const { categories: categoriesList } = useCategories({ fallback: INITIAL_CATEGORIES });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-sm bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-900 text-stone-100">
          <div>
            <span className="font-serif font-bold text-lg text-amber-400 tracking-wider">FALAK CLOSET</span>
            <p className="text-[10px] text-stone-400">Modest & Contemporary Haute Couture</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-300 hover:text-white rounded-full hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Promo Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-stone-950 font-medium text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Flame className="w-4 h-4 fill-amber-950 text-amber-950 animate-bounce" />
            Eid Flash Sale 25% Off
          </span>
          <Link
            href="/live-promotions"
            onClick={onClose}
            className="text-[11px] underline font-bold uppercase tracking-wider hover:opacity-80"
          >
            View Deals
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Shop Categories */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
              Collections
            </p>
            <div className="space-y-1">
              <Link
                href="/shop"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <span>All Products</span>
                <span className="text-xs text-stone-400">Shop All</span>
              </Link>
              {categoriesList.filter((cat) => !cat.type || cat.type === 'category').map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat.name)}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 text-sm font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                  >
                    <span>{cat.name}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Special Pages */}
          <div className="border-t border-stone-100 dark:border-stone-800 pt-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
              Quick Links
            </p>
            <Link
              href="/live-promotions"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span>Live Promotions</span>
            </Link>
            <Link
              href="/track"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Track Your Order</span>
            </Link>
            <Link
              href="/how-to-order"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>How to Order</span>
            </Link>
            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              <span>My Account & Orders</span>
            </Link>
            <Link
              href="/shop?wishlist=true"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Wishlist</span>
              </span>
              {wishlist.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-rose-100 text-rose-700 font-bold rounded-full">
                  {wishlist.length}
                </span>
              )}
            </Link>
          </div>

          {/* Customer Service & Policies */}
          <div className="border-t border-stone-100 dark:border-stone-800 pt-4 space-y-2 text-xs text-stone-500">
            <p className="font-semibold text-stone-700 dark:text-stone-300">Customer Support</p>
            <p>24/7 VIP Concierge: +1 (800) 555-FLK</p>
            <p>Email: support@falakcloset.com</p>

            <div className="flex flex-wrap gap-2 pt-2 text-[11px] text-stone-400">
              <Link href="/shipping" onClick={onClose} className="hover:underline">Shipping Policy</Link>
              <span>•</span>
              <Link href="/returns" onClick={onClose} className="hover:underline">Returns</Link>
              <span>•</span>
              <Link href="/privacy" onClick={onClose} className="hover:underline">Privacy</Link>
              <span>•</span>
              <Link href="/terms" onClick={onClose} className="hover:underline">Terms</Link>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <ShieldCheck className="w-4 h-4" /> 100% Guaranteed Authentic
          </span>
          <span className="text-[10px] uppercase tracking-wider font-mono">v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
