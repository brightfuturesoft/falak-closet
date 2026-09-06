'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Receipt,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SummaryData {
  totalOrdersCount: number;
  deliveredOrdersCount: number;
  grossDeliveredRevenue: number;
  totalDiscountGiven: number;
  totalShippingCollected: number;
  netDeliveredRevenue: number;
  deliveredOrderCOGS: number;
  courierShippingCosts: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  totalAdditionalIncomes: number;
  netProfit: number;
  netMarginPct: number;
}

interface FinanceTx {
  id: string;
  title: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

interface OrderProfitRow {
  orderNumber: string;
  date: string;
  customerName: string;
  status: string;
  revenue: number;
  cogs: number;
  courierFee: number;
  netContribution: number;
  marginPct: number;
}

const CATEGORY_OPTIONS = [
  'Marketing & Ads',
  'Office Rent',
  'Packaging Supplies',
  'Salaries & Wages',
  'Logistics & Delivery',
  'Utilities & Electricity',
  'Software & Subscriptions',
  'Supplier & Stock Purchase',
  'Custom Operational',
];

export default function AdminFinancesPage() {
  const [timeframe, setTimeframe] = useState<string>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<FinanceTx[]>([]);
  const [orderProfitList, setOrderProfitList] = useState<OrderProfitRow[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<Record<string, number>>({});

  // Modal State for adding transaction
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txTitle, setTxTitle] = useState('');
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txCategory, setTxCategory] = useState(CATEGORY_OPTIONS[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const fetchFinances = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/finances?timeframe=${timeframe}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setTransactions(data.transactions || []);
        setOrderProfitList(data.orderProfitabilityList || []);
        setExpenseBreakdown(data.expenseCategoryBreakdown || {});
      }
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);
    const amountNum = parseFloat(txAmount);
    if (!txTitle.trim()) {
      setTxError('Title is required');
      return;
    }
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setTxError('Please enter a valid positive amount');
      return;
    }

    let finalCategory = txCategory;
    if (txCategory === 'Custom Operational') {
      if (!customCategory.trim()) {
        setTxError('Please specify a custom category name');
        return;
      }
      finalCategory = customCategory.trim();
    }

    setIsSubmittingTx(true);
    try {
      const res = await fetch('/api/admin/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: txTitle.trim(),
          type: txType,
          category: finalCategory,
          amount: amountNum,
          date: txDate,
          notes: txNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddTxOpen(false);
        setTxTitle('');
        setCustomCategory('');
        setTxAmount('');
        setTxNotes('');
        fetchFinances();
      } else {
        setTxError(data.error || 'Failed to save transaction');
      }
    } catch (err) {
      setTxError('Network error while saving transaction');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this financial record?')) return;

    try {
      const res = await fetch(`/api/admin/finances?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchFinances();
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const isNetProfit = (summary?.netProfit ?? 0) >= 0;

  return (
    <div className="space-y-8 text-stone-900 font-sans pb-12">
      {/* Top Title & Timeframe Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-700 rounded-2xl border border-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
              Accounts & Platform Finances
            </h1>
            <p className="text-xs text-stone-500">
              Real-time Profit & Loss statement based on delivered orders, product buying costs, & operational expenses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'year', label: 'This Year' },
            { id: 'all', label: 'All Time' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setTimeframe(btn.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeframe === btn.id
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
          <button
            onClick={fetchFinances}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-200 transition-colors cursor-pointer shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Executive Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Delivered Revenue */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">
              Delivered Revenue
            </span>
          </div>
          <div>
            <p className="font-mono font-black text-2xl sm:text-3xl text-stone-900">
              ৳ {formatCurrency(summary?.netDeliveredRevenue ?? 0)}
            </p>
            <p className="text-[11px] text-stone-500 font-medium mt-1">
              From {summary?.deliveredOrdersCount ?? 0} delivered orders
            </p>
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">
              Product COGS
            </span>
          </div>
          <div>
            <p className="font-mono font-black text-2xl sm:text-3xl text-amber-900">
              ৳ {formatCurrency(summary?.deliveredOrderCOGS ?? 0)}
            </p>
            <p className="text-[11px] text-stone-500 font-medium mt-1">
              Actual buying cost of sold products
            </p>
          </div>
        </div>

        {/* Courier / Shipping Fees */}
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">
              Courier Delivery Fees
            </span>
          </div>
          <div>
            <p className="font-mono font-black text-2xl sm:text-3xl text-purple-900">
              ৳ {formatCurrency(summary?.courierShippingCosts ?? 0)}
            </p>
            <p className="text-[11px] text-stone-500 font-medium mt-1">
              Logistics charges on delivered orders
            </p>
          </div>
        </div>

        {/* Net Profit / Loss */}
        <div className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
          isNetProfit ? 'bg-emerald-950 text-white border-emerald-900' : 'bg-rose-950 text-white border-rose-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isNetProfit ? 'bg-emerald-800/50 text-emerald-300' : 'bg-rose-800/50 text-rose-300'
            }`}>
              {isNetProfit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-80">
              Net {isNetProfit ? 'Profit' : 'Loss'}
            </span>
          </div>
          <div>
            <p className="font-mono font-black text-2xl sm:text-3xl">
              ৳ {formatCurrency(summary?.netProfit ?? 0)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                isNetProfit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                Margin: {(summary?.netMarginPct ?? 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Financial Breakdown Cards (Income vs Expenses) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step-by-Step P&L Summary Table (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-stone-700" />
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Profit & Loss Statement
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-stone-100 rounded-lg text-stone-600">
              {timeframe.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4 text-xs font-sans">
            {/* Revenue Row */}
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <span className="font-semibold text-stone-700">Gross Sales Subtotal</span>
              <span className="font-mono font-bold text-stone-900">৳ {formatCurrency(summary?.grossDeliveredRevenue ?? 0)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-stone-100 text-rose-600">
              <span>(-) Order Discounts Applied</span>
              <span className="font-mono font-bold">- ৳ {formatCurrency(summary?.totalDiscountGiven ?? 0)}</span>
            </div>

            <div className="flex items-center justify-between py-2.5 bg-blue-50/60 px-4 rounded-xl font-bold text-blue-900">
              <span>(=) Net Delivered Order Revenue</span>
              <span className="font-mono text-sm">৳ {formatCurrency(summary?.netDeliveredRevenue ?? 0)}</span>
            </div>

            {/* Direct Costs */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between py-2 border-b border-stone-100 text-stone-600">
                <span>(-) Cost of Goods Sold (COGS)</span>
                <span className="font-mono font-bold text-amber-700">- ৳ {formatCurrency(summary?.deliveredOrderCOGS ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-stone-100 text-stone-600">
                <span>(-) Logistics & Courier Shipping Costs</span>
                <span className="font-mono font-bold text-purple-700">- ৳ {formatCurrency(summary?.courierShippingCosts ?? 0)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 bg-stone-100 px-4 rounded-xl font-bold text-stone-900">
              <span>(=) Gross Operating Profit</span>
              <span className="font-mono text-sm text-emerald-700">৳ {formatCurrency(summary?.grossProfit ?? 0)}</span>
            </div>

            {/* Operating Expenses & Incomes */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between py-2 border-b border-stone-100 text-emerald-700">
                <span>(+) Additional Incomes / Revenue Adjustments</span>
                <span className="font-mono font-bold">+ ৳ {formatCurrency(summary?.totalAdditionalIncomes ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-stone-100 text-rose-700">
                <span>(-) Operational Expenses (Marketing, Rent, Salaries, etc.)</span>
                <span className="font-mono font-bold">- ৳ {formatCurrency(summary?.totalOperatingExpenses ?? 0)}</span>
              </div>
            </div>

            {/* Final Net Profit */}
            <div className={`flex items-center justify-between py-4 px-5 rounded-2xl font-black text-sm text-white ${
              isNetProfit ? 'bg-emerald-700' : 'bg-rose-700'
            }`}>
              <span>NET PLATFORM {isNetProfit ? 'PROFIT' : 'LOSS'}</span>
              <span className="font-mono text-base">৳ {formatCurrency(summary?.netProfit ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Expense Manager & Category Breakdown (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Add Expense Action Card */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Business Transactions
                </h3>
                <p className="text-xs text-stone-500">Record custom expenses or incomes</p>
              </div>

              <button
                onClick={() => setIsAddTxOpen(true)}
                className="px-4 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Record
              </button>
            </div>

            {/* Category Breakdown list */}
            {Object.keys(expenseBreakdown).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                  Expense Category Distribution
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(expenseBreakdown).map(([cat, amt]) => (
                    <div key={cat} className="flex items-center justify-between text-xs p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                      <span className="font-medium text-stone-700">{cat}</span>
                      <span className="font-mono font-bold text-stone-900">৳ {formatCurrency(amt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transactions History Feed */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-stone-900 border-b border-stone-100 pb-3">
              Recent Financial Records ({transactions.length})
            </h3>

            {transactions.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-6">No custom financial records found for this period.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tx.type}
                        </span>
                        <p className="font-bold text-stone-900 truncate">{tx.title}</p>
                      </div>
                      <p className="text-[10px] text-stone-500 truncate">
                        {tx.category} • {new Date(tx.date).toLocaleDateString()}
                        {tx.notes ? ` • ${tx.notes}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-mono font-bold text-sm ${
                        tx.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {tx.type === 'INCOME' ? '+' : '-'}৳ {formatCurrency(tx.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Order Profitability Audit Table ─────────────────────────────── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Delivered Orders Profit Audit
            </h3>
            <p className="text-xs text-stone-500">
              Individual order revenue vs product buying cost (COGS) & courier fees
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
            {orderProfitList.length} Delivered Orders
          </span>
        </div>

        {orderProfitList.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            No delivered or completed orders recorded for this timeframe.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px]">
                  <th className="pb-3 pr-4 font-semibold">Order #</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 pr-4 font-semibold">Customer</th>
                  <th className="pb-3 pr-4 font-semibold text-right">Revenue (৳)</th>
                  <th className="pb-3 pr-4 font-semibold text-right">Items COGS (৳)</th>
                  <th className="pb-3 pr-4 font-semibold text-right">Courier Fee (৳)</th>
                  <th className="pb-3 pr-4 font-semibold text-right">Net Profit (৳)</th>
                  <th className="pb-3 font-semibold text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {orderProfitList.map((row) => {
                  const isProfit = row.netContribution >= 0;
                  return (
                    <tr key={row.orderNumber} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 pr-4 font-mono font-bold text-stone-900">
                        {row.orderNumber}
                      </td>
                      <td className="py-3 pr-4 text-stone-500 text-[11px] whitespace-nowrap">
                        {row.date ? new Date(row.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 pr-4 font-medium text-stone-800 truncate max-w-[140px]">
                        {row.customerName}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono font-bold text-stone-900">
                        ৳ {formatCurrency(row.revenue)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-amber-800 font-medium">
                        ৳ {formatCurrency(row.cogs)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-purple-800 font-medium">
                        ৳ {formatCurrency(row.courierFee)}
                      </td>
                      <td className={`py-3 pr-4 text-right font-mono font-bold ${
                        isProfit ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        ৳ {formatCurrency(row.netContribution)}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          isProfit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {row.marginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Transaction Modal ────────────────────────────────────────── */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Add Financial Transaction
              </h3>
              <button
                onClick={() => setIsAddTxOpen(false)}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {txError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{txError}</span>
              </div>
            )}

            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTxType('EXPENSE')}
                  className={`py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                    txType === 'EXPENSE'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  Expense / Outflow
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('INCOME')}
                  className={`py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                    txType === 'INCOME'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  Income / Adjustment
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Transaction Title</label>
                <input
                  type="text"
                  required
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  placeholder="e.g. Meta Facebook Ads Payment"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">Category</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">Amount (৳ BDT)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              {txCategory === 'Custom Operational' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="font-bold text-stone-700 flex items-center justify-between">
                    <span>Custom Category Name</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Required</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Office Snacks, Influencer PR, Maintenance"
                    className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Transaction Date</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Optional Notes</label>
                <input
                  type="text"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="e.g. Invoice #1042"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddTxOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTx}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
                >
                  {isSubmittingTx ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
