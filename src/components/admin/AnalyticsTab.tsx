'use client';

import React from 'react';
import { BarChart3, MapPin, CreditCard } from 'lucide-react';
import { OrderRecord } from '@/context/CartContext';
import { Product } from '@/data/products';
import { formatCurrency } from '@/lib/utils';

interface AnalyticsTabProps {
  orders: OrderRecord[];
  products: Product[];
}

export function AnalyticsTab({ orders, products }: AnalyticsTabProps) {
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  // Regional division analysis
  const divisionStats: Record<string, { count: number; total: number }> = {
    Dhaka: { count: 0, total: 0 },
    Chittagong: { count: 0, total: 0 },
    Sylhet: { count: 0, total: 0 },
    Rajshahi: { count: 0, total: 0 },
    Other: { count: 0, total: 0 }
  };

  orders.forEach((o) => {
    const dist = o.shippingAddress.district || o.shippingAddress.city || 'Other';
    let key = 'Other';
    if (dist.includes('Dhaka')) key = 'Dhaka';
    else if (dist.includes('Chittagong') || dist.includes('Chattogram')) key = 'Chittagong';
    else if (dist.includes('Sylhet')) key = 'Sylhet';
    else if (dist.includes('Rajshahi')) key = 'Rajshahi';

    if (!divisionStats[key]) divisionStats[key] = { count: 0, total: 0 };
    divisionStats[key].count += 1;
    divisionStats[key].total += o.total;
  });

  // Payment Method Analysis
  const paymentStats: Record<string, number> = {};
  orders.forEach((o) => {
    const method = o.paymentMethod || 'Cash on Delivery';
    paymentStats[method] = (paymentStats[method] || 0) + 1;
  });

  return (
    <div className="space-y-8 text-stone-900">
      {/* Top Banner */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-stone-900" />
            <span>Executive Business Intelligence</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Data insights, regional logistics metrics, and financial breakdown for Falak Closet.
          </p>
        </div>
        <div className="px-4 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900">
          Total Volume: {formatCurrency(totalRevenue)}
        </div>
      </div>

      {/* Grid: Regional Analytics + Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Delivery Breakdown */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Regional Order Share (Divisions)</span>
            </h4>
            <span className="text-xs font-mono text-stone-500">Bangladesh Logistics</span>
          </div>

          <div className="space-y-4 text-xs">
            {Object.entries(divisionStats).map(([div, data]) => {
              const pct = orders.length > 0 ? Math.round((data.count / orders.length) * 100) : 25;
              return (
                <div key={div} className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-stone-700">{div} Division</span>
                    <span className="text-stone-900 font-mono font-bold">
                      {data.count} orders ({pct}%) • {formatCurrency(data.total)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                    <div
                      className="h-full bg-stone-900 rounded-full"
                      style={{ width: `${pct || 15}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-stone-900" />
              <span>Payment Channel Share</span>
            </h4>
            <span className="text-xs font-mono text-stone-500">Mobile Financial Services</span>
          </div>

          <div className="space-y-4 text-xs">
            {['Cash on Delivery', 'bKash Direct Mobile', 'Nagad Pay', 'Credit/Debit Card'].map((pm) => {
              const count = paymentStats[pm] || (pm === 'Cash on Delivery' ? orders.length : 0);
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : pm === 'Cash on Delivery' ? 100 : 0;
              return (
                <div key={pm} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-stone-900">{pm}</span>
                    <span className="text-stone-900 font-mono font-bold">{pct}% Share</span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-900 rounded-full"
                      style={{ width: `${pct || 5}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
