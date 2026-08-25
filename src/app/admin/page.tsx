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
import { HeroTab } from '@/components/admin/HeroTab';
import { ReviewsTab } from '@/components/admin/ReviewsTab';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { OrderReceiptModal } from '@/components/admin/OrderReceiptModal';
import { PromoFormModal } from '@/components/admin/PromoFormModal';
import { AdminCreateOrderModal } from '@/components/admin/AdminCreateOrderModal';
import { ToastNotification, ToastMessage } from '@/components/admin/ToastNotification';

import { PRODUCTS, Product } from '@/data/products';
import { playNewOrderSound } from '@/lib/soundNotification';

interface Promotion {
  id?: string;
  _id?: string;
  code: string;
  discountType: string;
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  expiryDate: string;
  status: string;
}
import { useCart, OrderRecord } from '@/context/CartContext';
import { getSocket } from '@/lib/socketClient';

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
    } else if (pathname.includes('/admin/hero')) {
      setActiveTab('hero');
    } else if (pathname.includes('/admin/reviews')) {
      setActiveTab('reviews');
    } else {
      const tabParam = searchParams.get('tab');
      if (tabParam && ['overview', 'orders', 'products', 'categories', 'promotions', 'customers', 'security', 'analytics', 'settings', 'hero', 'reviews'].includes(tabParam)) {
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
  const [promosList, setPromosList] = useState<Promotion[]>([]);
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
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
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

  // Fetch Store Data from APIs
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      const pRes = await fetch('/api/products');
      const pData = await pRes.json();
      setProductsList(pData.products || []);
      if (pData.source) setDbSource(pData.source);
    } catch {
      setDbSource('offline');
      setProductsList([]);
    }

    try {
      const oRes = await fetch('/api/orders');
      const oData = await oRes.json();
      const fetchedOrders: OrderRecord[] = oData.orders || [];
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
      const nextSet = new Set<string>();
      fetchedOrders.forEach((o) => nextSet.add(o.id));
      knownOrderIdsRef.current = nextSet;
    } catch {
      setOrdersList([]);
    }

    try {
      import('@/actions/orderActions').then(({ getPromotions }) => {
        getPromotions()
          .then((promos) => {
            if (promos.success) {
              setPromosList(promos.promotions as any)
            }
          }).catch(err => {
            console.log(err)
            setPromosList([])
          })
      })
    } catch {
      setPromosList([]);
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
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedResult('Database seeded successfully with modest fashion dataset!');
        addToast('success', 'MongoDB re-seeded with luxury modest fashion dataset!');
        fetchAllData();
      } else {
        setSeedResult(`Seed error: ${data.error}`);
        addToast('error', `Seed error: ${data.error}`);
      }
    } catch {
      setSeedResult('Could not connect to MongoDB service at mongodb://localhost:27017.');
      addToast('error', 'MongoDB service unavailable.');
    } finally {
      setIsSeeding(false);
    }
  };

  // Save / Update Product
  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (editingProduct) {
      // Update
      try {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      } catch { }

      setProductsList((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? ({ ...p, ...productData } as Product) : p))
      );
      setEditingProduct(null);
      addToast('success', `Product "${productData.name}" updated successfully!`);
    } else {
      // Create
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        const data = await res.json();
        if (data.success && data.product) {
          setProductsList((prev) => [data.product, ...prev]);
        } else {
          setProductsList((prev) => [
            {
              ...productData,
              id: `flk-${Date.now()}`,
              slug: (productData.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              rating: 5.0,
              reviewCount: 1
            } as Product,
            ...prev
          ]);
        }
      } catch {
        setProductsList((prev) => [
          {
            ...productData,
            id: `flk-${Date.now()}`,
            slug: (productData.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            rating: 5.0,
            reviewCount: 1
          } as Product,
          ...prev
        ]);
      }
      addToast('success', `New product "${productData.name}" published to store!`);
    }
  };

  // Toggle Product Featured Flag inline (4.1)
  const handleToggleProductFlag = async (
    id: string,
    flag: 'isNewArrival' | 'isBestSeller' | 'isFlashSale',
    value: boolean
  ) => {
    // Optimistic update
    setProductsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [flag]: value } : p))
    );
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [flag]: value })
      });
    } catch {
      // Revert on failure
      setProductsList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [flag]: !value } : p))
      );
      addToast('error', `Failed to update flag for product ${id}`);
    }
    addToast('info', `Product flag updated.`);
  };

  // Update In-Line Stock
  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
    } catch { }

    setProductsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
    );
    addToast('info', `Stock updated to ${newStock} pcs.`);
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product item?')) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
      } catch { }
      setProductsList((prev) => prev.filter((p) => p.id !== id));
      addToast('warning', 'Product deleted from inventory catalog.');
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderRecord['status']) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
    } catch { }

    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    addToast('success', `Order #${orderId} status changed to ${newStatus}.`);
  };

  // Save or Update Promotion Voucher (CRUD)
  const handleSavePromotion = async (promoData: any) => {
    const isEdit = !!promoData._id || !!promoData.id;
    try {
      const { createPromotion, updatePromotion } = await import('@/actions/orderActions');
      const res = isEdit
        ? await updatePromotion({ id: promoData._id || promoData.id, ...promoData })
        : await createPromotion(promoData);

      if (res.success && res.promotion) {
        const savedPromo = res.promotion as any;
        if (isEdit) {
          setPromosList((prev) =>
            prev.map((p: any) => ((p._id || p.id) === (promoData._id || promoData.id) ? savedPromo : p))
          );
        } else {
          setPromosList((prev) => [savedPromo, ...prev]);
        }
      }
    } catch (err) {
      console.error('handleSavePromotion error:', err);
    }

    addToast('success', `Voucher code ${promoData.code} ${isEdit ? 'updated' : 'created'} successfully!`);
  };

  // Toggle Promotion Status (Active <-> Disabled)
  const handleTogglePromoStatus = async (promo: any) => {
    const nextStatus = promo.status === 'Active' ? 'Disabled' : 'Active';
    const promoId = promo._id || promo.id;

    try {
      const { updatePromotion } = await import('@/actions/orderActions');
      await updatePromotion({ id: promoId, code: promo.code, status: nextStatus });
    } catch (err) {
      console.error('handleTogglePromoStatus error:', err);
    }

    setPromosList((prev) =>
      prev.map((p: any) => ((p._id || p.id) === promoId ? { ...p, status: nextStatus } : p))
    );
    addToast('info', `Promo code ${promo.code} is now ${nextStatus}.`);
  };

  // Delete Promotion Voucher
  const handleDeletePromotion = async (id: string, code: string) => {
    if (confirm(`Are you sure you want to delete promo code "${code}"?`)) {
      try {
        const { deletePromotion } = await import('@/actions/orderActions');
        await deletePromotion({ id, code });
      } catch (err) {
        console.error('handleDeletePromotion error:', err);
      }

      setPromosList((prev) => prev.filter((p: any) => (p._id || p.id || p.code) !== id && p.code !== code));
      addToast('warning', `Promo voucher code ${code} deleted.`);
    }
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
              onToggleProductFlag={handleToggleProductFlag}
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
              promotions={promosList as any}
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

          {activeTab === 'hero' && (
            <HeroTab addToast={addToast} />
          )}

          {activeTab === 'reviews' && (
            <ReviewsTab addToast={addToast} />
          )}
        </main>
      </div>

      {/* Printable Order Invoice Modal */}
      <OrderReceiptModal
        order={selectedOrderReceipt}
        onClose={() => setSelectedOrderReceipt(null)}
        onRefreshOrders={fetchAllData}
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
