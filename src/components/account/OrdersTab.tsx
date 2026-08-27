'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Package, ArrowRight, AlertCircle, ShoppingBag, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ReceiptModal } from '@/components/receipt/ReceiptModal';
import type { MineOrder } from '@/app/account/useAccount';

interface OrdersTabProps {
  orders: MineOrder[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function OrdersTab({ orders, isLoading, error, onRetry }: OrdersTabProps) {
  const [receiptOrder, setReceiptOrder] = useState<MineOrder | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="p-5 bg-white rounded-2xl border border-stone-200/70 flex items-center gap-4 animate-pulse"
          >
            <div className="w-11 h-11 rounded-xl bg-stone-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded bg-stone-100" />
              <div className="h-3 w-1/5 rounded bg-stone-100" />
            </div>
            <div className="h-8 w-24 rounded-full bg-stone-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200/70 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-[#D92670]" />
        </div>
        <p className="text-xs text-stone-500 font-medium max-w-xs mx-auto">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-[#D92670] hover:bg-[#C2185B] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-3xl border border-stone-200/70 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-[#D92670]" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif font-bold text-base text-[#0C163A]">No orders yet</h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            When you place an order it will appear here with live tracking.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#D92670] hover:bg-[#C2185B] text-white text-xs font-bold rounded-full transition-colors"
        >
          Start Shopping <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((ord) => (
          <div
            key={ord.id}
            className="group p-4 sm:p-5 bg-white rounded-2xl border border-stone-200/70 hover:border-[#D92670]/40 hover:shadow-md transition-all flex items-center gap-4"
          >
            <Link
              href={`/track?id=${encodeURIComponent(ord.id)}`}
              className="flex items-center gap-4 flex-1 min-w-0"
            >
              <div className="w-11 h-11 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0 group-hover:bg-[#D92670] group-hover:border-[#D92670] transition-colors">
                <Package className="w-5 h-5 text-[#D92670] group-hover:text-white transition-colors" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-mono font-extrabold text-[#D92670] text-sm truncate">#{ord.id}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Placed{' '}
                  {new Date(ord.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {ord.items?.length > 0 && ` · ${ord.items.length} item${ord.items.length === 1 ? '' : 's'}`}
                </p>
              </div>

              <div className="text-right shrink-0 space-y-0.5 hidden sm:block">
                <p className="font-extrabold text-[#0C163A] font-mono text-sm">
                  {formatCurrency(ord.total)}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 group-hover:text-[#D92670] transition-colors uppercase tracking-wide">
                  View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 shrink-0">
              <p className="font-extrabold text-[#0C163A] font-mono text-sm sm:hidden text-right">
                {formatCurrency(ord.total)}
              </p>
              <button
                type="button"
                onClick={() => setReceiptOrder(ord)}
                title="Print / save receipt"
                aria-label={`Print receipt for order ${ord.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 hover:border-[#D92670]/50 hover:text-[#D92670] hover:bg-pink-50 text-stone-600 text-[11px] font-bold rounded-full transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Receipt</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Printable receipt (portal modal) */}
      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}
    </>
  );
}
