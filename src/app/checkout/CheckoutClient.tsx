'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Truck, CreditCard, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart, OrderRecord } from '@/context/CartContext';
import { useAnalytics } from '@/context/AnalyticsContext';

export default function CheckoutClient() {
  const router = useRouter();
  const { 
    cart, 
    subtotal, 
    discountAmount, 
    shippingFee, 
    totalAmount, 
    placeOrder, 
    deliveryCity, 
    setDeliveryCity, 
    systemSettings 
  } = useCart();
  const { trackEvent } = useAnalytics();

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
  const [userIp, setUserIp] = useState<string>('103.24.12.89');

  // Auto fill shipping address and check IP blocking status
  React.useEffect(() => {
    try {
      const savedUser = localStorage.getItem('falak_user_account');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.email) setUserEmail(parsed.email);
        setFormData((prev) => ({
          ...prev,
          fullName: parsed.name || prev.fullName,
          phone: parsed.phone || prev.phone,
          city: parsed.district || prev.city,
          street: parsed.fullAddress || prev.street
        }));
      }

      // Check IP Blocklist
      const checkBlockedIp = async () => {
        try {
          const res = await fetch('/api/security/block-ip');
          const data = await res.json();
          const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
          const allBlocked = [...(data.blockedIps || []), ...localBlocked];
          const isBlocked = allBlocked.some((b: any) => b.ip === userIp);
          if (isBlocked) setIsIpBlocked(true);
        } catch {
          const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
          if (localBlocked.some((b: any) => b.ip === userIp)) setIsIpBlocked(true);
        }
      };
      checkBlockedIp();
    } catch { }
  }, [userIp]);

  const [deliveryMethod, setDeliveryMethod] = useState('Standard Express (2-3 Days)');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery (COD)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // bKash Simulated Gateway State
  const [isBkashModalOpen, setIsBkashModalOpen] = useState(false);
  const [bkashStep, setBkashStep] = useState(1);
  const [bkashAccountNumber, setBkashAccountNumber] = useState('');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [bkashModalError, setBkashModalError] = useState<string | null>(null);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeDiscount = appliedDiscountAmount > 0 ? appliedDiscountAmount : discountAmount;
  const activeTotalAmount = Math.max(0, subtotal - activeDiscount + shippingFee);

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setIsValidatingPromo(true);
    setPromoFeedback(null);

    try {
      const { validatePromotion } = await import('@/actions/orderActions');
      const data = await validatePromotion({ code: promoCodeInput.trim(), cartSubtotal: subtotal });

      if (!data.success) {
        setAppliedDiscountAmount(0);
        setAppliedPromoCode('');
        setPromoFeedback({ type: 'error', message: data.error || 'Invalid promo code' });
      } else {
        setAppliedDiscountAmount(data.calculatedDiscount || 0);
        setAppliedPromoCode(data.code || '');
        setPromoFeedback({ type: 'success', message: data.message || 'Promo applied successfully!' });
      }
    } catch {
      setPromoFeedback({ type: 'error', message: 'Failed to validate promo code.' });
    }
    setIsValidatingPromo(false);
  };
  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'city') {
      setDeliveryCity(value);
    }
  };

  const handleCompleteOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0 || isIpBlocked) return;

    if (paymentMethod === 'bKash' && (!bkashAccountNumber || !bkashTrxId)) {
      setIsBkashModalOpen(true);
      setBkashStep(1);
      setBkashModalError(null);
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await placeOrder({
        items: cart,
        subtotal,
        discount: activeDiscount,
        shippingFee,
        total: activeTotalAmount,
        shippingAddress: formData,
        deliveryMethod,
        paymentMethod,
        userEmail,
        userIp,
        paymentStatus: paymentMethod === 'bKash' ? 'Pending Review' : 'Unpaid',
        bkashSenderNumber: paymentMethod === 'bKash' ? bkashAccountNumber : undefined,
        bkashTrxId: paymentMethod === 'bKash' ? bkashTrxId : undefined
      } as any);

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
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6 pb-28 lg:pb-12">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Order Confirmed & Placed
          </span>
          <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-stone-900">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            Your order has been recorded and synced live to our Admin Fulfillment Dashboard.
          </p>
        </div>

        {/* Order Receipt Box */}
        <div className="p-6 bg-white rounded-3xl border border-pink-100 text-left space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-pink-100 pb-3 gap-2">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Order Reference ID</span>
              <div className="font-mono font-bold text-xl text-[#D92670]">
                {createdOrder.id}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Tracking Number</span>
              <div className="font-mono text-xs font-bold text-stone-700">
                {createdOrder.trackingNumber}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
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
              <p className="font-bold text-stone-900">Delivery & Payment:</p>
              <p className="text-stone-500">{createdOrder.deliveryMethod}</p>
              <p className="text-stone-500">{createdOrder.paymentMethod}</p>
              <p className="font-bold text-[#D92670] mt-2 font-mono text-sm">
                Total Paid: ৳ {createdOrder.total}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href={`/track?id=${createdOrder.id}`}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#D92670] text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#C2185B] transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Track Order Status</span>
          </Link>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-8 py-3.5 bg-stone-900 text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-stone-800 transition-colors"
          >
            View in Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 pb-28 lg:pb-12">
      <div className="flex items-center justify-between border-b border-pink-100 pb-4">
        <Link href="/cart" className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#D92670]">
          <ArrowLeft className="w-4 h-4" /> Return to Cart
        </Link>
        <div className="flex items-center gap-1 text-xs text-stone-400">
          <Lock className="w-3.5 h-3.5 text-emerald-600" /> Secure SSL Checkout
        </div>
      </div>

      <form onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Shipping Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-4">
            <h2 className="font-bold text-lg text-stone-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#D92670]" /> Shipping & Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Sarah Ahmed"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-full text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 01700000000"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-full text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-stone-700">Street Address *</label>
                <input
                  type="text"
                  name="street"
                  required
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="e.g. House 42, Road 11, Banani"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-full text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Dhaka"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-full text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Postal Code *</label>
                <input
                  type="text"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="e.g. 1213"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-full text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                />
              </div>
            </div>
          </div>

          {/* Delivery Speed */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-3">
            <h2 className="font-bold text-lg text-stone-900">
              Select Delivery Speed
            </h2>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Standard Express (2-3 Days)', price: shippingFee === 0 ? 'FREE' : '৳ 60' },
                { label: 'VIP Same-Day Express Delivery', price: '৳ 120' }
              ].map((m) => (
                <label
                  key={m.label}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${deliveryMethod === m.label
                      ? 'border-[#D92670] bg-pink-50 text-[#D92670] font-bold'
                      : 'border-stone-200 text-stone-700 hover:border-pink-200'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === m.label}
                      onChange={() => setDeliveryMethod(m.label)}
                      className="accent-[#D92670]"
                    />
                    <span>{m.label}</span>
                  </div>
                  <span className="font-bold">{m.price}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Option */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-3">
            <h2 className="font-bold text-lg text-stone-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#D92670]" /> Payment Option
            </h2>

            <div className="space-y-2 text-xs">
              {[
                'Cash on Delivery (COD)',
                'bKash',
                'Credit / Debit Card'
              ].map((pm) => (
                <label
                  key={pm}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${paymentMethod === pm
                      ? 'border-[#D92670] bg-pink-50 text-[#D92670] font-bold'
                      : 'border-stone-200 text-stone-700 hover:border-pink-200'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === pm}
                      onChange={() => setPaymentMethod(pm)}
                      className="accent-[#D92670]"
                    />
                    <span>{pm}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Summary Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-4">
            <h2 className="font-bold text-lg text-stone-900">
              Order Summary ({cart.length} items)
            </h2>

            <div className="divide-y divide-pink-50 max-h-60 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                      <Image src={item.product?.images[0]} alt={item.product?.name} fill sizes="40px" className="object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 line-clamp-1">{item.product?.name}</p>
                      <p className="text-[10px] text-stone-400">{item.selectedColor} • {item.selectedSize} • Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-stone-900">৳ {item.product?.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Promo Code Voucher Input */}
            <div className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Promo Code (e.g. EID2026)"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold uppercase text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D92670]"
                />
                <button
                  type="button"
                  onClick={handleApplyPromoCode}
                  disabled={isValidatingPromo || !promoCodeInput.trim()}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isValidatingPromo ? 'Checking...' : 'Apply'}
                </button>
              </div>
              {promoFeedback && (
                <p
                  className={`text-[11px] font-bold mt-1.5 ${
                    promoFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {promoFeedback.message}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-pink-100 space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900">৳ {subtotal}</span>
              </div>
              {activeDiscount > 0 && (
                <div className="flex justify-between text-[#D92670]">
                  <span>Promo Discount {appliedPromoCode ? `(${appliedPromoCode})` : ''}</span>
                  <span className="font-bold">-৳ {activeDiscount}</span>
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
                <span className="text-[#D92670] text-xl font-extrabold">৳ {activeTotalAmount}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="w-full py-4 bg-[#D92670] hover:bg-[#C2185B] text-white font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Processing Order...' : 'Complete Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* simulated bKash payment gateway modal */}
      {isBkashModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#E2136E] rounded-2xl overflow-hidden shadow-2xl flex flex-col text-white">
            {/* Header */}
            <div className="bg-white p-4 flex items-center justify-between border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E2136E] rounded-xl flex items-center justify-center font-black text-white text-xs tracking-tighter">
                  bKash
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-xs">Falak Closet Merchant</h3>
                  <p className="text-[10px] text-stone-500 font-mono">Invoice: {`FLK-${Math.floor(1000 + Math.random()*9000)}`}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsBkashModalOpen(false)}
                className="text-stone-400 hover:text-stone-900 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Merchant Details Bar */}
            <div className="bg-[#D10F62] px-5 py-3 flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px]">Payment Amount</span>
              <span className="font-mono font-black text-sm">৳ {activeTotalAmount}</span>
            </div>

            {/* Step 1: Account Number Entry */}
            {bkashStep === 1 && (
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-80">Your bKash Wallet Number</label>
                  <input
                    type="tel"
                    required
                    value={bkashAccountNumber}
                    onChange={(e) => setBkashAccountNumber(e.target.value)}
                    placeholder="e.g. 01XXXXXXXXX"
                    className="w-full bg-[#D10F62] border border-white/20 rounded-xl px-4 py-3 text-white text-xs font-mono placeholder-white/50 focus:outline-none focus:border-white"
                  />
                </div>

                <div className="text-[10px] opacity-80 leading-relaxed text-center py-2">
                  By clicking <strong>Proceed</strong>, you agree to the terms & conditions of bKash personal send money gateway API.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBkashModalOpen(false)}
                    className="w-1/2 py-2.5 bg-white/10 hover:bg-white/20 rounded-full font-bold text-xs text-center cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!bkashAccountNumber.trim()}
                    onClick={() => {
                      if (/^\d{11}$/.test(bkashAccountNumber.trim())) {
                        setBkashStep(2);
                        setBkashModalError(null);
                      } else {
                        setBkashModalError('Please enter a valid 11-digit bKash number.');
                      }
                    }}
                    className="w-1/2 py-2.5 bg-white text-[#E2136E] hover:bg-stone-50 rounded-full font-black text-xs text-center cursor-pointer shadow-md transition-colors disabled:opacity-50"
                  >
                    Proceed
                  </button>
                </div>
                {bkashModalError && (
                  <div className="p-2 bg-white/10 text-white text-[10px] rounded-lg text-center font-bold">
                    ⚠️ {bkashModalError}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Send Money Instructions & TrxID Verification */}
            {bkashStep === 2 && (
              <div className="p-6 space-y-4 text-left">
                <div className="bg-white/10 p-3.5 rounded-xl space-y-2 border border-white/10 text-xs">
                  <p className="font-extrabold uppercase text-[9px] tracking-wider text-pink-200">Payment Instructions</p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] opacity-90">
                    <li>Open your bKash app or dial *247#</li>
                    <li>Select <strong>Send Money</strong> option</li>
                    <li>Enter Admin Personal number: <strong className="font-mono text-white underline select-all">{systemSettings?.adminBkashNumber || '01700000000'}</strong></li>
                    <li>Enter Amount: <strong>৳ {activeTotalAmount}</strong></li>
                    <li>Complete transfer and copy the Transaction ID (TrxID)</li>
                  </ol>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-80">Enter Transaction ID (TrxID)</label>
                  <input
                    type="text"
                    required
                    value={bkashTrxId}
                    onChange={(e) => setBkashTrxId(e.target.value)}
                    placeholder="e.g. B8A9Z1K2"
                    className="w-full bg-[#D10F62] border border-white/20 rounded-xl px-4 py-2.5 text-white text-xs font-mono uppercase placeholder-white/50 focus:outline-none focus:border-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-80">Sender bKash Number</label>
                  <input
                    type="tel"
                    required
                    value={bkashAccountNumber}
                    onChange={(e) => setBkashAccountNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#D10F62] border border-white/20 rounded-xl px-4 py-2.5 text-white text-xs font-mono placeholder-white/50 focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBkashStep(1)}
                    className="w-1/2 py-2.5 bg-white/10 hover:bg-white/20 rounded-full font-bold text-xs text-center cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!bkashTrxId.trim() || !bkashAccountNumber.trim() || isSubmitting}
                    onClick={() => handleCompleteOrder()}
                    className="w-1/2 py-2.5 bg-white text-[#E2136E] hover:bg-stone-50 rounded-full font-black text-xs text-center cursor-pointer shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <span>{isSubmitting ? 'Confirming...' : 'Confirm Payment'}</span>
                  </button>
                </div>
                {bkashModalError && (
                  <div className="p-2 bg-white/10 text-white text-[10px] rounded-lg text-center font-bold">
                    ⚠️ {bkashModalError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
