'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  Lock,
  ArrowRight,
  ArrowLeft,
  X,
  Banknote,
  Smartphone,
  ChevronDown,
  ShoppingBag,
  Ticket
} from 'lucide-react';
import { useCart, OrderRecord, DeliverySubArea } from '@/context/CartContext';
import { useAnalytics } from '@/context/AnalyticsContext';

/** Shared 44px-touch-target text field. */
function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = true,
  autoComplete,
  inputMode,
  pattern,
  maxLength,
  className = '',
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'numeric' | 'email';
  pattern?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={`co-${name}`} className="text-[11px] sm:text-xs font-bold text-stone-700">
        {label} {required && <span className="text-[#D92670]">*</span>}
      </label>
      <input
        id={`co-${name}`}
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        className="w-full min-h-[44px] px-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D92670] focus:border-transparent transition-shadow"
      />
    </div>
  );
}

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const {
    cart,
    subtotal: cartSubtotal,
    discountAmount,
    shippingFee: cartShippingFee,
    placeOrder,
    deliveryZones,
    selectedZoneId,
    selectedSubAreaId,
    setSelectedZone,
    selectedZoneName,
    selectedSubAreaName,
    appliedCoupon,
    applyPromoCode,
    removePromoCode,
    promoNotice,
    totalAmount: cartTotalAmount,
    user,
    getProductBySlug,
    products,
    freeShippingThreshold,
  } = useCart();
  const { trackEvent } = useAnalytics();

  // ── Buy Now Mode ─────────────────────────────────────────────────────────────
  // When the user clicks "Buy Now" on a product card, we encode the item into
  // the URL. The checkout then shows ONLY that item — the cart is untouched.
  const buyNowProductId = searchParams.get('buyNow');
  const buyNowColor = searchParams.get('color') ?? '';
  const buyNowSize = searchParams.get('size') ?? '';
  const buyNowQty = Math.max(1, parseInt(searchParams.get('qty') ?? '1', 10));

  const buyNowProduct = useMemo(() => {
    if (!buyNowProductId) return null;
    return products.find((p) => p.id === buyNowProductId) ??
      getProductBySlug(buyNowProductId) ??
      null;
  }, [buyNowProductId, products, getProductBySlug]);

  const buyNowItems = useMemo(() => {
    if (!buyNowProduct) return null;
    return [{
      product: buyNowProduct,
      selectedColor: buyNowColor || buyNowProduct.colors?.[0]?.name || '',
      selectedSize: buyNowSize || buyNowProduct.sizes?.[0] || 'Free Size',
      quantity: buyNowQty,
    }];
  }, [buyNowProduct, buyNowColor, buyNowSize, buyNowQty]);

  // Use buyNow items when in that mode, otherwise fall back to cart
  const activeItems = buyNowItems ?? cart;

  // Recompute totals when in buyNow mode (ignore promo/shipping for simplicity;
  // shipping logic mirrors CartContext)
  const subtotal = useMemo(() => {
    if (!buyNowItems) return cartSubtotal;
    return buyNowItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  }, [buyNowItems, cartSubtotal]);

  const shippingFee = useMemo(() => {
    if (!buyNowItems) return cartShippingFee;
    return subtotal >= freeShippingThreshold ? 0 : cartShippingFee;
  }, [buyNowItems, cartShippingFee, subtotal, freeShippingThreshold]);

  const totalAmount = useMemo(() => {
    if (!buyNowItems) return cartTotalAmount;
    return Math.max(0, subtotal + shippingFee);
  }, [buyNowItems, cartTotalAmount, subtotal, shippingFee]);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    country: 'Bangladesh',
    postalCode: ''
  });

  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isIpBlocked, setIsIpBlocked] = useState(false);
  const [userIp] = useState<string>('103.24.12.89');

  // Mobile summary disclosure + sticky CTA
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // bKash manual payment settings state
  const [bkashSettings, setBkashSettings] = useState<{
    bkashNumber?: string;
    bkashAccountType?: string;
    instructions?: string[];
  } | null>(null);
  const [isBkashModalOpen, setIsBkashModalOpen] = useState(false);
  const [bkashSenderNumber, setBkashSenderNumber] = useState('');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [bkashError, setBkashError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyNumber = () => {
    if (bkashSettings?.bkashNumber) {
      navigator.clipboard.writeText(bkashSettings.bkashNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Auto-select zone based on user's district
  React.useEffect(() => {
    if (!formData.city || deliveryZones.length === 0) return;
    const cleanCity = formData.city.toLowerCase().trim();
    if (cleanCity.includes('dhaka')) {
      const dhakaZone = deliveryZones.find(z => z.name.toLowerCase().includes('inside dhaka'));
      if (dhakaZone && selectedZoneId !== dhakaZone.id) {
        setSelectedZone(dhakaZone.id, null);
      }
    } else {
      const outsideZone = deliveryZones.find(z => z.name.toLowerCase().includes('outside dhaka'));
      if (outsideZone && selectedZoneId !== outsideZone.id) {
        setSelectedZone(outsideZone.id, null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.city, deliveryZones]);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings?key=payment');
        const data = await res.json();
        if (data.success && data.setting) {
          setBkashSettings(data.setting.value);
        }
      } catch {
        console.error('Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

  // Auto fill shipping address
  React.useEffect(() => {
    if (user) {
      Promise.resolve().then(() => {
        if (user.email) setUserEmail(user.email);
        setFormData((prev) => ({
          ...prev,
          fullName: user.name || prev.fullName,
          phone: user.phone || prev.phone,
          city: user.district || prev.city,
          street: user.fullAddress || prev.street,
        }));
      });
    }
  }, [user]);

  // Check IP blocking status
  React.useEffect(() => {
    const checkBlockedIp = async () => {
      try {
        const res = await fetch('/api/security/block-ip');
        const data = await res.json();
        const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
        const allBlocked = [...(data.blockedIps || []), ...localBlocked];
        const isBlocked = allBlocked.some((b: { ip: string }) => b.ip === userIp);
        if (isBlocked) setIsIpBlocked(true);
      } catch {
        const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
        if (localBlocked.some((b: { ip: string }) => b.ip === userIp)) setIsIpBlocked(true);
      }
    };
    if (userIp) {
      checkBlockedIp();
    }
  }, [userIp]);

  // While the bKash sheet is open: lock background scroll, close on Escape
  // (the main form submit already intercepts the bKash flow).
  useEffect(() => {
    if (!isBkashModalOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsBkashModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isBkashModalOpen]);

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery (COD)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setIsValidatingPromo(true);
    setPromoFeedback(null);

    const res = await applyPromoCode(promoCodeInput.trim());
    if (res.success) {
      setPromoFeedback({ type: 'success', message: res.message });
      setPromoCodeInput('');
    } else {
      setPromoFeedback({ type: 'error', message: res.message });
    }
    setIsValidatingPromo(false);
  };
  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItems.length === 0 || isIpBlocked) return;

    if (paymentMethod === 'bKash Send Money (Manual)' && !isBkashModalOpen) {
      // Intercept to display the gateway-style bKash payment portal first
      setIsBkashModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setBkashError(null);

    try {
      const orderPayload: {
        items: typeof activeItems;
        subtotal: number;
        discount: number;
        shippingFee: number;
        total: number;
        shippingAddress: typeof formData;
        deliveryMethod: string;
        paymentMethod: string;
        userEmail?: string;
        userIp: string;
        deliveryZone: string;
        deliverySubArea?: string;
        paymentSenderNumber?: string;
        paymentTrxId?: string;
        paymentStatus?: string;
        promoCode?: string;
      } = {
        items: activeItems,
        subtotal,
        discount: buyNowItems ? 0 : discountAmount,
        shippingFee,
        total: totalAmount,
        shippingAddress: formData,
        deliveryMethod: selectedZoneName + (selectedSubAreaName ? ` - ${selectedSubAreaName}` : ''),
        paymentMethod,
        userEmail,
        userIp,
        deliveryZone: selectedZoneName,
        deliverySubArea: selectedSubAreaName || undefined,
        promoCode: appliedCoupon?.code || undefined
      };

      if (paymentMethod === 'bKash Send Money (Manual)') {
        if (!/^01\d{9}$/.test(bkashSenderNumber.trim())) {
          setBkashError('Please enter a valid 11-digit bKash number.');
          setIsSubmitting(false);
          return;
        }
        if (!bkashTrxId.trim() || bkashTrxId.trim().length < 6) {
          setBkashError('Please enter a valid Transaction ID.');
          setIsSubmitting(false);
          return;
        }
        orderPayload.paymentSenderNumber = bkashSenderNumber.trim();
        orderPayload.paymentTrxId = bkashTrxId.trim().toUpperCase();
        orderPayload.paymentStatus = 'Pending';
      }

      const order = await placeOrder(orderPayload);

      trackEvent('purchase', {
        orderId: order.id,
        itemCount: order.items.length,
        totalValue: order.total,
        paymentMethod: order.paymentMethod
      });

      setCreatedOrder(order);
      setIsBkashModalOpen(false);
    } catch (err) {
      console.error('Order placement error:', err);
      setBkashError('An error occurred while placing the order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isIpBlocked) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Access Restricted
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-stone-900">
            IP Address Blocked
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            Your IP address (<strong className="font-mono">{userIp}</strong>) has been restricted by system administration due to security policies.
          </p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 text-left space-y-1">
          <p className="font-bold">What can you do?</p>
          <p>• If you believe this is an error, please contact Falak Closet Support.</p>
          <p>• Admin team can lift the IP restriction from Security Settings.</p>
        </div>
      </div>
    );
  }

  if (createdOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center space-y-6 pb-32 lg:pb-16">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Order Confirmed &amp; Placed
          </span>
          <h1 className="font-sans text-2xl sm:text-4xl font-extrabold text-stone-900">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            Your order has been recorded and synced live to our Admin Fulfillment Dashboard.
          </p>
        </div>

        {/* Order Receipt Box */}
        <div className="p-4 sm:p-6 bg-white rounded-3xl border border-pink-100 text-left space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-pink-100 pb-3 gap-2">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Order Reference ID</span>
              <div className="font-mono font-bold text-lg sm:text-xl text-[#D92670] break-all">
                {createdOrder.id}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Tracking Number</span>
              <div className="font-mono text-xs font-bold text-stone-700">
                {createdOrder.trackingNumber}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-stone-900">Shipping Address:</p>
              <p className="text-stone-500">{createdOrder.shippingAddress.fullName}</p>
              <p className="text-stone-500">{createdOrder.shippingAddress.street}</p>
              <p className="text-stone-500">
                {createdOrder.shippingAddress.city}, {createdOrder.shippingAddress.country} ({createdOrder.shippingAddress.postalCode})
              </p>
              <p className="text-stone-500">Phone: {createdOrder.shippingAddress.phone}</p>
            </div>

            <div>
              <p className="font-bold text-stone-900">Delivery &amp; Payment:</p>
              <p className="text-stone-500">{createdOrder.deliveryMethod}</p>
              <p className="text-stone-500">{createdOrder.paymentMethod}</p>
              <p className="font-bold text-[#D92670] mt-2 font-mono text-sm">
                Total Paid: ৳ {createdOrder.total}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={`/track?id=${createdOrder.id}`}
            className="w-full sm:w-auto min-h-[48px] px-8 inline-flex items-center justify-center bg-[#D92670] text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#C2185B] active:scale-95 transition-all shadow-md gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Track Order Status</span>
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto min-h-[48px] px-8 inline-flex items-center justify-center bg-stone-900 text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-stone-700 active:scale-95 transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Friendly empty-cart state — nothing to check out.
  if (activeItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center space-y-5 pb-28 lg:pb-12">
        <div className="w-20 h-20 bg-pink-50 text-[#D92670] rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-stone-900">
            Your cart is empty
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
            Add a few pieces to your cart before heading to checkout.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/shop"
            className="w-full sm:w-auto min-h-[48px] px-8 inline-flex items-center justify-center bg-[#D92670] text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#C2185B] active:scale-95 transition-all shadow-md gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start Shopping</span>
          </Link>
          <Link
            href="/cart"
            className="w-full sm:w-auto min-h-[48px] px-8 inline-flex items-center justify-center bg-white border border-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-full hover:bg-stone-50 active:scale-95 transition-all"
          >
            View Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-6 lg:space-y-8 pb-44 lg:pb-12">
      <div className="flex items-center justify-between border-b border-pink-100 pb-3 sm:pb-4">
        <Link
          href="/cart"
          className="flex items-center gap-1.5 min-h-[40px] text-xs font-semibold text-stone-500 hover:text-[#D92670] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Cart
        </Link>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-stone-400">
          <Lock className="w-3.5 h-3.5 text-emerald-600" /> Secure SSL Checkout
        </div>
      </div>

      <form id="checkout-form" onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Order Summary — FIRST on mobile (collapsed by default), right rail on desktop.
            One markup source, reordered via grid placement. */}
        <aside className="lg:col-span-5 lg:order-2">
          <div className="lg:sticky lg:top-24 bg-white rounded-3xl border border-pink-100 shadow-xs overflow-hidden">
            {/* Summary header — doubles as the mobile disclosure toggle */}
            <button
              type="button"
              onClick={() => setIsSummaryOpen((v) => !v)}
              aria-expanded={isSummaryOpen}
              className="lg:cursor-default lg:pointer-events-none w-full flex items-center justify-between gap-3 p-4 sm:p-6 text-left"
            >
              <div className="min-w-0">
                <h2 className="font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
                  {buyNowItems ? 'Quick Order' : 'Order Summary'}
                  <span className="px-2 text-xs py-0.5 bg-pink-50 border border-pink-100 rounded-full text-[10px] font-bold text-[#D92670]">
                    {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'}
                  </span>
                  {buyNowItems && (
                    <span className="px-2 text-xs py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-700 flex items-center tex-xs gap-1">
                      ⚡ Buy Now
                    </span>
                  )}
                </h2>
                {/* Stacked thumbnails preview (mobile teaser) */}
                <div className="lg:hidden flex items-center gap-1 mt-1.5">
                  {activeItems.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="relative w-7 h-8 rounded-md overflow-hidden border border-white shadow-sm bg-stone-100 -ml-1.5 first:ml-0">
                      <Image src={item.product?.images[0]} alt="" fill sizes="28px" className="object-cover" />
                    </div>
                  ))}
                  {activeItems.length > 4 && (
                    <span className="text-[10px] font-bold text-stone-400 ml-0.5">+{activeItems.length - 4}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="block text-[9px] text-stone-400 uppercase tracking-wider leading-none">Total</span>
                  <span className="font-extrabold text-[#D92670] font-mono text-base sm:text-lg leading-tight">
                    ৳ {totalAmount}
                  </span>
                </div>
                <ChevronDown className={`lg:hidden w-5 h-5 text-stone-400 transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Collapsible body: always open on lg, toggled on mobile */}
            <div className={`${isSummaryOpen ? 'block' : 'hidden'} lg:block border-t border-pink-100 p-4 sm:p-6 space-y-4`}>
              <div className="divide-y divide-pink-50 max-h-64 overflow-y-auto overscroll-contain pr-1 -mr-1">
                {activeItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                        <Image src={item.product?.images[0]} alt={item.product?.name} fill sizes="40px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 line-clamp-1">{item.product?.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{item.selectedColor} • {item.selectedSize} • Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900 shrink-0">৳ {item.product?.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Promo Code Voucher Input */}
              <div className="space-y-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800">
                    <span className="flex items-center gap-1.5 font-bold uppercase min-w-0">
                      <Ticket className="w-4 h-4 shrink-0" />
                      <span className="truncate">{appliedCoupon.code} — −৳{discountAmount}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      aria-label="Remove promo code"
                      className="w-8 h-8 -my-1 -mr-1 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-emerald-100 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Promo code"
                      placeholder="Enter Promo Code (e.g. EID2026)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 min-h-[44px] px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold uppercase text-stone-900 placeholder:font-sans placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D92670] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={isValidatingPromo || !promoCodeInput.trim()}
                      className="px-4 min-h-[44px] bg-stone-900 hover:bg-stone-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isValidatingPromo ? 'Checking…' : 'Apply'}
                    </button>
                  </div>
                )}
                {promoFeedback && (
                  <p
                    role="status"
                    className={`text-[11px] font-bold ${promoFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {promoFeedback.message}
                  </p>
                )}
                {promoNotice && (
                  <p className="text-[11px] font-bold text-amber-600">
                    ⚠️ {promoNotice}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-pink-100 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900">৳ {subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Applied ({appliedCoupon?.code})</span>
                    <span>-৳ {discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-stone-900">
                    {shippingFee === 0 ? <strong className="text-emerald-600 uppercase font-bold">Free</strong> : `৳ ${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-pink-100">
                  <span>Total</span>
                  <span className="text-[#D92670] text-xl font-extrabold">৳ {totalAmount}</span>
                </div>
              </div>

              {/* Desktop CTA (mobile uses the sticky bottom bar) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="hidden lg:flex w-full min-h-[52px] items-center justify-center bg-[#D92670] hover:bg-[#C2185B] active:scale-[0.99] text-white font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Processing Order…' : 'Complete Order'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="hidden lg:flex items-center justify-center gap-1.5 text-[10px] font-semibold text-stone-400">
                <Lock className="w-3 h-3 text-emerald-600" /> 256-bit encrypted secure checkout
              </p>
            </div>
          </div>
        </aside>

        {/* Shipping Details */}
        <div className="lg:col-span-7 lg:order-1 space-y-5 lg:space-y-6">
          <section className="bg-white p-4 sm:p-6 rounded-3xl border border-pink-100 shadow-xs space-y-4">
            <h2 className="font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#D92670]/10 text-[#D92670] text-xs font-black flex items-center justify-center shrink-0">1</span>
              Shipping &amp; Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Field
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="e.g. Sarah Ahmed"
                autoComplete="name"
              />

              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. 01700000000"
                autoComplete="tel-national"
                inputMode="tel"
                pattern="01[0-9]{9}"
                maxLength={11}
              />

              <Field
                label="Street Address"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="e.g. House 42, Road 11, Banani"
                autoComplete="street-address"
                className="sm:col-span-2"
              />

              <Field
                label="City / District"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="e.g. Dhaka"
                autoComplete="address-level2"
              />

              <Field
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="e.g. 1213"
                autoComplete="postal-code"
                inputMode="numeric"
              />
            </div>
            <p className="text-[10px] text-stone-400 leading-relaxed">
              💡 Your district automatically picks the matching delivery zone below.
            </p>
          </section>

          {/* Delivery Zone Selection */}
          <section className="bg-white p-4 sm:p-6 rounded-3xl border border-pink-100 shadow-xs space-y-4">
            <h2 className="font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#D92670]/10 text-[#D92670] text-xs font-black flex items-center justify-center shrink-0">2</span>
              Select Delivery Zone
            </h2>
            <div className="space-y-2.5 text-xs" role="radiogroup" aria-label="Delivery zone">
              {deliveryZones.map((z) => {
                const isSelected = selectedZoneId === z.id;
                return (
                  <label
                    key={z.id}
                    className={`flex items-center justify-between gap-3 min-h-[56px] p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${isSelected
                      ? 'border-[#D92670] bg-pink-50 text-[#D92670] font-bold shadow-xs'
                      : 'border-stone-200 text-stone-700 hover:border-pink-200'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="deliveryZone"
                        checked={isSelected}
                        onChange={() => setSelectedZone(z.id, null)}
                        className="accent-[#D92670] w-4 h-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold flex items-center gap-1.5 flex-wrap">
                          {z.name}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${isSelected ? 'bg-[#D92670] text-white' : 'bg-stone-100 text-stone-500'}`}>
                            {z.etaDays}
                          </span>
                        </p>
                        <p className="text-[10px] text-stone-500 font-normal mt-0.5">Base shipping fee{isSelected && selectedZoneName === z.name ? ' · selected' : ''}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm shrink-0">৳ {z.charge}</span>
                  </label>
                );
              })}
            </div>

            {/* Sub-areas Dropdown */}
            {(() => {
              const selectedZone = deliveryZones.find(z => z.id === selectedZoneId);
              if (selectedZone?.subAreas && selectedZone.subAreas.length > 0) {
                return (
                  <div className="space-y-1.5 pt-1 text-xs">
                    <label htmlFor="co-subarea" className="font-bold text-stone-700">
                      Select Specific Delivery Area <span className="text-[#D92670]">*</span>
                    </label>
                    <select
                      id="co-subarea"
                      value={selectedSubAreaId || ''}
                      onChange={(e) => setSelectedZone(selectedZoneId!, e.target.value || null)}
                      className="w-full min-h-[44px] px-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670] focus:border-transparent font-bold"
                      required
                    >
                      <option value="">-- Choose Area (Custom rate overrides apply) --</option>
                      {selectedZone.subAreas.map((sub: DeliverySubArea) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} {sub.charge !== null ? `(৳ ${sub.charge})` : `(৳ ${selectedZone.charge})`}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              return null;
            })()}
          </section>

          {/* Payment Option */}
          <section className="bg-white p-4 sm:p-6 rounded-3xl border border-pink-100 shadow-xs space-y-3">
            <h2 className="font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#D92670]/10 text-[#D92670] text-xs font-black flex items-center justify-center shrink-0">3</span>
              Payment Option
            </h2>

            <div className="space-y-2.5 text-xs" role="radiogroup" aria-label="Payment method">
              {[
                {
                  id: 'Cash on Delivery (COD)',
                  icon: Banknote,
                  desc: 'Pay in cash when your parcel arrives at your door'
                },
                {
                  id: 'bKash Send Money (Manual)',
                  icon: Smartphone,
                  desc: 'Send Money now, then share the TrxID — verified before dispatch'
                }
              ].map((pm) => {
                const isSelected = paymentMethod === pm.id;
                const Icon = pm.icon;
                return (
                  <label
                    key={pm.id}
                    className={`flex items-start gap-3 min-h-[56px] p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${isSelected
                      ? 'border-[#D92670] bg-pink-50 font-bold shadow-xs'
                      : 'border-stone-200 text-stone-700 hover:border-pink-200'
                      }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={isSelected}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="accent-[#D92670] w-4 h-4 shrink-0 mt-0.5"
                    />
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#D92670] text-white' : 'bg-stone-100 text-stone-500'}`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block font-bold ${isSelected ? 'text-[#D92670]' : 'text-stone-800'}`}>{pm.id}</span>
                      <span className="block text-[10px] text-stone-500 font-normal mt-0.5 leading-snug">{pm.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </form>

      {/* Sticky mobile purchase bar — offset matches MobileBottomNav including
          its env(safe-area-inset-bottom) padding once the nav overhaul lands. */}
      <div className="lg:hidden fixed bottom-[calc(62px+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-pink-100 px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0 shrink-0">
          <span className="text-[9px] text-stone-400 uppercase tracking-wider leading-none">Total ({activeItems.length} {activeItems.length === 1 ? 'item' : 'items'})</span>
          <span className="font-extrabold text-[#D92670] font-mono text-base leading-tight">
            ৳ {totalAmount}
          </span>
        </div>
        <button
          type="submit"
          form="checkout-form"
          disabled={isSubmitting}
          className="flex-1 max-w-[62%] min-h-[44px] bg-[#D92670] hover:bg-[#C2185B] active:scale-95 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-full transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Processing…' : 'Complete Order'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Manual bKash Payment — bottom sheet on mobile, centered dialog on desktop */}
      {isBkashModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="bKash payment"
          onClick={(e) => e.target === e.currentTarget && setIsBkashModalOpen(false)}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-stone-200 max-w-md w-full shadow-2xl overflow-hidden text-stone-900 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-[#E2136E] text-white p-5 sm:p-6 text-center space-y-2 relative shrink-0">
              <button
                type="button"
                onClick={() => setIsBkashModalOpen(false)}
                aria-label="Close bKash payment"
                className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center justify-center bg-white text-[#E2136E] rounded-2xl px-4 py-2 font-black text-xl tracking-wider shadow-sm select-none">
                bKash
              </div>
              <p className="text-xs text-pink-100">Send Money Payment Portal</p>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-grow text-left">
              {/* Amount Info */}
              <div className="bg-pink-50/60 border border-pink-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Amount to Pay</p>
                  <p className="text-2xl font-black text-[#E2136E] font-mono">৳ {totalAmount}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Reference</p>
                  <p className="text-xs font-bold text-stone-600">Falak Closet Order</p>
                </div>
              </div>

              {/* Merchant number — tap-to-copy chip */}
              <button
                type="button"
                onClick={handleCopyNumber}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 text-left hover:border-[#E2136E]/40 active:scale-[0.99] transition-all cursor-pointer"
                aria-label={`Copy bKash number ${bkashSettings?.bkashNumber || '01700000005'}`}
              >
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                  Send Money to — {copied ? 'copied ✓' : 'tap to copy'}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-base sm:text-lg font-extrabold text-stone-900 tracking-wide truncate">
                      {bkashSettings?.bkashNumber || '01700000005'}
                    </span>
                    <span className="px-2 py-0.5 bg-pink-100 text-[#E2136E] border border-pink-200 rounded text-[9px] font-bold shrink-0">
                      {bkashSettings?.bkashAccountType || 'Personal'}
                    </span>
                  </div>
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-[#E2136E] text-white'}`}>
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </span>
                </div>
              </button>

              {/* Instructions list */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">Instructions:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-stone-600 font-medium">
                  {bkashSettings?.instructions?.map((inst: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">{inst}</li>
                  )) || (
                      <>
                        <li>Dial *247# or open the bKash App.</li>
                        <li>Choose &quot;Send Money&quot; and enter our number.</li>
                        <li>Enter amount: ৳{totalAmount}.</li>
                        <li>Use your phone number as reference.</li>
                        <li>Confirm transaction and copy the Transaction ID.</li>
                      </>
                    )}
                </ol>
              </div>

              {bkashError && (
                <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold leading-normal">
                  {bkashError}
                </div>
              )}

              {/* Form inputs */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="space-y-1.5">
                  <label htmlFor="bkash-sender" className="text-[11px] font-bold text-stone-700">
                    Your Sender bKash Number <span className="text-[#E2136E]">*</span>
                  </label>
                  <input
                    id="bkash-sender"
                    type="text"
                    required
                    maxLength={11}
                    inputMode="tel"
                    value={bkashSenderNumber}
                    onChange={(e) => setBkashSenderNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full min-h-[44px] px-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#E2136E] focus:border-transparent font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bkash-trx" className="text-[11px] font-bold text-stone-700">
                    bKash Transaction ID (TrxID) <span className="text-[#E2136E]">*</span>
                  </label>
                  <input
                    id="bkash-trx"
                    type="text"
                    required
                    value={bkashTrxId}
                    onChange={(e) => setBkashTrxId(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC123XYZ9"
                    className="w-full min-h-[44px] px-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#E2136E] focus:border-transparent font-mono font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions — sticky footer, full-width buttons on mobile */}
            <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setIsBkashModalOpen(false)}
                className="min-h-[44px] px-4 bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-800 rounded-xl font-bold transition-all cursor-pointer"
              >
                Close Gateway
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isSubmitting}
                className="min-h-[44px] px-5 bg-[#E2136E] hover:bg-[#C2105E] active:scale-95 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying payment…' : 'Confirm bKash Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
