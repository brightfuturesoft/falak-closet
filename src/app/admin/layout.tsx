'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AdminLoginGate } from '@/components/admin/AdminLoginGate';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ToastNotification } from '@/components/admin/ToastNotification';
import {
  AdminDashboardProvider,
  useAdminDashboard,
} from '@/components/admin/AdminDashboardContext';
import { playNewOrderSound } from '@/lib/soundNotification';

/**
 * Heavy modals are code-split and only downloaded when first opened — the
 * product form (Cloudinary uploader, color picker) is far too large to ship
 * with the shell bundle.
 */
const ReceiptModal = dynamic(() =>
  import('@/components/receipt/ReceiptModal').then((m) => ({ default: m.ReceiptModal }))
);
const ProductFormModal = dynamic(() =>
  import('@/components/admin/ProductFormModal').then((m) => ({ default: m.ProductFormModal }))
);
const PromoFormModal = dynamic(() =>
  import('@/components/admin/PromoFormModal').then((m) => ({ default: m.PromoFormModal }))
);
const AdminCreateOrderModal = dynamic(() =>
  import('@/components/admin/AdminCreateOrderModal').then((m) => ({ default: m.AdminCreateOrderModal }))
);

function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = useAdminDashboard();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Gate Check — rendered before the workspace, but after the provider so the
  // login screen can flip `isAdminLoggedIn` and mount the dashboard.
  if (!admin.isAdminLoggedIn) {
    return <AdminLoginGate onLoginSuccess={() => admin.setIsAdminLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col lg:flex-row font-sans selection:bg-[#9B050B] selection:text-white">
      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0">
        <AdminSidebar
          pendingOrdersCount={admin.pendingOrdersCount}
          productsCount={admin.productsList.length}
          promosCount={admin.promosList.length}
          dbSource={admin.dbSource}
          onLogout={admin.handleAdminLogout}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 bg-white h-full z-10">
            <AdminSidebar
              pendingOrdersCount={admin.pendingOrdersCount}
              productsCount={admin.productsList.length}
              promosCount={admin.promosList.length}
              dbSource={admin.dbSource}
              onLogout={admin.handleAdminLogout}
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Workspace — each route renders into this slot */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Header Bar */}
        <AdminHeader
          searchQuery={admin.globalSearchQuery}
          setSearchQuery={admin.setGlobalSearchQuery}
          onRefresh={admin.fetchAllData}
          isRefreshing={admin.isRefreshing}
          pendingOrdersCount={admin.pendingOrdersCount}
          lowStockCount={admin.lowStockCount}
          isSocketConnected={admin.isSocketConnected}
          onTestSound={() => {
            playNewOrderSound();
            admin.addToast('info', '🔊 Testing Order Notification Audio Chime!');
          }}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          onOpenAddProductModal={() => {
            admin.setEditingProduct(null);
            admin.setIsAddProductOpen(true);
          }}
        />

        {/* Route Content */}
        <main className="p-4 sm:p-6 lg:p-10 space-y-8 flex-1">{children}</main>
      </div>

      {/* Printable Order Receipt Modal */}
      {admin.selectedOrderReceipt && (
        <ReceiptModal
          order={admin.selectedOrderReceipt}
          onClose={() => admin.setSelectedOrderReceipt(null)}
        />
      )}

      {/* Direct Admin POS Order Creation Modal */}
      {admin.isCreateOrderOpen && (
        <AdminCreateOrderModal
          isOpen={admin.isCreateOrderOpen}
          onClose={() => admin.setIsCreateOrderOpen(false)}
          onOrderCreated={admin.handleDirectOrderCreated}
          productsList={admin.productsList}
        />
      )}

      {/* Add / Edit Product Modal */}
      {admin.isAddProductOpen && (
        <ProductFormModal
          isOpen={admin.isAddProductOpen}
          onClose={() => {
            admin.setIsAddProductOpen(false);
            admin.setEditingProduct(null);
          }}
          onSaveProduct={admin.handleSaveProduct}
          editingProduct={admin.editingProduct}
          existingProducts={admin.productsList}
        />
      )}

      {/* Add / Edit Promo Voucher Modal */}
      {admin.isAddPromoOpen && (
        <PromoFormModal
          isOpen={admin.isAddPromoOpen}
          onClose={() => {
            admin.setIsAddPromoOpen(false);
            admin.setEditingPromo(null);
          }}
          onSavePromotion={admin.handleSavePromotion}
          editingPromo={admin.editingPromo}
        />
      )}

      {/* Toast Notification Container */}
      <ToastNotification toasts={admin.toasts} onDismiss={admin.removeToast} />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardProvider>
      <AdminShell>{children}</AdminShell>
    </AdminDashboardProvider>
  );
}
