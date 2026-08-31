'use client';

/**
 * OrderDetailsModal.tsx — full order details overlay for the admin orders table.
 *
 * Opened by clicking an order ID in OrdersTab. Shows customer, shipping,
 * payment, line items and totals, plus inline actions (status pipeline,
 * manual payment verification, print receipt). The order object is derived
 * from the parent's live `orders` list, so status/payment changes made here
 * reflect immediately in the table behind the modal.
 */

import React, { useEffect } from 'react';
import {
  X,
  Printer,
  Phone,
  MapPin,
  User,
  CreditCard,
  ShoppingBag,
  Calendar,
  Truck,
  Tag,
  Package,
} from 'lucide-react';
import { OrderRecord } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface OrderDetailsModalProps {
  order: OrderRecord;
  onClose: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderRecord['status']) => void;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: string) => void;
  onPrintReceipt: (order: OrderRecord) => void;
}

const STATUS_OPTIONS: OrderRecord['status'][] = [
  'Pending',
  'Processing',
  'Quality Checked',
  'Shipped',
  'Delivered',
  'Cancelled',
];

function statusBadgeStyle(status: OrderRecord['status']) {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'Shipped':
    case 'Out for Delivery':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Quality Checked':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Processing':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    default:
      return 'bg-stone-100 text-stone-800 border-stone-300';
  }
}

