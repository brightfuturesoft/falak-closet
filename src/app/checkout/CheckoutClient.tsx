'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, ShieldCheck, Truck, CreditCard, Lock, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useCart, OrderRecord, DeliverySubArea } from '@/context/CartContext';
import { useAnalytics } from '@/context/AnalyticsContext';

export default function CheckoutClient() {
  const {
    cart,
    subtotal,
    discountAmount,
    shippingFee,
    placeOrder,
    deliveryZones,
    selectedZoneId,
    selectedSubAreaId,
    setSelectedZone,
    selectedZoneName,
    selectedSubAreaName
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
  const [userIp] = useState<string>('103.24.12.89');

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

  // Auto fill shipping address and check IP blocking status
  React.useEffect(() => {
    try {
      const savedUser = localStorage.getItem('falak_user_account');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as {
          email?: string;
          name?: string;
          phone?: string;
          district?: string;
          fullAddress?: string;
        };
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
          const isBlocked = allBlocked.some((b: { ip: string }) => b.ip === userIp);
          if (isBlocked) setIsIpBlocked(true);
        } catch {
          const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
          if (localBlocked.some((b: { ip: string }) => b.ip === userIp)) setIsIpBlocked(true);
        }
      };
      checkBlockedIp();
    } catch { }
  }, [userIp]);

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery (COD)');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCodeInput.trim(), cartSubtotal: subtotal })
      });
      const data = await res.json();

      if (!data.success) {
        setAppliedDiscountAmount(0);
        setAppliedPromoCode('');
        setPromoFeedback({ type: 'error', message: data.error || 'Invalid promo code' });
      } else {
        setAppliedDiscountAmount(data.calculatedDiscount || 0);
        setAppliedPromoCode(data.code);
        setPromoFeedback({ type: 'success', message: data.message });
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
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isIpBlocked) return;

    if (paymentMethod === 'bKash Send Money (Manual)' && !isBkashModalOpen) {
      // Intercept to display the gateway-style bKash payment portal first
      setIsBkashModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setBkashError(null);

    try {
      const orderPayload: {
        items: typeof cart;
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
      } = {
        items: cart,
        subtotal,
        discount: activeDiscount,
        shippingFee,
        total: activeTotalAmount,
        shippingAddress: formData,
        deliveryMethod: selectedZoneName + (selectedSubAreaName ? ` - ${selectedSubAreaName}` : ''),
        paymentMethod,
        userEmail,
        userIp,
        deliveryZone: selectedZoneName,
        deliverySubArea: selectedSubAreaName || undefined
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

          {/* Delivery Zone Selection */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-4">
            <h2 className="font-bold text-lg text-stone-900">
              Select Delivery Zone
            </h2>
            <div className="space-y-2 text-xs">
              {deliveryZones.map((z) => (
                <label
                  key={z.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${selectedZoneId === z.id
                      ? 'border-[#D92670] bg-pink-50 text-[#D92670] font-bold'
                      : 'border-stone-200 text-stone-700 hover:border-pink-200'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryZone"
                      checked={selectedZoneId === z.id}
                      onChange={() => setSelectedZone(z.id, null)}
                      className="accent-[#D92670]"
                    />
                    <div>
                      <p className="font-bold">{z.name} ({z.etaDays})</p>
                      <p className="text-[10px] text-stone-500 font-normal">Base shipping fee</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm">৳ {z.charge}</span>
                </label>
              ))}
            </div>

            {/* Sub-areas Dropdown */}
            {(() => {
              const selectedZone = deliveryZones.find(z => z.id === selectedZoneId);
              if (selectedZone?.subAreas && selectedZone.subAreas.length > 0) {
                return (
                  <div className="space-y-1.5 pt-2 text-xs">
                    <label className="font-bold text-stone-700">Select Specific Delivery Area *</label>
                    <select
                      value={selectedSubAreaId || ''}
                      onChange={(e) => setSelectedZone(selectedZoneId!, e.target.value || null)}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-bold"
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
          </div>

          {/* Payment Option */}
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-3">
            <h2 className="font-bold text-lg text-stone-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#D92670]" /> Payment Option
            </h2>

            <div className="space-y-2 text-xs">
              {[
                'Cash on Delivery (COD)',
                'bKash Send Money (Manual)'
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

      {/* Manual bKash Payment Modal Overlay */}
      {isBkashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full shadow-2xl overflow-hidden text-stone-900 flex flex-col">
            {/* Header */}
            <div className="bg-[#E2136E] text-white p-6 text-center space-y-2 relative">
              <button
                type="button"
                onClick={() => setIsBkashModalOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center justify-center bg-white text-[#E2136E] rounded-2xl px-4 py-2 font-black text-xl tracking-wider shadow-sm select-none">
                bKash
              </div>
              <p className="text-xs text-pink-100">Send Money Payment Portal</p>
            </div>

            <div className="p-6 space-y-4 flex-grow overflow-y-auto max-h-[60vh] text-left">
              {/* Amount Info */}
              <div className="bg-pink-50/50 border border-pink-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Amount to Pay</p>
                  <p className="text-2xl font-black text-[#E2136E] font-mono">৳ {activeTotalAmount}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Reference</p>
                  <p className="text-xs font-bold text-stone-750">Falak Closet Order</p>
                </div>
              </div>

              {/* Merchant Details */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Send Money to</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-base font-extrabold text-stone-950">
                      {bkashSettings?.bkashNumber || '01700000005'}
                    </span>
                    <span className="ml-2 px-2 py-0.5 bg-pink-100 text-[#E2136E] border border-pink-250 rounded text-[9px] font-bold">
                      {bkashSettings?.bkashAccountType || 'Personal'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="px-3 py-1.5 bg-[#E2136E] hover:bg-[#C2105E] text-white rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Instructions list */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">Instructions:</p>
                <ol className="list-decimal pl-4 space-y-1 text-stone-600 font-medium">
                  {bkashSettings?.instructions?.map((inst: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">{inst}</li>
                  )) || (
                    <>
                      <li>Dial *247# or open the bKash App.</li>
                      <li>Choose &quot;Send Money&quot; and enter our number.</li>
                      <li>Enter amount: ৳{activeTotalAmount}.</li>
                      <li>Use your phone number as reference.</li>
                      <li>Confirm transaction and copy the Transaction ID.</li>
                    </>
                  )}
                </ol>
              </div>

              {bkashError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-850 rounded-xl text-xs font-bold leading-normal">
                  {bkashError}
                </div>
              )}

              {/* Forms inputs */}
              <div className="space-y-3 pt-2 border-t border-stone-150">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-700">Your Sender bKash Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={bkashSenderNumber}
                    onChange={(e) => setBkashSenderNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#E2136E] font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-700">bKash Transaction ID (TrxID) *</label>
                  <input
                    type="text"
                    required
                    value={bkashTrxId}
                    onChange={(e) => setBkashTrxId(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC123XYZ9"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#E2136E] font-mono font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-stone-50 border-t border-stone-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsBkashModalOpen(false)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-850 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Close Gateway
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#E2136E] hover:bg-[#C2105E] text-white rounded-xl font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying payment...' : 'Confirm bKash Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
