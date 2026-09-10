'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Zap,
  SlidersHorizontal,
  X,
  Plus,
  Minus,
  Check,
  ChevronUp,
  PackageCheck
} from 'lucide-react';
import { Product, ProductColor } from '@/data/products';
import { formatCurrency } from '@/lib/utils';
import { SmartImage } from '@/components/ui/SmartImage';

// Fallback color hex mapping for common color names
const COLOR_HEX_MAP: Record<string, string> = {
  'parrot green': '#4CAF50',
  'creamy golden': '#E6C280',
  'burnt terracotta': '#C85A32',
  'burnt orange': '#E65100',
  'white': '#FFFFFF',
  'pistachio': '#93C572',
  'yellow': '#FFEB3B',
  'cosmic orange': '#FF6F00',
  'powder blue': '#B0E0E6',
  'mint': '#98FF98',
  'black': '#1A1A1A',
  'butter scotch': '#E3A857',
  'red': '#E53935',
  'golden': '#FFD700',
  'pink': '#FF80AB',
  'dusty mint': '#80B3A0',
  'ash': '#B0BEC5',
  'dusty pink': '#D8A7B1',
  'denim blue': '#1565C0',
  'baby pink': '#F4C2C2',
  'mauve lavender': '#E1BEE7',
  'vanilla white': '#FDFBF7',
  'soft grey': '#D6D6D6',
  'blush mauve': '#C8A2C8',
  'cinnamon': '#D2691E',
  'skin': '#F5CBA7',
  'nude peach': '#FADBD8',
  'orchid': '#DA70D6',
  'french vanilla': '#F3E5AB',
  'mustard': '#E65100',
  'cool ash': '#90A4AE',
  'pearl white': '#F8F9FA',
  'smokey ash': '#607D8B',
  'off white': '#FAF9F6',
  'blush peach': '#FFDAB9',
  'mayonnaise': '#FEF9E7',
  'blue ash': '#78909C',
  'coral pink': '#FF6F61',
  'nude golden': '#E5C158',
  'candy pink': '#FF69B4',
};

function getColorBadgeStyles(hex?: string, name?: string) {
  let finalHex = hex;
  if ((!finalHex || finalHex === '#000000' || finalHex === '#000') && name) {
    const lower = name.toLowerCase().trim();
    if (COLOR_HEX_MAP[lower]) {
      finalHex = COLOR_HEX_MAP[lower];
    }
  }
  if (!finalHex || finalHex === '#000000' || finalHex === '#000') {
    finalHex = '#E5E7EB';
  }
  const cleanHex = finalHex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const isLight = brightness > 180;
  return {
    hex: finalHex,
    bg: finalHex,
    color: isLight ? '#1c1917' : '#ffffff',
    border: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)',
    dotBg: isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
  };
}

interface MobileProductBottomBarProps {
  product: Product;
  colorsList: ProductColor[];
  selectedColor: string;
  onSelectColor: (colorName: string) => void;
  sizesList: string[];
  selectedSize: string;
  onSelectSize: (size: string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  currentPrice: number;
  currentStock: number;
  isOutOfStock: boolean;
  activeImage: string;
  onAddToCart: () => void;
  onBuyNow: () => void;
  stockForSize?: (colorName: string, size: string) => number | undefined;
}

export function MobileProductBottomBar({
  product,
  colorsList,
  selectedColor,
  onSelectColor,
  sizesList,
  selectedSize,
  onSelectSize,
  quantity,
  onQuantityChange,
  currentPrice,
  currentStock,
  isOutOfStock,
  activeImage,
  onAddToCart,
  onBuyNow,
  stockForSize,
}: MobileProductBottomBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeColorBadge = getColorBadgeStyles(
    colorsList.find((c) => c.name.toLowerCase() === selectedColor.toLowerCase())?.hex,
    selectedColor
  );

  const discountPercent =
    product.originalPrice && product.originalPrice > currentPrice
      ? Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100)
      : 0;

