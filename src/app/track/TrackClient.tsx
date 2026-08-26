'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  PackageCheck,
  MapPin,
  HelpCircle,
  ArrowLeft,
  Printer,
  ShoppingBag,
  CreditCard,
  User,
  Phone,
  FileText
} from 'lucide-react';
import { useCart, OrderRecord } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

// Safe Image Component for products in order preview
function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  if (hasError || !imgSrc) {
    return (
      <div className="w-full h-full bg-[#0C163A]/10 flex flex-col items-center justify-center p-1 text-center text-[#0C163A]">
        <ShoppingBag className="w-4 h-4 text-[#9B050B]" />
        <span className="text-[8px] font-bold mt-0.5 font-mono line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="60px"
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = searchParams.get('id') || '';
  const phoneParam = searchParams.get('phone') || '';

  const { getOrderById, getOrdersByPhone, orders } = useCart();

  const [inputQuery, setInputQuery] = useState(idParam || phoneParam || '');
  const [activeOrder, setActiveOrder] = useState<OrderRecord | undefined>(undefined);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (idParam || phoneParam) {
      const found = getOrderById(idParam) || getOrdersByPhone(phoneParam)[0];
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveOrder(found);
      } else {
        // Fallback search in orders array
        const directMatch = orders.find(
          (o) =>
            o.id.toLowerCase() === idParam.toLowerCase() ||
            (o.shippingAddress?.phone && o.shippingAddress.phone === phoneParam)
        );
        setActiveOrder(directMatch);
      }
      setSearched(true);
    } else if (orders.length > 0) {
      setActiveOrder(orders[0]);
    }
  }, [idParam, phoneParam, orders, getOrderById, getOrdersByPhone]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const query = inputQuery.trim();
    const found =
      getOrderById(query) ||
      getOrdersByPhone(query)[0] ||
      orders.find((o) => o.id.toLowerCase() === query.toLowerCase());

    setActiveOrder(found);
    setSearched(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const statusSteps = [
    { title: 'Order Placed', desc: 'Received & Logged', icon: PackageCheck },
    { title: 'Processing', desc: 'Quality Check & Tailoring', icon: Clock },
    { title: 'Quality Checked', desc: 'Passed Verification', icon: CheckCircle2 },
    { title: 'Shipped', desc: 'Dispatched via Courier', icon: Truck },
    { title: 'Out for Delivery', desc: 'With Courier Rider', icon: MapPin },
    { title: 'Delivered', desc: 'Received at Doorstep', icon: CheckCircle2 }
  ];

  const getStepIndex = (status: OrderRecord['status']) => {
    switch (status) {
      case 'Processing': return 1;
      case 'Quality Checked': return 2;
      case 'Shipped': return 3;
      case 'Out for Delivery': return 4;
      case 'Delivered': return 5;
      default: return 0;
    }
  };

  const currentStep = activeOrder ? getStepIndex(activeOrder.status) : 0;

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 pb-36 lg:pb-12 font-sans">
      
      {/* Navigation & Header Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push('/account')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFFBF0] hover:bg-[#F2C76E]/20 border border-[#F2C76E]/60 text-[#0C163A] text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#9B050B]" />
          <span>Back to My Account</span>
        </button>

        {activeOrder && (
          <button
            onClick={handlePrintInvoice}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-stone-200 hover:border-[#9B050B] text-[#0C163A] hover:text-[#9B050B] text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / Save Invoice</span>
          </button>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-[#FFFBF0] border-2 border-[#F2C76E]/80 p-5 sm:p-8 rounded-3xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="px-3 py-0.5 bg-[#9B050B]/10 text-[#9B050B] text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-[#9B050B]/20">
              <FileText className="w-3.5 h-3.5" /> Order Details & Receipt
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0C163A] mt-1">
              {activeOrder ? `Order #${activeOrder.id}` : 'Order Logistics Tracker'}
            </h1>
            {activeOrder && (
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                Placed on {new Date(activeOrder.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          {activeOrder && (
            <div className="px-4 py-2 bg-[#9B050B] text-[#FFFBF0] rounded-2xl text-right shrink-0 shadow-xs">
              <span className="text-[9px] uppercase tracking-wider text-amber-200 block font-bold">Status</span>
              <span className="font-bold text-xs sm:text-sm font-sans uppercase">
                {activeOrder.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Input Box */}
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Enter Order ID (e.g. FLK-POS-56598) or Phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#9B050B] rounded-full text-xs sm:text-sm text-[#0C163A] focus:outline-none focus:ring-2 focus:ring-[#9B050B]/30 shadow-xs"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#9B050B]" />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#9B050B] text-[#FFFBF0] font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#B8000A] transition-colors shadow-md flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Order Details Preview Display */}
      {activeOrder ? (
        <div className="bg-white rounded-3xl border border-[#F2C76E]/80 p-4 sm:p-8 shadow-xs space-y-6 sm:space-y-8">
          
          {/* Top Invoice Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FFFBF0] rounded-2xl border border-[#F2C76E]/50 text-xs">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Order Reference</span>
              <span className="font-mono font-extrabold text-[#9B050B] text-sm">#{activeOrder.id}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Est. Delivery</span>
              <span className="font-mono font-bold text-[#0C163A] text-xs sm:text-sm">{activeOrder.estimatedDelivery || '2-3 Business Days'}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Courier Tracking</span>
              <span className="font-mono font-bold text-[#0C163A] text-xs sm:text-sm">{activeOrder.trackingNumber || 'FLK-EXP-99'}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Total Amount</span>
              <span className="font-mono font-extrabold text-[#9B050B] text-sm">{formatCurrency(activeOrder.total)}</span>
            </div>
          </div>

          {/* Interactive Logistics Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9B050B] font-serif flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#9B050B]" />
              <span>Logistics Milestone Progress</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div
                    key={step.title}
                    className={`p-2.5 rounded-2xl border text-center space-y-1 transition-all ${
                      isCurrent
                        ? 'bg-[#FFFBF0] border-[#9B050B] ring-2 ring-[#9B050B]/30 text-[#9B050B] font-bold'
                        : isPassed
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs ${
                        isCurrent
                          ? 'bg-[#9B050B] text-[#FFFBF0] font-bold animate-pulse'
                          : isPassed
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="font-bold text-[11px] leading-tight">{step.title}</p>
                    <p className="text-[9px] text-stone-500 line-clamp-1">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Shipping & Payment Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Consignee Address */}
            <div className="p-4 bg-[#FFFBF0] rounded-2xl border border-[#F2C76E]/50 space-y-2">
              <p className="font-serif font-bold text-[#0C163A] uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-[#F2C76E]/40 pb-1.5">
                <User className="w-3.5 h-3.5 text-[#9B050B]" />
                <span>Shipping Consignee</span>
              </p>
              <div className="space-y-0.5 text-stone-700">
                <p className="font-bold text-[#0C163A] text-sm">{activeOrder.shippingAddress?.fullName || 'Valued Client'}</p>
                <p className="flex items-center gap-1 text-stone-600 font-mono text-[11px]">
                  <Phone className="w-3 h-3 text-[#9B050B]" /> {activeOrder.shippingAddress?.phone || 'N/A'}
                </p>
                <p className="text-stone-600">{activeOrder.shippingAddress?.street || 'Full Delivery Address'}</p>
                <p className="text-stone-600 font-medium">
                  {activeOrder.shippingAddress?.city || 'Dhaka'}, {activeOrder.shippingAddress?.country || 'Bangladesh'}
                </p>
              </div>
            </div>

            {/* Payment & Invoice Summary */}
            <div className="p-4 bg-[#FFFBF0] rounded-2xl border border-[#F2C76E]/50 space-y-2">
              <p className="font-serif font-bold text-[#0C163A] uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-[#F2C76E]/40 pb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#9B050B]" />
                <span>Payment & Invoice Summary</span>
              </p>
              <div className="space-y-1 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Method:</span>
                  <span className="font-bold text-[#0C163A]">{activeOrder.paymentMethod || 'Cash on Delivery (COD)'}</span>
                </div>

                {activeOrder.paymentMethod === 'bKash Send Money (Manual)' && (
                  <>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500">bKash Sender:</span>
                      <span className="font-mono font-bold text-stone-850">
                        {activeOrder.paymentSenderNumber
                          ? `${activeOrder.paymentSenderNumber.substring(0, 3)}•••••${activeOrder.paymentSenderNumber.substring(8)}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500">Transaction ID (TrxID):</span>
                      <span className="font-mono font-bold text-stone-850">
                        {activeOrder.paymentTrxId || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] items-center">
                      <span className="text-stone-500">Payment Status:</span>
                      <span className={`font-bold uppercase tracking-wider text-[8px] px-1.5 py-0.5 rounded font-sans ${
                        activeOrder.paymentStatus === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : activeOrder.paymentStatus === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                      }`}>
                        {activeOrder.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal:</span>
                  <span className="font-mono font-bold text-[#0C163A]">{formatCurrency(activeOrder.subtotal || activeOrder.total)}</span>
                </div>

                {activeOrder.discount !== undefined && activeOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>
                      {activeOrder.promoCode ? `Coupon ${activeOrder.promoCode}` : 'Promo Discount'}:
                    </span>
                    <span className="font-mono">-{formatCurrency(activeOrder.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-stone-500">Delivery Charge:</span>
                  <span className="font-mono text-[#0C163A] font-bold">
                    {activeOrder.shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase text-[10px]">Free Delivery</span>
                    ) : (
                      formatCurrency(activeOrder.shippingFee || 60)
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#F2C76E]/40 pt-1 text-sm">
                  <span className="font-bold text-[#0C163A]">Total Amount:</span>
                  <span className="font-mono font-extrabold text-[#9B050B]">{formatCurrency(activeOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Products Preview */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0C163A] font-serif flex items-center justify-between">
              <span>Ordered Products ({activeOrder.items?.length || 0} items)</span>
              <span className="font-mono text-[10px] text-stone-500 font-normal">All items quality inspected</span>
            </h3>

            <div className="divide-y divide-[#F2C76E]/30 border border-[#F2C76E]/60 rounded-2xl overflow-hidden bg-white">
              {activeOrder.items?.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#F2C76E]/40 shadow-xs">
                      <SafeImage src={item.product?.images?.[0] || ''} alt={item.product?.name || 'Product'} className="object-cover" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="font-serif font-bold text-[#0C163A] line-clamp-1">{item.product?.name || 'Falak Couture Item'}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-500">
                        {item.selectedColor && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-100 rounded font-medium">
                            Color: <strong className="text-[#0C163A]">{item.selectedColor}</strong>
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-100 rounded font-medium">
                            Size: <strong className="text-[#0C163A]">{item.selectedSize}</strong>
                          </span>
                        )}
                        <span className="font-mono text-stone-600 font-bold">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono font-extrabold text-[#9B050B] text-xs sm:text-sm">
                    {formatCurrency((item.product?.price || 0) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#F2C76E]/40">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] text-xs font-bold rounded-full text-center shadow-xs transition-colors"
            >
              Continue Shopping Haute Couture Collections →
            </Link>

            <Link
              href="/account"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/80 hover:bg-[#F2C76E]/20 text-[#0C163A] text-xs font-bold rounded-full text-center transition-colors"
            >
              Return to My Orders Dashboard
            </Link>
          </div>

        </div>
      ) : (
        searched && (
          <div className="py-16 text-center bg-white rounded-3xl border border-[#F2C76E]/60 p-8 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-[#0C163A]">
              No order found matching &quot;{inputQuery}&quot;
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Please verify your Order ID or phone number. Sample Order ID: <strong className="text-[#9B050B] font-mono">FLK-POS-56598</strong>
            </p>
          </div>
        )
      )}

      {/* Support Section */}
      <div className="p-5 sm:p-6 bg-[#FFFBF0] border-2 border-[#F2C76E]/80 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-[#9B050B] shrink-0" />
          <div>
            <h4 className="font-serif font-bold text-sm text-[#0C163A]">Need Assistance with this Order?</h4>
            <p className="text-xs text-stone-500">Our customer care team is available 24/7 for address changes, delivery tracking, and returns.</p>
          </div>
        </div>
        <Link
          href="/how-to-order"
          className="px-5 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] font-bold text-xs rounded-full transition-colors shadow-xs shrink-0"
        >
          Contact Customer Care
        </Link>
      </div>
    </div>
  );
}

export default function TrackClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Loading order details preview...</div>}>
      <TrackContent />
    </Suspense>
  );
}
