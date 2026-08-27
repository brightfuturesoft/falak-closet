'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, MapPin, Search, MessageSquare, ShieldCheck, Ban, Globe,
  ShieldAlert, ShoppingCart, X, Package, Tag, Palette, Ruler,
  Hash, DollarSign, ShoppingBag,
} from 'lucide-react';
import { OrderRecord } from '@/context/CartContext';
import { Product } from '@/data/products';
import { formatCurrency } from '@/lib/utils';

interface CustomersTabProps {
  orders: OrderRecord[];
  products: Product[];
}

interface DbCartItem {
  productId: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

interface UserDbRecord {
  _id?: string;
  email: string;
  phone: string;
  name: string;
  district: string;
  fullAddress: string;
  ip?: string;
  isBlocked?: boolean;
  createdAt?: string;
  cart?: DbCartItem[];
}

interface UnifiedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  address: string;
  ip: string;
  totalOrders: number;
  totalSpent: number;
  isBlocked: boolean;
  registeredDate: string;
  cart: DbCartItem[];
}

interface ResolvedCartItem {
  product: Product | null;
  productId: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// ─── Cart Detail Modal ────────────────────────────────────────────────────────

function CartDetailModal({
  customer,
  products,
  onClose,
}: {
  customer: UnifiedCustomer;
  products: Product[];
  onClose: () => void;
}) {
  const resolved: ResolvedCartItem[] = customer.cart.map((item) => {
    const product = products.find((p) => p.id === item.productId) ?? null;
    const unitPrice = product?.price ?? 0;
    return {
      product,
      productId: item.productId,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const grandTotal = resolved.reduce((s, i) => s + i.lineTotal, 0);
  const totalItems = resolved.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow">
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                {customer.name}&apos;s Saved Cart
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
              <ShoppingCart className="w-3 h-3" />
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <X className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {resolved.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Cart is empty</p>
            </div>
          ) : (
            resolved.map((item, idx) => {
              const colorObj = item.product?.colors?.find(
                (c) => c.name.toLowerCase() === item.selectedColor.toLowerCase()
              );
              const imageSrc =
                colorObj?.images?.[0] ||
                item.product?.images?.[0] ||
                '';

              return (
                <div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}-${idx}`}
                  className="flex items-start gap-4 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/50"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-700 flex-shrink-0">
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageSrc}
                        alt={item.product?.name ?? item.productId}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-stone-400" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-stone-900 dark:text-stone-100 leading-tight truncate">
                      {item.product?.name ?? (
                        <span className="text-stone-400 font-mono text-[11px]">{item.productId}</span>
                      )}
                    </p>
                    {item.product?.code && (
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                        <Tag className="w-2.5 h-2.5 inline mr-0.5" />
                        {item.product.code}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 px-2 py-0.5 rounded-full">
                        <Palette className="w-2.5 h-2.5" />
                        {item.selectedColor}
                        {colorObj?.hex && (
                          <span
                            className="w-3 h-3 rounded-full border border-stone-300 inline-block"
                            style={{ backgroundColor: colorObj.hex }}
                          />
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 px-2 py-0.5 rounded-full">
                        <Ruler className="w-2.5 h-2.5" />
                        {item.selectedSize}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 px-2 py-0.5 rounded-full">
                        <Hash className="w-2.5 h-2.5" />
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-amber-700 dark:text-amber-400">
                      {formatCurrency(item.lineTotal)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Grand Total */}
        {resolved.length > 0 && (
          <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold">Cart Total</span>
                <span className="text-xs text-stone-400">({totalItems} items)</span>
              </div>
              <p className="font-bold text-lg text-stone-900 dark:text-stone-100">
                {formatCurrency(grandTotal)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function CustomersTab({ orders, products }: CustomersTabProps) {
  const [query, setQuery] = useState('');
  const [dbUsers, setDbUsers] = useState<UserDbRecord[]>([]);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cartModalCustomer, setCartModalCustomer] = useState<UnifiedCustomer | null>(null);

  // Load registered users from User collection
  const loadUsersAndSecurity = async () => {
    try {
      const res = await fetch('/api/user/all');
      const data = await res.json();
      if (data.users) {
        setDbUsers(data.users);
      }
    } catch { }

    try {
      const res = await fetch('/api/security/block-ip');
      const data = await res.json();
      const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
      const allBlocked = [...(data.blockedIps || []), ...localBlocked];
      setBlockedIps(new Set(allBlocked.map((b: { ip: string }) => b.ip)));
    } catch {
      const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
      setBlockedIps(new Set(localBlocked.map((b: { ip: string }) => b.ip)));
    }
  };

  useEffect(() => {
    loadUsersAndSecurity();
  }, []);

  // Build unified customer dictionary combining User Collection & Order Logs
  const customerMap: Record<string, UnifiedCustomer> = {};

  // First seed from User Collection DB
  dbUsers.forEach((u) => {
    const key = u.phone || u.email;
    if (!key) return;
    customerMap[key] = {
      id: u._id || key,
      name: u.name,
      email: u.email,
      phone: u.phone,
      district: u.district || 'Dhaka',
      address: u.fullAddress || 'Dhaka, Bangladesh',
      ip: u.ip || '103.24.12.89',
      totalOrders: 0,
      totalSpent: 0,
      isBlocked: u.isBlocked || blockedIps.has(u.ip || ''),
      registeredDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Registered',
      cart: u.cart ?? [],
    };
  });

  // Then aggregate orders
  orders.forEach((o) => {
    const key = o.shippingAddress.phone || o.userEmail || 'Guest';
    const ip = o.userIp || '103.24.12.89';

    if (!customerMap[key]) {
      customerMap[key] = {
        id: o.id,
        name: o.shippingAddress.fullName,
        email: o.userEmail || `${o.shippingAddress.phone}@falakcloset.com`,
        phone: o.shippingAddress.phone,
        district: o.shippingAddress.district || o.shippingAddress.city || 'Dhaka',
        address: o.shippingAddress.fullAddress || o.shippingAddress.street || 'Dhaka, Bangladesh',
        ip: ip,
        totalOrders: 1,
        totalSpent: o.total,
        isBlocked: blockedIps.has(ip),
        registeredDate: new Date(o.createdAt || Date.now()).toLocaleDateString(),
        cart: [],
      };
    } else {
      customerMap[key].totalOrders += 1;
      customerMap[key].totalSpent += o.total;
      if (!customerMap[key].ip || customerMap[key].ip === '103.24.12.89') {
        customerMap[key].ip = ip;
      }
      if (blockedIps.has(ip)) {
        customerMap[key].isBlocked = true;
      }
    }
  });

  const handleToggleBlockIp = async (customer: UnifiedCustomer) => {
    const targetIp = customer.ip || '103.24.12.89';
    const isCurrentlyBlocked = blockedIps.has(targetIp);

    if (isCurrentlyBlocked) {
      try {
        await fetch(`/api/security/block-ip?ip=${encodeURIComponent(targetIp)}`, { method: 'DELETE' });
      } catch { }

      setBlockedIps((prev) => {
        const next = new Set(prev);
        next.delete(targetIp);
        const array = Array.from(next).map((ip) => ({ ip, reason: 'Admin Ban' }));
        localStorage.setItem('falak_blocked_ips', JSON.stringify(array));
        return next;
      });

      setFeedback({ type: 'success', message: `Unblocked IP ${targetIp} for customer ${customer.name}.` });
    } else {
      try {
        await fetch('/api/security/block-ip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip: targetIp, reason: `Blocked for customer ${customer.name}`, blockedBy: 'Admin' })
        });
      } catch { }

      setBlockedIps((prev) => {
        const next = new Set(prev);
        next.add(targetIp);
        const array = Array.from(next).map((ip) => ({ ip, reason: 'Admin Ban' }));
        localStorage.setItem('falak_blocked_ips', JSON.stringify(array));
        return next;
      });

      setFeedback({ type: 'success', message: `Blocked IP ${targetIp} for customer ${customer.name}.` });
    }
  };

  const customerList = Object.values(customerMap).filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.ip.includes(q)
    );
  });

  return (
    <div className="space-y-6 text-stone-900">
      {/* Cart Detail Modal */}
      {cartModalCustomer && (
        <CartDetailModal
          customer={cartModalCustomer}
          products={products}
          onClose={() => setCartModalCustomer(null)}
        />
      )}

      {/* Top Bar */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>Customer Directory &amp; User Collection CRM</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time registered users, buyer IP locations, spending analytics, security controls, and saved cart insights.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, IP, district..."
            className="w-full pl-10 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold text-center ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Customer Directory Table */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-bold uppercase text-[10px]">
                <th className="pb-3 px-2">Customer Profile</th>
                <th className="pb-3 px-2">Contact Details</th>
                <th className="pb-3 px-2">Client IP &amp; Location</th>
                <th className="pb-3 px-2">Orders Count</th>
                <th className="pb-3 px-2">Lifetime Spent</th>
                <th className="pb-3 px-2">Saved Cart</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Actions &amp; Security</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-sans">
              {customerList.map((c) => {
                const cleanPhone = c.phone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/88${cleanPhone}`;
                const isVip = c.totalSpent > 10000 || c.totalOrders >= 2;
                const isBanned = blockedIps.has(c.ip);
                const cartCount = c.cart.reduce((s, i) => s + i.quantity, 0);
                const cartValue = c.cart.reduce((s, i) => {
                  const product = products.find((p) => p.id === i.productId);
                  return s + (product?.price ?? 0) * i.quantity;
                }, 0);

                return (
                  <tr key={c.phone || c.email} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="py-4 px-2 font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center font-serif text-xs font-bold shadow-xs">
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-extrabold text-stone-900 dark:text-stone-100">{c.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono font-normal">{c.email}</span>
                      </div>
                    </td>

                    <td className="py-4 px-2 font-mono font-bold text-stone-700 dark:text-stone-300">
                      {c.phone}
                    </td>

                    <td className="py-4 px-2 text-stone-700 dark:text-stone-300">
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1 font-bold text-stone-900 dark:text-stone-100">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          {c.district}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-stone-400">
                          <Globe className="w-3 h-3 text-stone-400" /> IP: {c.ip}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-2 font-mono font-bold text-stone-900 dark:text-stone-100">
                      {c.totalOrders} order(s)
                    </td>

                    <td className="py-4 px-2 font-mono font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(c.totalSpent)}
                    </td>

                    {/* Saved Cart Cell */}
                    <td className="py-4 px-2">
                      {cartCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setCartModalCustomer(c)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-bold text-amber-800 dark:text-amber-300 transition-colors cursor-pointer group"
                          title={`View saved cart — ${formatCurrency(cartValue)}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                          {cartCount} item{cartCount !== 1 ? 's' : ''}
                          <span className="text-amber-600 dark:text-amber-500 font-mono">
                            · {formatCurrency(cartValue)}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-stone-400 dark:text-stone-600 italic">
                          Empty
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-2">
                      {isBanned ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-red-600" /> IP Blocked
                        </span>
                      ) : isVip ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-700" /> VIP Patron
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 rounded-full text-[10px] font-semibold">
                          Active Client
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                          title="Contact via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleToggleBlockIp(c)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                            isBanned
                              ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{isBanned ? 'Unblock' : 'Block IP'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {customerList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    No customer records matched your query.
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