  return (
    <>
      {/* Quick Variation / Details Sheet (Mobile Bottom Sheet Modal) */}
      {isDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end justify-center animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setIsDrawerOpen(false)}
        >
          <div className="bg-white w-full rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250 mb-[calc(66px+env(safe-area-inset-bottom))] border-t border-[#F8D2D5]">
            {/* Drawer Header */}
            <div className="shrink-0 bg-stone-50/80 border-b border-stone-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-100">
                  <SmartImage
                    src={activeImage}
                    alt={product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-extrabold text-[#A80C14] font-mono text-sm">
                      {formatCurrency(currentPrice * quantity)}
                    </span>
                    {product.originalPrice && product.originalPrice > currentPrice && (
                      <span className="text-[10px] text-stone-400 line-through">
                        {formatCurrency(product.originalPrice * quantity)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 -mr-1 hover:bg-stone-200/60 rounded-full transition-colors cursor-pointer"
                aria-label="Close options"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Color Options */}
              {colorsList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800">
                      Color: <span className="text-[#A80C14]">{selectedColor}</span>
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {colorsList.length} available
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colorsList.map((col) => {
                      const isSelected = col.name.toLowerCase() === selectedColor.toLowerCase();
                      const badge = getColorBadgeStyles(col.hex, col.name);
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => onSelectColor(col.name)}
                          style={{
                            backgroundColor: isSelected ? badge.bg : '#F5F5F4',
                            color: isSelected ? badge.color : '#292524',
                            borderColor: isSelected ? '#A80C14' : 'transparent',
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${isSelected
                            ? 'ring-2 ring-[#A80C14]/40 shadow-xs scale-105'
                            : 'hover:bg-stone-200/80 border-stone-200'
                            }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: badge.dotBg }}
                          />
                          <span>{col.name}</span>
                          {isSelected && <Check className="w-3 h-3 shrink-0 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size / Variation Options */}
              {sizesList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800">
                      Size / Variation: <span className="text-[#A80C14]">{selectedSize}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizesList.map((sz) => {
                      const isSelected = sz === selectedSize;
                      const szStock = stockForSize ? stockForSize(selectedColor, sz) : undefined;
                      const isSzOutOfStock = szStock !== undefined && szStock <= 0;

                      return (
                        <button
                          key={sz}
                          type="button"
                          disabled={isSzOutOfStock}
                          onClick={() => onSelectSize(sz)}
                          className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${isSelected
                            ? 'bg-[#A80C14] text-white border-[#A80C14] shadow-xs'
                            : isSzOutOfStock
                              ? 'bg-stone-100 text-stone-400 border-stone-200 line-through cursor-not-allowed'
                              : 'bg-white text-stone-800 border-stone-300 hover:border-stone-400'
                            }`}
                        >
                          <span>{sz}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-800">Quantity</span>
                <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-200/70 disabled:opacity-30 cursor-pointer active:scale-95"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-extrabold text-xs text-stone-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(Math.min(currentStock || 99, quantity + 1))}
                    disabled={quantity >= currentStock}
                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-200/70 disabled:opacity-40 cursor-pointer active:scale-95"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stock Status Badge */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <PackageCheck className={`w-3.5 h-3.5 ${isOutOfStock ? 'text-rose-500' : 'text-emerald-600'}`} />
                  <span className={isOutOfStock ? 'text-rose-600 font-bold' : 'text-stone-700 font-medium'}>
                    {isOutOfStock ? 'Out of Stock' : currentStock <= 5 ? `Low Stock (${currentStock} left)` : 'In Stock'}
                  </span>
                </div>
                <span className="font-mono text-stone-400">Code: {product.code || 'VAR'}</span>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-2 px-3 bg-white border-t border-stone-100 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onAddToCart();
                }}
                disabled={isOutOfStock}
                className="flex-1 min-h-[38px] px-3 py-1 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 disabled:bg-stone-200 disabled:text-stone-400 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.97] whitespace-nowrap disabled:cursor-not-allowed border border-stone-800"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-stone-200 shrink-0" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onBuyNow();
                }}
                disabled={isOutOfStock}
                className="flex-1 min-h-[38px] px-3 py-1 bg-gradient-to-r from-[#9B050B] via-[#B50B12] to-[#800409] hover:brightness-110 active:scale-[0.97] disabled:bg-stone-200 disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-400 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#9B050B]/25 border border-[#D11A22]/40 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:cursor-not-allowed"
              >
                <Zap className="w-3.5 h-3.5 fill-white text-white shrink-0" />
                <span>{isOutOfStock ? 'Sold Out' : 'Buy Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky Bottom Navigation Bar for Mobile */}
      {/* Positioned at fixed bottom-[calc(58px+env(safe-area-inset-bottom))] left-0 right-0 z-40 so it sits right above MobileBottomNav cleanly */}
      <div className="lg:hidden fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F8D2D5] shadow-[0_-8px_24px_rgba(0,0,0,0.12)] flex flex-col animate-fade-in">
        {/* Top Tier: Price & Selected Variant Summary Bar (Compact) */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          className="px-3.5 py-1.5 min-h-[36px] bg-stone-50/90 border-b border-stone-100 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-stone-100/80 active:bg-stone-200/60 transition-colors group/mobiletopbar"
          title="Tap to change color, size or quantity"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono font-extrabold text-[#9B050B] text-xs sm:text-sm leading-none">
              {formatCurrency(currentPrice * quantity)}
            </span>
            {discountPercent > 0 && (
              <span className="text-[8px] font-bold text-[#9B050B] bg-[#FFF0F6] border border-[#F8D2D5] px-1 py-0.2 rounded-full">
                -{discountPercent}%
              </span>
            )}
            {product.originalPrice && product.originalPrice > currentPrice && (
              <span className="text-[9px] text-stone-400 line-through font-mono hidden xs:inline">
                {formatCurrency(product.originalPrice * quantity)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-700 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0 border border-black/10"
              style={{ backgroundColor: activeColorBadge.dotBg }}
            />
            <span className="truncate max-w-[70px] font-bold text-stone-900">{selectedColor}</span>
            <span className="text-stone-300">•</span>
            <span className="font-mono font-bold text-stone-900">{selectedSize}</span>
            <span className="text-[9px] font-bold text-[#9B050B] bg-white border border-[#9B050B]/30 px-1.5 py-0.2 rounded flex items-center gap-0.5 group-hover/mobiletopbar:bg-[#9B050B] group-hover/mobiletopbar:text-white transition-colors shrink-0 ml-0.5">
              <span>Change</span>
              <SlidersHorizontal className="w-2 h-2" />
            </span>
          </div>
        </button>

        {/* Bottom Tier: Sleek Compact Action Buttons */}
        <div className="p-1.5 px-3 flex items-center gap-2 bg-white">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className="flex-1 min-h-[38px] px-3 py-1 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 disabled:bg-stone-200 disabled:text-stone-400 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.97] whitespace-nowrap disabled:cursor-not-allowed border border-stone-800"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-stone-200 shrink-0" />
            <span className="truncate">{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>

          <button
            type="button"
            onClick={onBuyNow}
            disabled={isOutOfStock}
            className="flex-1 min-h-[38px] px-3 py-1 bg-gradient-to-r from-[#9B050B] via-[#B50B12] to-[#800409] hover:brightness-110 active:scale-[0.97] disabled:bg-stone-200 disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-400 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#9B050B]/25 border border-[#D11A22]/40 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:cursor-not-allowed"
          >
            <Zap className="w-3.5 h-3.5 fill-white text-white shrink-0" />
            <span className="truncate">{isOutOfStock ? 'Sold Out' : 'Buy Now'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
