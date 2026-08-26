'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AdminLoginGate } from '@/components/admin/AdminLoginGate';
import { AdminSidebar, AdminTabType } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { OverviewTab } from '@/components/admin/OverviewTab';
import { OrdersTab } from '@/components/admin/OrdersTab';
import { ProductsTab } from '@/components/admin/ProductsTab';
import { CategoriesTab } from '@/components/admin/CategoriesTab';
import { PromotionsTab } from '@/components/admin/PromotionsTab';
import { CustomersTab } from '@/components/admin/CustomersTab';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';
import { SecurityTab } from '@/components/admin/SecurityTab';
import { SettingsTab } from '@/components/admin/SettingsTab';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { OrderReceiptModal } from '@/components/admin/OrderReceiptModal';
import { PromoFormModal, PromoVoucherData } from '@/components/admin/PromoFormModal';
import { AdminCreateOrderModal } from '@/components/admin/AdminCreateOrderModal';
import { ToastNotification, ToastMessage } from '@/components/admin/ToastNotification';

import { Product } from '@/data/products';
import { playNewOrderSound } from '@/lib/soundNotification';
import { useCart, OrderRecord } from '@/context/CartContext';
import { getSocket } from '@/lib/socketClient';

/**
 * Every admin write goes through this. The handlers below used to be
 * `try { await fetch(...) } catch { }` followed by an unconditional optimistic
 * update and a success toast — so a rejected write still read as "published to
 * store!". Here a non-2xx response, or a body without `success: true`, is a
 * failure and the caller must not touch state.
 */
async function requestJson<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, init);
    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success) {
      return { ok: false, error: body?.error || `HTTP ${res.status} ${res.statusText}` };
    }
    return { ok: true, data: body as T };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Network error — is the server running?' };
  }
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const promoKey = (promo: Pick<PromoVoucherData, '_id' | 'id' | 'code'>) =>
  promo._id || promo.id || promo.code;


function AdminDashboardContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { orders: localOrders, refreshProductsFromApi } = useCart();

  // Track known order IDs for sound & toast notifications
  const knownOrderIdsRef = React.useRef<Set<string>>(new Set());

  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Tab State synced from URL route
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');

  // Sync active tab state from URL pathname (e.g. /admin/orders, /admin/products) or query param
  useEffect(() => {
    if (pathname.includes('/admin/orders')) {
      setActiveTab('orders');
    } else if (pathname.includes('/admin/products')) {
      setActiveTab('products');
    } else if (pathname.includes('/admin/categories')) {
      setActiveTab('categories');
    } else if (pathname.includes('/admin/promotions')) {
      setActiveTab('promotions');
    } else if (pathname.includes('/admin/customers')) {
      setActiveTab('customers');
    } else if (pathname.includes('/admin/security')) {
      setActiveTab('security');
    } else if (pathname.includes('/admin/analytics')) {
      setActiveTab('analytics');
    } else if (pathname.includes('/admin/settings')) {
      setActiveTab('settings');
    } else {
      const tabParam = searchParams.get('tab');
      if (tabParam && ['overview', 'orders', 'products', 'promotions', 'customers', 'security', 'analytics', 'settings'].includes(tabParam)) {
        setActiveTab(tabParam as AdminTabType);
      } else {
        setActiveTab('overview');
      }
    }
  }, [pathname, searchParams]);

  // Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // DB Source & Data State
  const [dbSource, setDbSource] = useState<string>('Connecting...');
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [promosList, setPromosList] = useState<PromoVoucherData[]>([]);
  const [ordersList, setOrdersList] = useState<OrderRecord[]>([]);

  // Loading & Action States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modal States
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<OrderRecord | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddPromoOpen, setIsAddPromoOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoVoucherData | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

  const handleDirectOrderCreated = (newOrder: OrderRecord) => {
    setOrdersList((prev) => [newOrder, ...prev]);
    addToast('success', `Direct POS Order #${newOrder.id} created successfully!`);
    playNewOrderSound();
    setSelectedOrderReceipt(newOrder);
  };

  // Add Toast Notification
  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Session Authentication Check
  useEffect(() => {
    try {
      const savedSession = typeof window !== 'undefined' ? localStorage.getItem('falak_admin_session') : null;
      const hasCookieSession = typeof document !== 'undefined' ? document.cookie.includes('falak_admin_session=true') : false;
      if (savedSession === 'true' || hasCookieSession) {
        setIsAdminLoggedIn(true);
      } else {
        setIsAdminLoggedIn(false);
      }
    } catch {
      setIsAdminLoggedIn(false);
    }
  }, []);

  const handleAdminLogout = async () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('falak_admin_session');
      document.cookie = 'falak_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch { }
    addToast('info', 'Logged out from Falak Closet Admin Panel.');
  };

  // Fetch Store Data from APIs. `noStore` on every call: the admin panel must
  // never be served a cached catalog, or a write followed by a refetch would
  // show the pre-write state and look like the write failed.
  const fetchAllData = async () => {
    setIsRefreshing(true);
    const failures: string[] = [];

    const products = await requestJson<{ products: Product[] }>('/api/products', {
      cache: 'no-store',
    });
    if (products.ok) {
      setProductsList(products.data.products || []);
      setDbSource('MongoDB');
    } else {
      failures.push(`products (${products.error})`);
      setDbSource('offline');
    }

    const orders = await requestJson<{ orders: OrderRecord[] }>('/api/orders', {
      cache: 'no-store',
    });
    if (orders.ok) {
      const fetchedOrders = orders.data.orders || [];
      setOrdersList(fetchedOrders);

      // Check for incoming new orders
      if (knownOrderIdsRef.current.size > 0) {
        const newOrders = fetchedOrders.filter((o) => !knownOrderIdsRef.current.has(o.id));
        if (newOrders.length > 0) {
          playNewOrderSound();
          newOrders.forEach((newOrder) => {
            const customerName = newOrder.shippingAddress?.fullName || 'Valued Customer';
            addToast('success', `🔔 New Order Received! Order #${newOrder.id} from ${customerName} (৳${newOrder.total})`);
          });
        }
      }

      // Update known order IDs set
      knownOrderIdsRef.current = new Set(fetchedOrders.map((o) => o.id));
    } else {
      failures.push(`orders (${orders.error})`);
    }

    const promos = await requestJson<{ promotions: PromoVoucherData[] }>('/api/promotions', {
      cache: 'no-store',
    });
    if (promos.ok) {
      setPromosList(promos.data.promotions || []);
    } else {
      failures.push(`promotions (${promos.error})`);
    }

    if (failures.length > 0) {
      addToast('error', `Could not load ${failures.join(', ')}`);
    }

    refreshProductsFromApi();
    setIsRefreshing(false);
  };

  // Real-Time Socket Listener & Sound Alert Notification
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    // 1. Initial data fetch
    fetchAllData();

    // 2. Connect to Socket.io Server
    const socket = getSocket();
    socket.emit('join_admin');

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    if (socket.connected) {
      setIsSocketConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // 3. Real-Time Socket Event Listener for New Product Purchase
    const handleSocketOrderAlert = (incomingOrder: OrderRecord) => {
      if (!incomingOrder || !incomingOrder.id) return;

      // Avoid double-notifying if already processed
      if (knownOrderIdsRef.current.has(incomingOrder.id)) return;
      knownOrderIdsRef.current.add(incomingOrder.id);

      // Play Sound Chime Alert
      playNewOrderSound();

      // Show Toast Notification
      const customerName = incomingOrder.shippingAddress?.fullName || 'Valued Customer';
      addToast(
        'success',
        `🔔 LIVE ORDER ALERT: Order #${incomingOrder.id} placed by ${customerName} (৳${incomingOrder.total})`
      );

      // Instantly update orders list in state without waiting for refresh
      setOrdersList((prev) => {
        if (prev.some((o) => o.id === incomingOrder.id)) return prev;
        return [incomingOrder, ...prev];
      });
    };

    socket.on('new_order_alert', handleSocketOrderAlert);

    // 4. Background safety sync every 30s
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_order_alert', handleSocketOrderAlert);
      clearInterval(interval);
    };
  }, [isAdminLoggedIn]);

  // Seed Database Handler
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedResult(null);

    const result = await requestJson<{ message: string }>('/api/seed', { method: 'POST' });

    if (result.ok) {
      setSeedResult(result.data.message);
      addToast('success', result.data.message);
      await fetchAllData();
    } else {
      setSeedResult(`Seed failed: ${result.error}`);
      addToast('error', `Seed failed: ${result.error}`);
    }

    setIsSeeding(false);
  };

  // Save / Update Product. Returns whether the write actually landed — the modal
  // stays open (with the form intact) when it did not.
  const handleSaveProduct = async (productData: Partial<Product>): Promise<boolean> => {
    const isEdit = Boolean(editingProduct);

    const result = isEdit
      ? await requestJson(`/api/products/${editingProduct!.id}`, jsonInit('PUT', productData))
      : await requestJson('/api/products', jsonInit('POST', productData));

    if (!result.ok) {
      addToast('error', `Could not ${isEdit ? 'update' : 'publish'} "${productData.name}": ${result.error}`);
      return false;
    }

    // Refetch rather than hand-merging: the server owns the slug, the derived
    // discount, and the variation-summed stock, so its copy is the real one.
    setEditingProduct(null);
    await fetchAllData();
    addToast(
      'success',
      isEdit
        ? `Product "${productData.name}" updated successfully!`
        : `New product "${productData.name}" published to store!`
    );
    return true;
  };

  // Update In-Line Stock
  const handleUpdateStock = async (id: string, newStock: number) => {
    const result = await requestJson(`/api/products/${id}`, jsonInit('PATCH', { stock: newStock }));

    if (!result.ok) {
      addToast('error', `Stock update failed: ${result.error}`);
      return;
    }

    setProductsList((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));
    // The storefront reads from the cart context, not this table — without this
    // the shop keeps showing the old stock until a full reload.
    refreshProductsFromApi();
    addToast('info', `Stock updated to ${newStock} pcs.`);
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product item?')) return;

    const result = await requestJson(`/api/products/${id}`, { method: 'DELETE' });

    if (!result.ok) {
      addToast('error', `Delete failed: ${result.error}`);
      return;
    }

    setProductsList((prev) => prev.filter((p) => p.id !== id));
    refreshProductsFromApi();
    addToast('warning', 'Product deleted from inventory catalog.');
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderRecord['status']) => {
    const result = await requestJson('/api/orders', jsonInit('PATCH', { orderId, status: newStatus }));

    if (!result.ok) {
      addToast('error', `Could not update order #${orderId}: ${result.error}`);
      return;
    }

    setOrdersList((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    addToast('success', `Order #${orderId} status changed to ${newStatus}.`);
  };

  // Save or Update Promotion Voucher (CRUD)
  const handleSavePromotion = async (promoData: Partial<PromoVoucherData>) => {
    const isEdit = Boolean(promoData._id || promoData.id);

    const result = await requestJson<{ promotion: PromoVoucherData }>(
      '/api/promotions',
      jsonInit(isEdit ? 'PATCH' : 'POST', promoData)
    );

    if (!result.ok) {
      addToast('error', `Could not save voucher ${promoData.code}: ${result.error}`);
      return;
    }

    const saved = result.data.promotion;
    setPromosList((prev) =>
      isEdit
        ? prev.map((p) => (promoKey(p) === (promoData._id || promoData.id) ? saved : p))
        : [saved, ...prev]
    );
    addToast('success', `Voucher code ${saved.code} ${isEdit ? 'updated' : 'created'} successfully!`);
  };

  // Toggle Promotion Status (Active <-> Disabled)
  const handleTogglePromoStatus = async (promo: PromoVoucherData) => {
    const nextStatus = promo.status === 'Active' ? 'Disabled' : 'Active';
    const promoId = promoKey(promo);

    const result = await requestJson(
      '/api/promotions',
      jsonInit('PATCH', { id: promoId, code: promo.code, status: nextStatus })
    );

    if (!result.ok) {
      addToast('error', `Could not change ${promo.code}: ${result.error}`);
      return;
    }

    setPromosList((prev) =>
      prev.map((p) => (promoKey(p) === promoId ? { ...p, status: nextStatus } : p))
    );
    addToast('info', `Promo code ${promo.code} is now ${nextStatus}.`);
  };

  // Delete Promotion Voucher
  const handleDeletePromotion = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete promo code "${code}"?`)) return;

    const result = await requestJson(
      `/api/promotions?id=${encodeURIComponent(id)}&code=${encodeURIComponent(code)}`,
      { method: 'DELETE' }
    );

    if (!result.ok) {
      addToast('error', `Could not delete ${code}: ${result.error}`);
      return;
    }

    setPromosList((prev) => prev.filter((p) => promoKey(p) !== id && p.code !== code));
    addToast('warning', `Promo voucher code ${code} deleted.`);
  };

  const pendingOrdersCount = ordersList.filter(
    (o) => o.status === 'Processing' || o.status === 'Quality Checked' || o.status === 'Pending'
  ).length;

  const lowStockCount = productsList.filter((p) => (p.stock ?? 10) < 5).length;

  // Gate Check
  if (!isAdminLoggedIn) {
    return <AdminLoginGate onLoginSuccess={() => setIsAdminLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col lg:flex-row font-sans selection:bg-[#9B050B] selection:text-white">
      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingOrdersCount={pendingOrdersCount}
          productsCount={productsList.length}
          promosCount={promosList.length}
          dbSource={dbSource}
          onLogout={handleAdminLogout}
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
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              pendingOrdersCount={pendingOrdersCount}
              productsCount={productsList.length}
              promosCount={promosList.length}
              dbSource={dbSource}
              onLogout={handleAdminLogout}
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Header Bar */}
        <AdminHeader
          activeTab={activeTab}
          searchQuery={globalSearchQuery}
          setSearchQuery={setGlobalSearchQuery}
          onRefresh={fetchAllData}
          isRefreshing={isRefreshing}
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockCount}
          isSocketConnected={isSocketConnected}
          onTestSound={() => {
            playNewOrderSound();
            addToast('info', '🔊 Testing Order Notification Audio Chime!');
          }}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          onOpenAddProductModal={() => {
            setEditingProduct(null);
            setIsAddProductOpen(true);
          }}
        />

        {/* Dynamic Tab Body */}
        <main className="p-4 sm:p-6 lg:p-10 space-y-8 flex-1">
          {activeTab === 'overview' && (
            <OverviewTab
              orders={ordersList}
              products={productsList}
              onSelectOrderReceipt={(order) => setSelectedOrderReceipt(order)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onNavigateToTab={(tab) => setActiveTab(tab as AdminTabType)}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              orders={ordersList}
              onSelectOrderReceipt={(order) => setSelectedOrderReceipt(order)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onOpenCreateOrderModal={() => setIsCreateOrderOpen(true)}
              searchQuery={globalSearchQuery}
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab
              products={productsList}
              onOpenAddModal={() => {
                setEditingProduct(null);
                setIsAddProductOpen(true);
              }}
              onOpenEditModal={(product) => {
                setEditingProduct(product);
                setIsAddProductOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onUpdateStock={handleUpdateStock}
              searchQuery={globalSearchQuery}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab
              products={productsList}
              onRefreshProducts={async () => fetchAllData()}
            />
          )}

          {activeTab === 'promotions' && (
            <PromotionsTab
              promotions={promosList}
              onOpenAddPromoModal={() => {
                setEditingPromo(null);
                setIsAddPromoOpen(true);
              }}
              onOpenEditPromoModal={(promo) => {
                setEditingPromo(promo);
                setIsAddPromoOpen(true);
              }}
              onToggleStatus={handleTogglePromoStatus}
              onDeletePromo={handleDeletePromotion}
            />
          )}

          {activeTab === 'customers' && <CustomersTab orders={ordersList} />}

          {activeTab === 'security' && <SecurityTab />}

          {activeTab === 'analytics' && (
            <AnalyticsTab orders={ordersList} products={productsList} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              dbSource={dbSource}
              onSeedDatabase={handleSeedDatabase}
              isSeeding={isSeeding}
              seedResult={seedResult}
            />
          )}
        </main>
      </div>

      {/* Printable Order Invoice Modal */}
      <OrderReceiptModal
        order={selectedOrderReceipt}
        onClose={() => setSelectedOrderReceipt(null)}
      />

      {/* Direct Admin POS Order Creation Modal */}
      <AdminCreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onOrderCreated={handleDirectOrderCreated}
        productsList={productsList}
      />

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }}
        onSaveProduct={handleSaveProduct}
        editingProduct={editingProduct}
        existingProducts={productsList}
      />

      {/* Add / Edit Promo Voucher Modal */}
      <PromoFormModal
        isOpen={isAddPromoOpen}
        onClose={() => {
          setIsAddPromoOpen(false);
          setEditingPromo(null);
        }}
        onSavePromotion={handleSavePromotion}
        editingPromo={editingPromo}
      />

      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-600">Verifying Security Credentials...</p>
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
