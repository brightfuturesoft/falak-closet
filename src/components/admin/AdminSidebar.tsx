'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Package,
  Tag,
  Users,
  BarChart3,
  Settings,
  ShieldAlert,
  FolderTree,
  Megaphone,
  Images,
  Star,
  LogOut,
  Wallet
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export type AdminTabType = 'overview' | 'orders' | 'products' | 'categories' | 'promotions' | 'customers' | 'analytics' | 'finances' | 'security' | 'settings' | 'delivery' | 'banners' | 'hero' | 'reviews';

interface AdminSidebarProps {
  pendingOrdersCount: number;
  productsCount: number;
  promosCount: number;
  dbSource: string;
  onLogout: () => void;
  onCloseMobileDrawer?: () => void;
}

/** Derive the active tab from the real URL segment (/admin/<tab>). */
export function activeTabFromPathname(pathname: string): AdminTabType {
  const segment = pathname.replace(/^\/admin\/?/, '').split('/')[0];
  const tabs: AdminTabType[] = [
    'overview', 'orders', 'products', 'categories', 'promotions', 'customers',
    'finances', 'security', 'analytics', 'settings', 'delivery', 'banners', 'hero', 'reviews'
  ];
  return (tabs.find((t) => t === segment) || 'overview') as AdminTabType;
}

export function AdminSidebar({
  pendingOrdersCount,
  productsCount,
  promosCount,
  dbSource,
  onLogout,
  onCloseMobileDrawer
}: AdminSidebarProps) {
  const pathname = usePathname();
  const activeTab = activeTabFromPathname(pathname);
  const navItems = [
    {
      id: 'overview' as AdminTabType,
      href: '/admin',
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'orders' as AdminTabType,
      href: '/admin/orders',
      label: 'Orders Pipeline',
      icon: Truck,
      badge: pendingOrdersCount > 0 ? (
        <span className="px-2 py-0.5 bg-[#9B050B] text-white rounded-full text-[10px] font-mono font-bold animate-pulse">
          {pendingOrdersCount}
        </span>
      ) : null
    },
    {
      id: 'products' as AdminTabType,
      href: '/admin/products',
      label: 'Product Catalog',
      icon: Package,
      badge: (
        <span className="text-[10px] font-mono text-stone-600 font-bold px-2 py-0.5 bg-stone-100 rounded-md border border-stone-200">
          {productsCount}
        </span>
      )
    },
    {
      id: 'reviews' as AdminTabType,
      href: '/admin/reviews',
      label: 'Customer Reviews',
      icon: Star,
      badge: null
    },
    {
      id: 'categories' as AdminTabType,
      href: '/admin/categories',
      label: 'Category Taxonomy',
      icon: FolderTree,
      badge: null
    },

    {
      id: 'promotions' as AdminTabType,
      href: '/admin/promotions',
      label: 'Promotions ',
      icon: Tag,
      badge: promosCount > 0 ? (
        <span className="text-[10px] font-mono text-[#9B050B] font-bold px-2 py-0.5 bg-[#FDF2F3] rounded-md border border-[#F8D2D5]">
          {promosCount}
        </span>
      ) : null
    },
    {
      id: 'banners' as AdminTabType,
      href: '/admin/banners',
      label: 'Live Promotion Banners',
      icon: Megaphone,
      badge: null
    },
    {
      id: 'hero' as AdminTabType,
      href: '/admin/hero',
      label: 'Hero Carousel Slides',
      icon: Images,
      badge: null
    },
    {
      id: 'customers' as AdminTabType,
      href: '/admin/customers',
      label: 'Customers & CRM',
      icon: Users,
      badge: null
    },
    {
      id: 'security' as AdminTabType,
      href: '/admin/security',
      label: 'IP Security & Bans',
      icon: ShieldAlert,
      badge: null
    },
    {
      id: 'finances' as AdminTabType,
      href: '/admin/finances',
      label: 'Accounts & Finances',
      icon: Wallet,
      badge: null
    },
    {
      id: 'analytics' as AdminTabType,
      href: '/admin/analytics',
      label: 'Analytics & Reports',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'settings' as AdminTabType,
      href: '/admin/settings',
      label: 'System & DB Config',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-stone-200 p-6 flex flex-col justify-between flex-shrink-0 h-full text-stone-900 shadow-xs">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="space-y-3 pb-2 border-b border-stone-100">
          <Logo variant="full" size="md" href="/admin" />
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 text-xs font-bold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  if (onCloseMobileDrawer) onCloseMobileDrawer();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${isActive
                    ? 'bg-stone-900 text-white shadow-md border border-stone-900'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#F2C76E]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </span>
                {item.badge}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Admin Logout */}
      <div className="pt-6 border-t border-stone-200 space-y-3">
        <button
          onClick={onLogout}
          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-200"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Exit Admin Portal</span>
        </button>
      </div>
    </aside>
  );
}
