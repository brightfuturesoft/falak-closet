'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, Truck, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency, getProductVariationImage, getProductVariationPrice } from '@/lib/utils';

export default function CartClient() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    appliedCoupon,
    applyPromoCode,
    removePromoCode,
    promoNotice,
    discountAmount,
    shippingFee,
    totalAmount,
    freeShippingThreshold,
    freeShippingProgress,
    quantityFreeDelivery,
    selectedZoneName
  } = useCart();

  // Item selection state for cart checkout
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    return new Set(cart.map((item) => `${item.product?.id}-${item.selectedColor}-${item.selectedSize}`));
  });

  // Sync selected keys when cart items change
  React.useEffect(() => {
    setSelectedKeys((prev) => {
      const next = new Set<string>();
      cart.forEach((item) => {
        const key = `${item.product?.id}-${item.selectedColor}-${item.selectedSize}`;
        if (prev.has(key) || prev.size === 0) {
          next.add(key);
        }
      });
      return next.size > 0 ? next : new Set(cart.map((item) => `${item.product?.id}-${item.selectedColor}-${item.selectedSize}`));
    });
  }, [cart]);

  const toggleSelectKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allKeys = cart.map((item) => `${item.product?.id}-${item.selectedColor}-${item.selectedSize}`);
    if (selectedKeys.size === allKeys.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(allKeys));
    }
  };

  // Promo Form Input
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim() || isValidatingPromo) return;

    setIsValidatingPromo(true);
    setPromoMessage(null);

    const res = await applyPromoCode(promoCodeInput.trim());
    if (res.success) {
      setPromoMessage({ type: 'success', text: res.message });
      setPromoCodeInput('');
    } else {
      setPromoMessage({ type: 'error', text: res.message });
    }
    setIsValidatingPromo(false);
  };

  // Calculate totals for selected items
  const selectedCartItems = cart.filter((item) =>
    selectedKeys.has(`${item.product?.id}-${item.selectedColor}-${item.selectedSize}`)
  );

  const selectedSubtotal = selectedCartItems.reduce(
    (sum, item) =>
      sum + getProductVariationPrice(item.product, item.selectedColor, item.selectedSize) * item.quantity,
    0
  );

  const selectedCount = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-[#FDF2F3] rounded-full flex items-center justify-center mx-auto text-[#A80C14]">
          <ShoppingBag className="w-10 h-10" />
        </div>

        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-stone-900">
          Your Shopping Cart is Empty
        </h1>

        <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
          Explore our latest collection of handcrafted abayas, luxury hijabs, and modest fashion creations.
        </p>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#A80C14] hover:bg-[#8C0A10] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-colors"
        >
          <span>Discover Haute Couture</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 pb-36 lg:pb-12 text-stone-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F8D2D5] pb-6 gap-4">
        <div>
          <span className="px-3.5 py-1 bg-[#FDF2F3] text-[#A80C14] text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-[#F8D2D5]">
            <ShoppingBag className="w-3.5 h-3.5" /> Shopping Bag
          </span>
          <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2">
            Your Cart ({cart.length} items)
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Selected <strong className="text-stone-900">{selectedCount}</strong> items for express checkout
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-stone-400 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      {/* Free Shipping Progress Indicator */}
      {((freeShippingThreshold > 0 && freeShippingThreshold < Infinity) || quantityFreeDelivery) && (
        <div className="p-4 bg-white rounded-3xl border border-[#F8D2D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-stone-900">
              <Truck className="w-4 h-4 text-[#A80C14]" />
              {freeShippingProgress >= 100 || quantityFreeDelivery?.unlocked ? (
                <strong className="text-emerald-700">
                  {quantityFreeDelivery?.unlocked
                    ? `Congratulations! You unlocked FREE Delivery via "${quantityFreeDelivery.productName}" Qty! 🚚`
                    : 'Congratulations! You unlocked FREE Nationwide Delivery!'}
                </strong>
              ) : (
                <span>
                  {quantityFreeDelivery ? (
                    <span>
                      Buy <strong className="text-[#A80C14]">{quantityFreeDelivery.requiredQty - quantityFreeDelivery.currentQty}</strong> more of <strong className="text-stone-900">"{quantityFreeDelivery.productName}"</strong> for FREE Delivery!
                    </span>
                  ) : (
                    <span>Add <strong className="text-[#A80C14]">{formatCurrency(freeShippingThreshold - subtotal)}</strong> more for FREE Shipping!</span>
                  )}
                </span>
              )}
            </span>
            {freeShippingThreshold > 0 && freeShippingThreshold < Infinity && (
              <span className="font-mono text-stone-500">
                {freeShippingProgress >= 100 || quantityFreeDelivery?.unlocked
                  ? '100%'
                  : `${Math.round(freeShippingProgress)}%`}
              </span>
            )}
          </div>

          {freeShippingThreshold > 0 && freeShippingThreshold < Infinity && (
            <div className="w-full h-2 bg-[#FDF2F3] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#A80C14] to-[#F5C77E] transition-all duration-500 rounded-full"
                style={{
                  width: `${freeShippingProgress >= 100 || quantityFreeDelivery?.unlocked
                    ? 100
                    : Math.min(100, freeShippingProgress)
                    }%`
                }}
              />
            </div>
          )}
          {shippingFee > 0 && (
            <p className="text-[10px] text-stone-500 font-sans">
              Delivery to {selectedZoneName}: ৳{shippingFee} (final fee set at checkout)
            </p>
          )}
        </div>
      )}

      {/* Main Grid: Cart Items List + Order Summary Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Select All Checkbox */}
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
              <input
                type="checkbox"
                checked={selectedKeys.size === cart.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#A80C14] rounded cursor-pointer"
              />
              <span>Select All Items ({cart.length})</span>
            </label>
            <span className="text-stone-400">{selectedKeys.size} selected</span>
          </div>

          {/* Item Row Loop */}
          <div className="divide-y divide-[#F8D2D5] border border-[#F8D2D5] rounded-3xl overflow-hidden bg-white shadow-xs">
            {cart.map((item) => {
              const key = `${item.product?.id}-${item.selectedColor}-${item.selectedSize}`;
              const isSelected = selectedKeys.has(key);
              const mainImage = getProductVariationImage(item.product, item.selectedColor);

              return (
                <div key={key} className="p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectKey(key)}
                      className="w-4 h-4 accent-[#A80C14] rounded cursor-pointer shrink-0"
                    />

                    <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-[#F8D2D5] shadow-xs">
                      <Image src={mainImage} alt={item.product?.name || 'Product'} fill sizes="80px" className="object-cover" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <Link href={`/product/${item.product?.slug || ''}`} className="font-bold text-stone-900 hover:text-[#A80C14] text-sm sm:text-base line-clamp-1">
                        {item.product?.name}
                      </Link>
                      <p className="text-[11px] text-stone-400 font-mono">Code: {item.product?.code || 'FLK'}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-600">
                        {item.selectedColor && (
                          <span className="font-bold text-[#A80C14]">
                            <span className="text-stone-900">Color:</span> {item.selectedColor}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="font-bold text-[#A80C14]">
                            <span className="text-stone-900">Size:</span> {item.selectedSize}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Unit Price */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-extrabold text-[#A80C14] text-base sm:text-lg font-mono">
                      {formatCurrency(
                        getProductVariationPrice(item.product, item.selectedColor, item.selectedSize) * item.quantity
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-stone-200 rounded-full overflow-hidden bg-stone-50">
                        <button
                          onClick={() => updateQuantity(item.product?.id || '', item.selectedColor, item.selectedSize, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-700 hover:bg-[#FDF2F3] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold font-mono text-stone-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product?.id || '', item.selectedColor, item.selectedSize, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-700 hover:bg-[#FDF2F3] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product?.id || '', item.selectedColor, item.selectedSize)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-[#F8D2D5] shadow-xs space-y-6">
            <h3 className="font-bold text-base uppercase tracking-wider text-stone-900 border-b border-[#F8D2D5] pb-3">
              Order Summary
            </h3>

            {/* Promo Code Form */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#A80C14]" /> Promo Voucher Code
              </label>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <div>
                    <span className="font-mono font-bold text-emerald-800 uppercase">🎟 {appliedCoupon.code}</span>
                    <p className="text-[10px] text-emerald-600">Saved {formatCurrency(discountAmount)}</p>
                  </div>
                  <button onClick={removePromoCode} className="text-xs text-rose-600 hover:underline font-bold">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="Enter code (e.g. FALAK10)"
                    className="flex-1 px-3.5 py-2 bg-stone-50 border border-[#F8D2D5] rounded-full text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#A80C14]"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingPromo || !promoCodeInput.trim()}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-full transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isValidatingPromo ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}

              {promoMessage && (
                <p className={`text-[11px] font-bold ${promoMessage.type === 'success' ? 'text-emerald-600' : 'text-[#A80C14]'}`}>
                  {promoMessage.text}
                </p>
              )}

              {promoNotice && (
                <p className="text-[11px] font-bold text-amber-600 mt-1">
                  ⚠️ {promoNotice}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs text-stone-600 border-t border-[#F8D2D5] pt-4">
              <div className="flex justify-between">
                <span>Selected Subtotal:</span>
                <span className="font-mono font-bold text-stone-900">{formatCurrency(selectedSubtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({appliedCoupon?.code || 'Applied'}):</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Nationwide Shipping:</span>
                <span className="font-mono font-bold text-stone-900">
                  {shippingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : formatCurrency(shippingFee)}
                </span>
              </div>

              <div className="flex justify-between border-t border-[#F8D2D5] pt-3 text-base font-extrabold text-stone-900">
                <span>Total Amount:</span>
                <span className="font-mono text-[#A80C14]">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <Link
              href="/checkout"
              className="w-full py-4 bg-[#A80C14] hover:bg-[#8C0A10] text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Express Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="p-3 bg-[#FDF2F3] border border-[#F8D2D5] rounded-2xl text-[11px] text-stone-500 space-y-1">
              <p className="flex items-center gap-1 font-bold text-stone-800">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A80C14]" /> Safe & Secure Checkout Guarantee
              </p>
              <p>Cash on Delivery (COD), bKash, and Mobile Banking accepted across Bangladesh.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
