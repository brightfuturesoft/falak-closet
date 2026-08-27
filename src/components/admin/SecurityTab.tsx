'use client';

import React, { useState, useMemo } from 'react';
import { ShieldAlert, ShieldCheck, Ban, Search, AlertTriangle, UserX, RefreshCw, Flame } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';
import {
  StatCard, SortHeader, PaginationBar, SkeletonRows, EmptyState, ResultCount,
  useDebouncedValue, usePaginatedRows, type SortDir,
} from '@/components/admin/tableKit';

interface BlockedIpItem {
  ip: string;
  reason: string;
  blockedBy: string;
  blockedAt: string;
}

type SortKey = 'ip' | 'reason' | 'blockedAt';

export function SecurityTab() {
  const { orders } = useCart();
  const { addToast } = useAdminDashboard();
  const addToastRef = React.useRef(addToast);
  React.useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  // Server-side pagination state
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [sortKey, setSortKey] = useState<SortKey>('blockedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [stats, setStats] = useState<{ totalBlocked: number; blockedLast24h: number } | null>(null);
  const [ipInput, setIpInput] = useState('');
  const [reasonInput, setReasonInput] = useState('Suspicious Activity / Fraud Alert');

  const url = useMemo(
    () =>
      `/api/security/block-ip?${new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        query: debouncedQuery,
        sort: sortKey,
        dir: sortDir,
      })}`,
    [page, pageSize, debouncedQuery, sortKey, sortDir]
  );

  const { rows: blockedIps, pagination, isLoading, refetch } = usePaginatedRows<BlockedIpItem>(
    url,
    (data) => {
      setStats(data.stats as { totalBlocked: number; blockedLast24h: number });
      return { rows: data.blockedIps as BlockedIpItem[], pagination: data.pagination as never };
    },
    (message) => addToastRef.current('error', `Could not load blocked IPs: ${message}`)
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'blockedAt' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const applyQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleBlockIp = async (ipToBlock?: string, customReason?: string) => {
    const targetIp = (ipToBlock || ipInput).trim();
    const targetReason = customReason || reasonInput || 'Admin Security Policy';

    if (!targetIp) {
      addToast('error', 'Please enter a valid IP address.');
      return;
    }

    try {
      const res = await fetch('/api/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIp, reason: targetReason, blockedBy: 'Super Admin' })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);

      if (!ipToBlock) setIpInput('');
      addToast('warning', `IP ${targetIp} blocked.`);
      refetch();
    } catch (err) {
      addToast('error', `Could not block ${targetIp}: ${(err as Error).message}`);
    }
  };

  const handleUnblockIp = async (targetIp: string) => {
    try {
      const res = await fetch(`/api/security/block-ip?ip=${encodeURIComponent(targetIp)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);
      addToast('success', `IP ${targetIp} unblocked.`);
      refetch();
    } catch (err) {
      addToast('error', `Could not unblock ${targetIp}: ${(err as Error).message}`);
    }
  };

  // Client-side view: unique IPs from the live order feed (already in context).
  const uniqueClients = useMemo(() => {
    const seen = new Map<string, { ip: string; name: string; contact: string; orderId: string; date: string }>();
    const blockedSet = new Set(blockedIps.map((b) => b.ip));
    orders.forEach((o) => {
      const ip = o.userIp || '103.24.12.89';
      if (!seen.has(ip)) {
        seen.set(ip, {
          ip,
          name: o.shippingAddress?.fullName || 'Anonymous Patron',
          contact: o.userEmail || o.shippingAddress?.phone || 'N/A',
          orderId: o.id,
          date: o.date,
        });
      }
    });
    return Array.from(seen.values()).map((c) => ({ ...c, isBlocked: blockedSet.has(c.ip) }));
  }, [orders, blockedIps]);

  const showSkeleton = isLoading && blockedIps.length === 0;
  const showEmpty = !isLoading && blockedIps.length === 0;

  return (
    <div className="space-y-6 text-stone-900">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Ban} label="Banned IPs" value={stats?.totalBlocked ?? '—'} sub="firewall rules" tone="rose" />
        <StatCard icon={Flame} label="Last 24h" value={stats?.blockedLast24h ?? '—'} sub="recently blocked" tone="amber" />
        <StatCard icon={UserX} label="Client IPs" value={uniqueClients.length} sub="seen in orders" />
        <StatCard icon={ShieldCheck} label="Firewall" value="Active" sub="proxy + DB enforced" tone="emerald" />
      </div>

      {/* Manual block form */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" /> Block New Client IP Address
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-600">IP Address *</label>
            <input
              type="text"
              placeholder="e.g. 103.24.12.89"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-stone-600">Reason / Description</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Reason for blocking IP address"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
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

      {/* Blocked IP table */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <ResultCount pagination={pagination} />
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search IP or reason..."
                value={query}
                onChange={(e) => applyQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <button
              onClick={refetch}
              disabled={isLoading}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Refresh rules"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {showSkeleton ? (
          <SkeletonRows count={pageSize} />
        ) : showEmpty ? (
          <EmptyState
            icon={ShieldCheck}
            title={query.trim() ? 'No blocked IPs match your search' : 'No IP addresses blocked'}
            description={query.trim() ? `Nothing matches "${query.trim()}".` : 'The firewall is clean — block suspicious IPs with the form above.'}
            onClear={query.trim() ? () => applyQuery('') : undefined}
          />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px]">
                    <SortHeader label="IP Address" active={sortKey === 'ip'} dir={sortDir} onSort={() => handleSort('ip')} />
                    <SortHeader label="Reason" active={sortKey === 'reason'} dir={sortDir} onSort={() => handleSort('reason')} />
                    <th className="pb-3 pr-4 font-semibold">Blocked By</th>
                    <SortHeader label="Date" active={sortKey === 'blockedAt'} dir={sortDir} onSort={() => handleSort('blockedAt')} />
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {blockedIps.map((b) => (
                    <tr key={b.ip} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 pr-4 font-mono font-bold text-red-600">{b.ip}</td>
                      <td className="py-3 pr-4 text-stone-700 max-w-[260px] truncate" title={b.reason}>{b.reason}</td>
                      <td className="py-3 pr-4 text-stone-500">{b.blockedBy}</td>
                      <td className="py-3 pr-4 text-stone-400 font-mono text-[11px] tabular-nums">
                        {new Date(b.blockedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleUnblockIp(b.ip)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar
              pagination={pagination}
              onPage={setPage}
              onPageSize={(size) => { setPageSize(size); setPage(1); }}
            />
          </>
        )}
      </div>

      {/* Client activity (context order feed, client-side) */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" /> Detected Client Order IPs & Quick Ban
          </h3>
          <span className="text-xs font-mono text-stone-500">{uniqueClients.length} unique</span>
        </div>

        {uniqueClients.length === 0 ? (
          <EmptyState
            icon={UserX}
            title="No client activity yet"
            description="Client IPs appear here once orders start arriving."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px]">
                  <th className="pb-3 pr-4 font-semibold">Client IP</th>
                  <th className="pb-3 pr-4 font-semibold">Customer</th>
                  <th className="pb-3 pr-4 font-semibold">Contact</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Ban Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {uniqueClients.map((client) => (
                  <tr key={client.ip} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 pr-4 font-mono font-bold text-stone-900">{client.ip}</td>
                    <td className="py-3 pr-4 text-stone-800">{client.name}</td>
                    <td className="py-3 pr-4 text-stone-500 font-mono text-[11px] truncate max-w-[160px]">{client.contact}</td>
                    <td className="py-3 pr-4">
                      {client.isBlocked ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase">Blocked</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Allowed</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
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
                          <Ban className="w-3 h-3" /> Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
