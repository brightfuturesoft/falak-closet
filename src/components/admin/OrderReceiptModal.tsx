'use client';

import React from 'react';
import Image from 'next/image';
import { X, Printer, Phone, MapPin, CreditCard } from 'lucide-react';
import { OrderRecord } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

interface OrderReceiptModalProps {
  order: OrderRecord | null;
  onClose: () => void;
  onRefreshOrders?: () => void;
}

export function OrderReceiptModal({ order, onClose, onRefreshOrders }: OrderReceiptModalProps) {
  const [isUpdatingPayment, setIsUpdatingPayment] = React.useState(false);
  const [paymentMsg, setPaymentMsg] = React.useState<string | null>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleUpdatePayment = async (status: string) => {
    setIsUpdatingPayment(true);
    setPaymentMsg(null);
    try {
      const { updateOrderPaymentStatus } = await import('@/actions/orderActions');
      const res = await updateOrderPaymentStatus(order.id, status);
      if (res.success) {
        setPaymentMsg(`Success: Payment marked as ${status}!`);
        order.paymentStatus = status;
        if (status === 'Verified') {
          order.status = 'Processing';
        }
        if (onRefreshOrders) onRefreshOrders();
      } else {
        setPaymentMsg(`Error: ${res.error || 'Failed to update payment status'}`);
      }
    } catch (e: any) {
      setPaymentMsg(`Error: ${e.message || 'An error occurred'}`);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in print:static print:p-0 print:bg-white print:block print:overflow-visible print:inset-auto">
      {/* CSS style tag for pristine @media print formatting - ONLY prints the invoice page */}
      <style>{`
        @media print {
          @page {
            margin: 12mm;
            size: A4 portrait;
          }
          body {
            background: white !important;
            color: black !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative text-stone-900 print:max-w-none print:w-full print:border-none print:rounded-none print:shadow-none print:p-0 print:m-0 print:max-h-none print:overflow-visible print:bg-white">
        
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#9B050B] text-white rounded-full text-xs font-mono font-bold">
              Invoice #{order.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#F2C76E]" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div id="printable-invoice" className="space-y-6 p-2 print:p-0 print:m-0 print:w-full">
          {/* Receipt Brand Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
            <div>
              <Logo variant="full" size="md" />
              <p className="text-[11px] text-stone-500 mt-2">
                Official Order Confirmation & Dispatch Voucher
              </p>
            </div>

            <div className="text-right space-y-1 text-xs">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold">
                {order.status}
              </span>
              <p className="text-stone-500 font-mono text-[11px]">
                Date: {new Date(order.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Customer Recipient
              </span>
              <p className="font-bold text-stone-900 text-sm">{order.shippingAddress.fullName}</p>
              <p className="text-stone-700 font-mono flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                {order.shippingAddress.phone}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Delivery Address
              </span>
              <p className="font-semibold text-stone-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {order.shippingAddress.district || order.shippingAddress.city || 'Dhaka'} Division
              </p>
              <p className="text-stone-600">{order.shippingAddress.fullAddress || order.shippingAddress.street || 'Dhaka, Bangladesh'}</p>
            </div>
          </div>

          {/* bKash Payment Details & Verification Controls for Admin */}
          {order.paymentMethod === 'bKash' && (
            <div className="p-4 bg-pink-50/50 border border-pink-100 rounded-2xl space-y-3 text-xs print:bg-white print:border-stone-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    bKash Payment Verification
                  </span>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <p className="font-mono text-stone-700">
                      Sender Number: <strong className="text-stone-900 select-all">{order.bkashSenderNumber || 'N/A'}</strong>
                    </p>
                    <p className="font-mono text-stone-700">
                      Transaction ID (TrxID): <strong className="text-stone-900 select-all font-bold uppercase">{order.bkashTrxId || 'N/A'}</strong>
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                    Payment Status
                  </span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${
                    order.paymentStatus === 'Verified'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : order.paymentStatus === 'Failed'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                  }`}>
                    {order.paymentStatus || 'Pending Review'}
                  </span>
                </div>
              </div>

              {/* Admin Action Buttons (Hidden when printing invoice) */}
              <div className="pt-2 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                <p className="text-[10px] text-stone-500 italic">
                  Validate the Transaction ID in your bKash merchant app before verifying.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isUpdatingPayment || order.paymentStatus === 'Failed'}
                    onClick={() => handleUpdatePayment('Failed')}
                    className="px-3.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40"
                  >
                    Reject Payment
                  </button>
                  <button
                    disabled={isUpdatingPayment || order.paymentStatus === 'Verified'}
                    onClick={() => handleUpdatePayment('Verified')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-40"
                  >
                    Verify Payment
                  </button>
                </div>
              </div>

              {paymentMsg && (
                <div className="p-2 bg-white rounded-lg border border-pink-200 text-[10px] text-stone-700 font-bold text-center">
                  {paymentMsg}
                </div>
              )}
            </div>
          )}

          {/* Itemized Table */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Itemized Order Manifest
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-mono text-[10px]">
                    <th className="pb-2">Product Name</th>
                    <th className="pb-2 text-center">Size / Color</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {order.items.map((item, idx) => {
                    const itemName = item.product?.name || (item as any).name || 'Modest Fashion Item';
                    const itemPrice = item.product?.price || (item as any).price || 0;
                    const itemSize = item.selectedSize || (item as any).size || 'M';
                    const itemColor = item.selectedColor || (item as any).color || 'Standard';
                    const itemImage = item.product?.images?.[0] || (item as any).image || 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=200&q=80';

                    return (
                      <tr key={idx}>
                        <td className="py-3 font-bold text-stone-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-12 relative rounded-lg overflow-hidden shrink-0 border border-stone-200">
                              <Image src={itemImage} alt={itemName} fill className="object-cover" />
                            </div>
                            <span className="max-w-[180px] sm:max-w-[240px] truncate">{itemName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center text-stone-600 font-mono">
                          {itemSize} / {itemColor}
                        </td>
                        <td className="py-3 text-center font-mono font-bold text-stone-900">
                          x{item.quantity}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-stone-900">
                          {formatCurrency(itemPrice * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="pt-4 border-t border-stone-200 flex flex-col items-end space-y-2 text-xs font-mono">
            <div className="w-full sm:w-64 space-y-1.5">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal:</span>
                <span className="text-stone-900">{formatCurrency(order.subtotal || order.total - 120)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Delivery Charge:</span>
                <span className="text-stone-900">{formatCurrency(order.shippingFee || 120)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Amount:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Footnote */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-stone-700" />
              <span>Payment Mode: <strong>{order.paymentMethod || 'Cash on Delivery'}</strong></span>
            </span>
            <span className="text-emerald-700 font-bold">Thank you for shopping with Falak Closet!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
