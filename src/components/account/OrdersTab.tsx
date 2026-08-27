'use client';

import React from 'react';
import Link from 'next/link';
import { Package, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { MineOrder } from '@/app/account/useAccount';

interface OrdersTabProps {
  orders: MineOrder[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function OrdersTab({ orders, isLoading, error, onRetry }: OrdersTabProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#F2C76E]/40 space-y-3">
        <Loader2 className="w-8 h-8 text-[#9B050B] mx-auto animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Loading your orders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#F2C76E]/40 space-y-3">
        <AlertCircle className="w-8 h-8 text-[#9B050B] mx-auto" />
        <p className="text-xs text-stone-500 font-medium">{error}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] text-xs font-bold rounded-full transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#F2C76E]/40 space-y-3">
        <Package className="w-8 h-8 text-[#9B050B] mx-auto" />
        <p className="text-xs text-stone-500 font-medium">No orders found for this account.</p>
        <Link href="/shop" className="inline-block px-5 py-2 bg-[#9B050B] text-[#FFFBF0] text-xs font-bold rounded-full">
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(ord => (
        <div key={ord.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-[#F2C76E]/60 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between border-b border-[#F2C76E]/30 pb-2 text-xs gap-2">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Order ID</span>
              <Link
                href={`/track?id=${encodeURIComponent(ord.id)}`}
                className="font-mono font-extrabold text-[#9B050B] text-sm hover:underline flex items-center gap-1 group cursor-pointer"
              >
                <span>#{ord.id}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Date</span>
              <div className="text-stone-700 font-medium">{new Date(ord.date).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Total</span>
              <div className="font-extrabold text-[#0C163A] font-mono text-sm">{formatCurrency(ord.total)}</div>
            </div>
            <Link
              href={`/track?id=${encodeURIComponent(ord.id)}`}
              className="px-3.5 py-1.5 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] rounded-full font-bold text-[11px] transition-colors flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0 shadow-xs cursor-pointer"
            >
              <span>View Details</span><ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
