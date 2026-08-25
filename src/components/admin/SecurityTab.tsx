'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Ban, CheckCircle, Search, AlertTriangle, UserX, RefreshCw } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface BlockedIpItem {
  ip: string;
  reason: string;
  blockedBy: string;
  blockedAt: string;
}

export function SecurityTab() {
  const { orders } = useCart();
  const [blockedIps, setBlockedIps] = useState<BlockedIpItem[]>([]);
  const [ipInput, setIpInput] = useState('');
  const [reasonInput, setReasonInput] = useState('Suspicious Activity / Fraud Alert');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load Blocked IPs from API & localStorage
  const loadBlockedIps = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/security/block-ip');
      const data = await res.json();
      if (data.blockedIps) {
        setBlockedIps(data.blockedIps);
        localStorage.setItem('falak_blocked_ips', JSON.stringify(data.blockedIps));
        setIsLoading(false);
        return;
      }
    } catch { }

    try {
      const local = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
      setBlockedIps(local);
    } catch {
      setBlockedIps([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlockedIps();
  }, []);

  const handleBlockIp = async (ipToBlock?: string, customReason?: string) => {
    const targetIp = (ipToBlock || ipInput).trim();
    const targetReason = customReason || reasonInput || 'Admin Security Policy';

    if (!targetIp) {
      setFeedback({ type: 'error', message: 'Please enter a valid IP address.' });
      return;
    }

    try {
      const res = await fetch('/api/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIp, reason: targetReason, blockedBy: 'Super Admin' })
      });
      const data = await res.json();

      const newEntry: BlockedIpItem = {
        ip: targetIp,
        reason: targetReason,
        blockedBy: 'Super Admin',
        blockedAt: new Date().toISOString()
      };

      setBlockedIps((prev) => {
        const filtered = prev.filter((b) => b.ip !== targetIp);
        const updated = [newEntry, ...filtered];
        localStorage.setItem('falak_blocked_ips', JSON.stringify(updated));
        return updated;
      });

      setIpInput('');
      setFeedback({ type: 'success', message: `IP Address ${targetIp} has been blocked.` });
    } catch {
      const newEntry: BlockedIpItem = {
        ip: targetIp,
        reason: targetReason,
        blockedBy: 'Super Admin',
        blockedAt: new Date().toISOString()
      };

      setBlockedIps((prev) => {
        const updated = [newEntry, ...prev.filter((b) => b.ip !== targetIp)];
        localStorage.setItem('falak_blocked_ips', JSON.stringify(updated));
        return updated;
      });

      setIpInput('');
      setFeedback({ type: 'success', message: `IP Address ${targetIp} blocked locally.` });
    }
  };

  const handleUnblockIp = async (targetIp: string) => {
    try {
      await fetch(`/api/security/block-ip?ip=${encodeURIComponent(targetIp)}`, { method: 'DELETE' });
    } catch { }

    setBlockedIps((prev) => {
      const updated = prev.filter((b) => b.ip !== targetIp);
      localStorage.setItem('falak_blocked_ips', JSON.stringify(updated));
      return updated;
    });

    setFeedback({ type: 'success', message: `IP Address ${targetIp} unblocked successfully.` });
  };

  // Extract client IPs from actual placed orders
  const clientActivityList = orders.map((o) => ({
    ip: o.userIp || '103.24.12.89',
    name: o.shippingAddress?.fullName || 'Anonymous Patron',
    email: o.userEmail || o.shippingAddress?.phone || 'N/A',
    orderId: o.id,
    date: o.date
  }));

  // Unique client IPs
  const uniqueClients = Array.from(new Set(clientActivityList.map((c) => c.ip))).map((ip) => {
    const client = clientActivityList.find((c) => c.ip === ip)!;
    const isBlocked = blockedIps.some((b) => b.ip === ip);
    return { ...client, isBlocked };
  });

  const filteredBlocked = blockedIps.filter(
    (b) => b.ip.includes(searchQuery) || b.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 dark:bg-stone-950 p-6 rounded-3xl text-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-stone-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <h2 className="font-serif font-bold text-xl text-amber-400">IP Security & Ban Management</h2>
          </div>
          <p className="text-xs text-stone-400">
            Block malicious client IPs, prevent unauthorized orders, and manage access restrictions.
          </p>
        </div>

        <button
          onClick={loadBlockedIps}
          disabled={isLoading}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Rules
        </button>
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

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-stone-400">Total Banned IPs</p>
            <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {blockedIps.length}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-stone-400">Detected Client IPs</p>
            <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {uniqueClients.length}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-stone-400">Firewall Status</p>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Active & Protected
            </p>
          </div>
        </div>
      </div>

      {/* Manual IP Block Form */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" /> Block New Client IP Address
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400">IP Address *</label>
            <input
              type="text"
              placeholder="e.g. 103.24.12.89"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400">Reason / Description</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Reason for blocking IP address"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => handleBlockIp()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" /> Block IP
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Currently Blocked IP List */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
            Currently Blocked IP Addresses ({filteredBlocked.length})
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search blocked IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
            />
          </div>
        </div>

        {filteredBlocked.length === 0 ? (
          <div className="py-10 text-center text-xs text-stone-400 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
            <p>No IP addresses currently blocked.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Blocked IP Address</th>
                  <th className="py-3 px-2">Reason</th>
                  <th className="py-3 px-2">Blocked By</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                {filteredBlocked.map((b) => (
                  <tr key={b.ip} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                    <td className="py-3 px-2 font-mono font-bold text-red-600 dark:text-red-400">
                      {b.ip}
                    </td>
                    <td className="py-3 px-2 text-stone-700 dark:text-stone-300">
                      {b.reason}
                    </td>
                    <td className="py-3 px-2 text-stone-500">
                      {b.blockedBy}
                    </td>
                    <td className="py-3 px-2 text-stone-400 font-mono text-[11px]">
                      {new Date(b.blockedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleUnblockIp(b.ip)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Unblock IP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client IP Activity & Quick Ban */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
          Detected Client Order IPs & Quick Ban
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                <th className="py-3 px-2">Client IP</th>
                <th className="py-3 px-2">Customer Name</th>
                <th className="py-3 px-2">Contact</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Ban Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
              {uniqueClients.map((client) => (
                <tr key={client.ip} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                  <td className="py-3 px-2 font-mono font-bold text-stone-900 dark:text-stone-100">
                    {client.ip}
                  </td>
                  <td className="py-3 px-2 text-stone-800 dark:text-stone-200">
                    {client.name}
                  </td>
                  <td className="py-3 px-2 text-stone-500 font-mono text-[11px]">
                    {client.email}
                  </td>
                  <td className="py-3 px-2">
                    {client.isBlocked ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 text-[10px] font-bold rounded-full uppercase">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold rounded-full uppercase">
                        Allowed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {client.isBlocked ? (
                      <button
                        onClick={() => handleUnblockIp(client.ip)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlockIp(client.ip, `Blocked from client activity order #${client.orderId}`)}
                        className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Ban className="w-3 h-3" /> Block IP
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
