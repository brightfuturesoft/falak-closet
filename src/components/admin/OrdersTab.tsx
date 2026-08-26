'use client';

import React, { useState } from 'react';
import {
  Search,
  Download,
  Eye,
  Phone,
  MapPin,
  PlusCircle
} from 'lucide-react';
import { OrderRecord } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface OrdersTabProps {
  orders: OrderRecord[];
  onSelectOrderReceipt: (order: OrderRecord) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderRecord['status']) => void;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: string) => void;
  onOpenCreateOrderModal?: () => void;
  searchQuery: string;
}

export function OrdersTab({
  orders,
  onSelectOrderReceipt,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onOpenCreateOrderModal,
  searchQuery
}: OrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [localQuery, setLocalQuery] = useState('');

  const activeSearch = searchQuery || localQuery;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'All') {
      if (statusFilter === 'Unverified Payments') {
        if (o.paymentMethod !== 'bKash Send Money (Manual)' || o.paymentStatus !== 'Pending') {
          return false;
        }
      } else if (o.status !== statusFilter) {
        return false;
      }
    }
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchPhone = o.shippingAddress.phone.includes(q);
      const matchName = o.shippingAddress.fullName.toLowerCase().includes(q);
      const matchCity = (o.shippingAddress.district || o.shippingAddress.city || '').toLowerCase().includes(q);
      if (!matchId && !matchPhone && !matchName && !matchCity) return false;
    }
    return true;
  });

  const exportToCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order ID', 'Customer Name', 'Phone', 'District', 'Items Count', 'Total BDT', 'Payment Method', 'Status', 'Date'];
    const rows = orders.map((o) => [
      o.id,
      `"${o.shippingAddress.fullName}"`,
      `"${o.shippingAddress.phone}"`,
      `"${o.shippingAddress.district || o.shippingAddress.city || 'Dhaka'}"`,
      o.items.length,
      o.total,
      `"${o.paymentMethod || 'Cash on Delivery'}"`,
      o.status,
      new Date(o.createdAt || Date.now()).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Falak_Closet_Orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadgeStyle = (status: OrderRecord['status']) => {
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
  };

  return (
    <div className="space-y-6 text-stone-900">
      {/* Top Filter & Search Controls */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto text-xs font-bold scrollbar-none">
            {['All', 'Unverified Payments', 'Pending', 'Processing', 'Quality Checked', 'Shipped', 'Delivered', 'Cancelled'].map(
              (st) => {
                const count =
                  st === 'All'
                    ? orders.length
                    : st === 'Unverified Payments'
                    ? orders.filter(
                        (o) =>
                          o.paymentMethod === 'bKash Send Money (Manual)' &&
                          o.paymentStatus === 'Pending'
                      ).length
                    : orders.filter((o) => o.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      statusFilter === st
                        ? 'bg-stone-900 text-white shadow-sm font-bold'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                    }`}
                  >
                    <span>{st}</span>
                    <span className="text-[10px] font-mono opacity-80">({count})</span>
                  </button>
                );
              }
            )}
          </div>

          {/* Search Input & CSV Export Button */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search phone, name, district..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            {onOpenCreateOrderModal && (
              <button
                onClick={onOpenCreateOrderModal}
                className="px-4 py-2 bg-[#9B050B] hover:bg-[#800409] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>+ Direct Order / POS</span>
              </button>
            )}

            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-[#F2C76E]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-stone-500">
            Showing <strong className="text-stone-900">{filteredOrders.length}</strong> of {orders.length} total orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px]">
                <th className="pb-3 font-semibold">Order ID</th>
                <th className="pb-3 font-semibold">Customer Details</th>
                <th className="pb-3 font-semibold">Location</th>
                <th className="pb-3 font-semibold">Order Summary</th>
                <th className="pb-3 font-semibold">Amount (৳)</th>
                <th className="pb-3 font-semibold">Payment</th>
                <th className="pb-3 font-semibold">Status Pipeline</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-4 font-mono font-bold whitespace-nowrap">
                    <button
                      onClick={() => onSelectOrderReceipt(order)}
                      className="text-[#9B050B] hover:text-[#C2185B] hover:underline cursor-pointer flex items-center gap-1 group transition-colors"
                      title="Click to view full order details & invoice"
                    >
                      <span>#{order.id}</span>
                      <Eye className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity text-[#9B050B]" />
                    </button>
                  </td>
                  <td className="py-4 space-y-0.5">
                    <p className="font-bold text-stone-900">{order.shippingAddress.fullName}</p>
                    <p className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {order.shippingAddress.phone}
                    </p>
                  </td>
                  <td className="py-4 text-stone-700">
                    <p className="flex items-center gap-1 font-semibold text-[11px]">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      {order.shippingAddress.district || order.shippingAddress.city || 'Dhaka'}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate max-w-[140px]">
                      {order.shippingAddress.fullAddress || order.shippingAddress.street || 'Dhaka, Bangladesh'}
                    </p>
                  </td>
                  <td className="py-4 text-stone-700">
                    <p className="font-semibold text-stone-900">{order.items.length} item(s)</p>
                    <p className="text-[10px] text-stone-500 truncate max-w-[140px]">
                      {order.items.map((i) => i.product?.name || (i as { name?: string }).name || 'Modest Fashion Item').join(', ')}
                    </p>
                  </td>
                  <td className="py-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-4 text-stone-705 text-[11px] space-y-1">
                    <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded-md font-mono font-medium text-stone-850">
                      {order.paymentMethod || 'Cash on Delivery'}
                    </span>
                    {order.paymentMethod === 'bKash Send Money (Manual)' && (
                      <div className="space-y-0.5 text-[10px] bg-stone-50 border border-stone-150 p-1.5 rounded-lg max-w-[155px]">
                        <p className="font-semibold text-stone-500">Sender: <span className="font-mono font-bold text-stone-900">{order.paymentSenderNumber}</span></p>
                        <p className="font-semibold text-stone-500">TrxID: <span className="font-mono font-bold text-[#9B050B]">{order.paymentTrxId}</span></p>
                        <p className="flex items-center gap-1 font-bold pt-0.5">
                          <span>Payment:</span>
                          {order.paymentStatus === 'Verified' ? (
                            <span className="text-emerald-700 uppercase tracking-wider text-[8px] font-sans">Verified</span>
                          ) : order.paymentStatus === 'Rejected' ? (
                            <span className="text-rose-700 uppercase tracking-wider text-[8px] font-sans">Rejected</span>
                          ) : (
                            <span className="text-amber-700 uppercase tracking-wider text-[8px] font-sans animate-pulse">Pending</span>
                          )}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="py-4">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        onUpdateOrderStatus(order.id, e.target.value as OrderRecord['status'])
                      }
                      className={`border rounded-lg px-2.5 py-1 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer ${statusBadgeStyle(
                        order.status
                      )}`}
                    >
                      <option value="Pending" className="bg-white text-stone-800">Pending</option>
                      <option value="Processing" className="bg-white text-amber-800">Processing</option>
                      <option value="Quality Checked" className="bg-white text-purple-800">Quality Checked</option>
                      <option value="Shipped" className="bg-white text-blue-800">Shipped</option>
                      <option value="Delivered" className="bg-white text-emerald-800">Delivered</option>
                      <option value="Cancelled" className="bg-white text-rose-800">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.paymentMethod === 'bKash Send Money (Manual)' && order.paymentStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => onUpdatePaymentStatus(order.id, 'Verified')}
                            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer text-[10px] font-bold shadow-xs border border-emerald-805"
                            title="Verify Payment"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => onUpdatePaymentStatus(order.id, 'Rejected')}
                            className="px-2.5 py-1.5 bg-rose-55 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                            title="Reject Payment"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onSelectOrderReceipt(order)}
                        className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold border border-stone-200"
                        title="Invoice"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    No orders match your filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
