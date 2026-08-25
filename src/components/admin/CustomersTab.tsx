'use client';

import React, { useState, useEffect } from 'react';
import { Users, MapPin, Search, MessageSquare, ShieldCheck, Ban, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { OrderRecord } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface CustomersTabProps {
  orders: OrderRecord[];
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
}

export function CustomersTab({ orders }: CustomersTabProps) {
  const [query, setQuery] = useState('');
  const [dbUsers, setDbUsers] = useState<UserDbRecord[]>([]);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      setBlockedIps(new Set(allBlocked.map((b: any) => b.ip)));
    } catch {
      const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
      setBlockedIps(new Set(localBlocked.map((b: any) => b.ip)));
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
      registeredDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Registered'
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
        registeredDate: new Date(o.createdAt || Date.now()).toLocaleDateString()
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
      // Unblock
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
      // Block
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
      {/* Top Bar */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>Customer Directory & User Collection CRM</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time registered users, buyer IP locations, spending analytics, and security controls.
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
                <th className="pb-3 px-2">Client IP & Location</th>
                <th className="pb-3 px-2">Orders Count</th>
                <th className="pb-3 px-2">Lifetime Spent</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Actions & Security</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-sans">
              {customerList.map((c) => {
                const cleanPhone = c.phone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/88${cleanPhone}`;
                const isVip = c.totalSpent > 10000 || c.totalOrders >= 2;
                const isBanned = blockedIps.has(c.ip);

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
                  <td colSpan={7} className="py-12 text-center text-stone-500">
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
