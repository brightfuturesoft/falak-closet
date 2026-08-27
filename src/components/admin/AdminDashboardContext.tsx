'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '@/data/products';
import { playNewOrderSound } from '@/lib/soundNotification';
import { useCart, OrderRecord } from '@/context/CartContext';
import { getSocket } from '@/lib/socketClient';
import { cloudinaryPublicIdFromUrl, deleteCloudinaryImage } from '@/lib/cloudinary';
import { PromoVoucherData } from '@/components/admin/PromoFormModal';
import { ToastMessage } from '@/components/admin/ToastNotification';

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

export interface AdminDashboardContextValue {
  // Authentication
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (loggedIn: boolean) => void;
  handleAdminLogout: () => Promise<void>;

  // Live data
  dbSource: string;
  productsList: Product[];
  promosList: PromoVoucherData[];
  ordersList: OrderRecord[];
  fetchAllData: () => Promise<void>;
  isRefreshing: boolean;
  isSocketConnected: boolean;

  // Global search (header input, consumed by orders/products tabs)
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;

  // Derived badges
  pendingOrdersCount: number;
  lowStockCount: number;

  // Seeding
  handleSeedDatabase: () => Promise<void>;
  isSeeding: boolean;
  seedResult: string | null;

  // Product handlers
  handleSaveProduct: (productData: Partial<Product>) => Promise<boolean>;
  handleUpdateStock: (id: string, newStock: number) => Promise<void>;
  handleDeleteProduct: (id: string) => Promise<void>;

  // Order handlers
  handleUpdateOrderStatus: (orderId: string, newStatus: OrderRecord['status']) => Promise<void>;
  handleUpdatePaymentStatus: (orderId: string, paymentStatus: string) => Promise<void>;
  handleDirectOrderCreated: (newOrder: OrderRecord) => void;

  // Promotion handlers
  handleSavePromotion: (promoData: Partial<PromoVoucherData>) => Promise<void>;
  handleTogglePromoStatus: (promo: PromoVoucherData) => Promise<void>;
  handleDeletePromotion: (id: string, code: string) => Promise<void>;

  // Modal state (owned by the layout so any route can trigger them)
  selectedOrderReceipt: OrderRecord | null;
  setSelectedOrderReceipt: (order: OrderRecord | null) => void;
  isAddProductOpen: boolean;
  setIsAddProductOpen: (open: boolean) => void;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  isAddPromoOpen: boolean;
  setIsAddPromoOpen: (open: boolean) => void;
  editingPromo: PromoVoucherData | null;
  setEditingPromo: (promo: PromoVoucherData | null) => void;
  isCreateOrderOpen: boolean;
  setIsCreateOrderOpen: (open: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
}

const AdminDashboardContext = React.createContext<AdminDashboardContextValue | null>(null);

export function useAdminDashboard(): AdminDashboardContextValue {
  const ctx = React.useContext(AdminDashboardContext);
  if (!ctx) {
    throw new Error('useAdminDashboard must be used inside <AdminDashboardProvider> (src/app/admin/layout.tsx)');
  }
  return ctx;
}

export function AdminDashboardProvider({ children }: { children: React.ReactNode }) {
  const { refreshProductsFromApi } = useCart();

  // Track known order IDs for sound & toast notifications
  const knownOrderIdsRef = React.useRef<Set<string>>(new Set());

  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const fetchAllData = useCallback(async () => {
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
  }, [refreshProductsFromApi]);

  // Real-Time Socket Listener & Sound Alert Notification
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    // 1. Initial data fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Snapshot before the row disappears — needed for the Cloudinary cleanup.
    const product = productsList.find((p) => p.id === id);
    const result = await requestJson(`/api/products/${id}`, { method: 'DELETE' });

    if (!result.ok) {
      addToast('error', `Delete failed: ${result.error}`);
      return;
    }

    // Best-effort destroy of every Cloudinary asset this product owned —
    // only URLs under our falak-closet/ namespace ever match.
    const ownedUrls = new Set<string>([
      ...(product?.images || []),
      ...(product?.colors || []).flatMap((c) => c.images || []),
    ]);
    for (const url of ownedUrls) {
      const publicId = cloudinaryPublicIdFromUrl(url);
      if (publicId?.startsWith('falak-closet/')) {
        deleteCloudinaryImage(publicId);
      }
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

  // Update Order Payment Verification Status
  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    const result = await requestJson('/api/orders', jsonInit('PATCH', { orderId, paymentStatus }));

    if (!result.ok) {
      addToast('error', `Could not update payment status for order #${orderId}: ${result.error}`);
      return;
    }

    setOrdersList((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o)));
    addToast('success', `Order #${orderId} payment status marked as ${paymentStatus}.`);
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

  const value: AdminDashboardContextValue = {
    isAdminLoggedIn,
    setIsAdminLoggedIn,
    handleAdminLogout,

    dbSource,
    productsList,
    promosList,
    ordersList,
    fetchAllData,
    isRefreshing,
    isSocketConnected,

    globalSearchQuery,
    setGlobalSearchQuery,

    pendingOrdersCount,
    lowStockCount,

    handleSeedDatabase,
    isSeeding,
    seedResult,

    handleSaveProduct,
    handleUpdateStock,
    handleDeleteProduct,

    handleUpdateOrderStatus,
    handleUpdatePaymentStatus,
    handleDirectOrderCreated,

    handleSavePromotion,
    handleTogglePromoStatus,
    handleDeletePromotion,

    selectedOrderReceipt,
    setSelectedOrderReceipt,
    isAddProductOpen,
    setIsAddProductOpen,
    editingProduct,
    setEditingProduct,
    isAddPromoOpen,
    setIsAddPromoOpen,
    editingPromo,
    setEditingPromo,
    isCreateOrderOpen,
    setIsCreateOrderOpen,

    toasts,
    addToast,
    removeToast,
  };

  return <AdminDashboardContext.Provider value={value}>{children}</AdminDashboardContext.Provider>;
}