export function OrderDetailsModal({
  order,
  onClose,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onPrintReceipt,
}: OrderDetailsModalProps) {
  /* ESC to close + lock body scroll while open. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const sh = order.shippingAddress ?? {
    fullName: 'Valued Customer',
    phone: 'N/A',
    street: '',
    city: '',
    district: '',
    country: 'Bangladesh',
  };

  const isManualBkash = order.paymentMethod === 'bKash Send Money (Manual)';
  const isPendingPayment = isManualBkash && order.paymentStatus !== 'Verified' && order.paymentStatus !== 'Rejected';

  /* COD orders have no payment status; manual bKash defaults to Pending. */
  const paymentStatusLabel = order.paymentStatus || (isManualBkash ? 'Pending' : 'COD');

  const orderDate = order.date
    ? !isNaN(new Date(order.date).getTime())
      ? new Date(order.date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : order.date
    : order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  /* Thumbnail: prefer the gallery for the chosen colour, else main gallery. */
  const itemThumb = (item: OrderRecord['items'][number]) => {
    const colorGallery = item.product?.colors?.find((c) => c.name === item.selectedColor)?.images;
    return colorGallery?.[0] || item.product?.images?.[0] || null;
  };

  /* Admin POS orders can store name/price flat instead of a nested product. */
  const itemMeta = (item: OrderRecord['items'][number]) => {
    const raw = item as { name?: string; price?: number };
    return {
      name: item.product?.name || raw.name || 'Falak Closet Item',
      price: item.product?.price ?? raw.price ?? 0,
    };
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order details ${order.id}`}
        className="relative w-full max-w-4xl max-h-[90vh] sm:max-h-[88vh] flex flex-col bg-stone-50 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-stone-200 px-5 sm:px-7 py-4 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-mono font-black text-base sm:text-lg text-stone-900 truncate">#{order.id}</h2>
              <span
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${statusBadgeStyle(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-1.5 font-mono">
              <Calendar className="w-3 h-3 text-stone-400" />
              {orderDate}
              {order.trackingNumber && (
                <>
                  <Truck className="w-3 h-3 text-stone-400 ml-2" />
                  {order.trackingNumber}
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200 shrink-0"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          {/* Customer / Shipping / Payment grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Customer
              </p>
              <p className="font-bold text-sm text-stone-900">{sh.fullName}</p>
              <p className="text-[11px] text-stone-600 font-mono flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-stone-400" /> {sh.phone}
              </p>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Shipping Address
              </p>
              <p className="text-[11px] text-stone-700 leading-relaxed">
                {sh.fullAddress || sh.street || '—'}
              </p>
              <p className="text-[11px] text-stone-600 font-semibold">
                {[sh.city, sh.district, sh.country || 'Bangladesh'].filter(Boolean).join(', ')}
                {sh.postalCode ? ` ${sh.postalCode}` : ''}
              </p>
              {(order.deliveryZone || order.deliverySubArea) && (
                <p className="text-[10px] text-stone-500 flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-stone-400" />
                  {[order.deliveryZone, order.deliverySubArea].filter(Boolean).join(' › ')}
                </p>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Payment
              </p>
              <p className="text-[11px] font-bold text-stone-900">
                {order.paymentMethod || 'Cash on Delivery'}
              </p>
              {isManualBkash && (
                <div className="text-[11px] text-stone-600 space-y-1 pt-0.5">
                  <p>
                    Sender: <span className="font-mono font-bold text-stone-900">{order.paymentSenderNumber || 'N/A'}</span>
                  </p>
                  <p>
                    TrxID: <span className="font-mono font-bold text-[#9B050B]">{order.paymentTrxId || 'N/A'}</span>
                  </p>
                </div>
              )}
              <p className="text-[11px] flex items-center gap-1.5">
                <span className="text-stone-500">Status:</span>
                <span
                  className={`font-black uppercase tracking-wide text-[10px] ${
                    order.paymentStatus === 'Verified'
                      ? 'text-emerald-700'
                      : order.paymentStatus === 'Rejected'
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}
                >
                  {paymentStatusLabel}
                </span>
              </p>
              {isPendingPayment && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onUpdatePaymentStatus(order.id, 'Verified')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-emerald-800"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePaymentStatus(order.id, 'Rejected')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-3">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Items ({order.items.length})
            </p>
            <div className="divide-y divide-stone-100">
              {order.items.map((item, i) => {
                const meta = itemMeta(item);
                const thumb = itemThumb(item);
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 flex items-center justify-center">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={meta.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{meta.name}</p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-stone-500 font-mono">
                        {formatCurrency(meta.price)} × {item.quantity}
                      </p>
                      <p className="text-xs font-mono font-bold text-stone-900">
                        {formatCurrency(meta.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(order.subtotal ?? order.total)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      Discount{order.promoCode ? ` (${order.promoCode})` : ''}
                    </span>
                    <span className="font-mono">−{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Charge</span>
                  <span className="font-mono">
                    {order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee ?? 60)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-stone-900 pt-2 mt-1">
                  <span className="font-black text-xs text-stone-900 uppercase tracking-wide">Total</span>
                  <span className="font-mono font-black text-base text-stone-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-stone-200 px-5 sm:px-7 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">
              Status
            </span>
            <select
              value={order.status}
              onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderRecord['status'])}
              className={`border rounded-lg px-3 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer ${statusBadgeStyle(order.status)}`}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st} className="bg-white text-stone-800">
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(order as any).consignmentId ? (
              <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-[#9B050B] rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Consignment: {(order as any).consignmentId}
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const btn = document.getElementById(`btn-pathao-dispatch-${order.id}`);
                  if (btn) btn.innerText = 'Dispatching…';
                  try {
                    const res = await fetch('/api/admin/orders/dispatch-pathao', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orderId: order.id }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert(`Successfully dispatched to Pathao!\nConsignment ID: ${data.consignmentId}`);
                      onUpdateOrderStatus(order.id, 'Shipped');
                    } else {
                      alert(`Pathao Dispatch Error: ${data.error}`);
                    }
                  } catch (err) {
                    alert('Network error while dispatching to Pathao');
                  } finally {
                    if (btn) btn.innerText = 'Dispatch to Pathao';
                  }
                }}
                id={`btn-pathao-dispatch-${order.id}`}
                className="px-4 py-2.5 bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" /> Dispatch to Pathao
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-stone-200"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onPrintReceipt(order)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#9B050B] hover:bg-[#800409] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
