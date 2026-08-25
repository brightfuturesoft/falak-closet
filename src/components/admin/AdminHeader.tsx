'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Search,
  RefreshCw,
  Bell,
  ExternalLink,
  AlertTriangle,
  Package,
  ShoppingBag,
  Zap,
  Volume2
} from 'lucide-react';
import { AdminTabType } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTabType;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  pendingOrdersCount: number;
  lowStockCount: number;
  onToggleMobileDrawer: () => void;
  onOpenAddProductModal?: () => void;
  isSocketConnected?: boolean;
  onTestSound?: () => void;
}

export function AdminHeader({
  activeTab,
  searchQuery,
  setSearchQuery,
  onRefresh,
  isRefreshing,
  pendingOrdersCount,
  lowStockCount,
  onToggleMobileDrawer,
  onOpenAddProductModal,
  isSocketConnected = false,
  onTestSound
}: AdminHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const titles: Record<AdminTabType, { title: string; subtitle: string }> = {
    overview: {
      title: 'Executive Store Dashboard',
      subtitle: 'Real-time sales performance, revenue analytics, and system operations.'
    },
    orders: {
      title: 'Real-Time Orders Pipeline',
      subtitle: 'Fulfillment workflow, order status tracking, and printable customer receipts.'
    },
    products: {
      title: 'Product Inventory Catalog',
      subtitle: 'Manage modest fashion products, stock levels, categories, and color palettes.'
    },
    categories: {
      title: 'Category Taxonomy Management',
      subtitle: 'CRUD operations for main categories and subcategories synced live across the store.'
    },
    promotions: {
      title: 'Promotions & Flash Vouchers',
      subtitle: 'Create promotional discount codes, active coupon banners, and flash deals.'
    },
    customers: {
      title: 'Customer Directory & CRM',
      subtitle: 'Customer profiles, order frequency, total spending, and direct support.'
    },
    analytics: {
      title: 'Sales & Business Intelligence',
      subtitle: 'Division-wise logistics analytics, payment method breakdown, and performance.'
    },
    security: {
      title: 'IP Security & Ban Management',
      subtitle: 'Block malicious IP addresses, manage ban rules, and review client activity logs.'
    },
    settings: {
      title: 'System & Database Config',
      subtitle: 'MongoDB connection parameters, database seeder, and store parameters.'
    }
  };

  const currentTabMeta = titles[activeTab] || titles.overview;
  const totalAlerts = pendingOrdersCount + lowStockCount;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 p-4 sm:p-6 sticky top-0 z-30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
      {/* Mobile Menu Button & Page Title */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileDrawer}
            className="p-2 bg-stone-100 border border-stone-200 text-stone-700 rounded-xl lg:hidden hover:bg-stone-200 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              {currentTabMeta.title}
            </h1>
            <p className="text-xs text-stone-500 font-sans hidden sm:block">
              {currentTabMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Mobile View Notifications & Live Storefront Link */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/shop"
            className="p-2 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Global Actions: Search Bar, Refresh, Notifications, Live Store Link */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {/* Global Search Input */}
        <div className="relative flex-1 md:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, products, customers..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Add Product Button */}
        {onOpenAddProductModal && (
          <button
            onClick={onOpenAddProductModal}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Create New Product Item"
          >
            <Package className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">+ Add Product</span>
          </button>
        )}



        {/* Live Data Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 sm:px-4 sm:py-2.5 bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          title="Refresh store data from MongoDB"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200 rounded-xl transition-all relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#9B050B] text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                {totalAlerts}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="font-serif font-bold text-xs text-stone-900">Store Notifications</span>
                <span className="text-[10px] font-mono text-stone-500">{totalAlerts} Active</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                {pendingOrdersCount > 0 && (
                  <Link href="/admin/orders" className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900 text-[11px]">{pendingOrdersCount} Pending Fulfillment Orders</p>
                      <p className="text-[10px] text-stone-500">Requires processing in Orders Pipeline.</p>
                    </div>
                  </Link>
                )}

                {lowStockCount > 0 && (
                  <Link href="/admin/products" className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900 text-[11px]">{lowStockCount} Products Low on Stock</p>
                      <p className="text-[10px] text-stone-500">Inventory items running under 5 units.</p>
                    </div>
                  </Link>
                )}

                {totalAlerts === 0 && (
                  <p className="text-center text-xs text-stone-500 py-3">All store operations normal!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Storefront Link */}
        <Link
          href="/shop"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
        >
          <span>Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#F2C76E]" />
        </Link>
      </div>
    </header>
  );
}
