'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/data/products';
import { AppliedCoupon } from '@/data/promotions';
import { sendNewOrderNotification } from '@/lib/socketClient';

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

export interface DeliverySubArea {
  id: string;
  name: string;
  charge: number | null;
}

export interface DeliveryZone {
  id: string;
  name: string;
  charge: number;
  etaDays: string;
  isActive: boolean;
  sortOrder: number;
  subAreas: DeliverySubArea[];
}

export interface OrderRecord {
  id: string;
  date: string;
  createdAt?: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Quality Checked' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  userEmail?: string;
  userIp?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    district?: string;
    fullAddress?: string;
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  deliveryMethod?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  paymentSenderNumber?: string;
  paymentTrxId?: string;
  paymentStatus?: string;
  deliveryZone?: string;
  deliverySubArea?: string;
  promoCode?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, color: string, size: string, quantity?: number) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  updateQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
  promoNotice: string | null;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;

  // Delivery Zones
  deliveryZones: DeliveryZone[];
  selectedZoneId: string | null;
  selectedSubAreaId: string | null;
  setSelectedZone: (zoneId: string, subAreaId?: string | null) => void;
  selectedZoneName: string;
  selectedSubAreaName: string | null;
  quantityFreeDelivery: { unlocked: boolean; productName: string; requiredQty: number; currentQty: number } | null;

  // Wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;

  // Drawer states
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;

  // Dynamic Database Products State
  products: Product[];
  isLoadingProducts: boolean;
  /** Non-null when the catalog read failed — lets consumers distinguish "no products" from "could not load". */
  productsError: string | null;
  refreshProductsFromApi: () => Promise<void>;
  getProductBySlug: (slug: string) => Product | undefined;

  // Order Creation & Tracking History
  orders: OrderRecord[];
  placeOrder: (orderData: Omit<OrderRecord, 'id' | 'date' | 'status' | 'trackingNumber' | 'estimatedDelivery'>) => Promise<OrderRecord>;
  getOrderById: (orderId: string) => OrderRecord | undefined;
  getOrdersByPhone: (phone: string) => OrderRecord[];
  refreshOrdersFromApi: () => Promise<void>;
}

const FREE_SHIPPING_MIN = 100;

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  initialProducts = [],
  initialProductsError = null,
}: {
  children: React.ReactNode;
  /** Server-rendered catalog from the root layout. Keeps the first paint free of a fetch waterfall. */
  initialProducts?: Product[];
  initialProductsError?: string | null;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [promoNotice, setPromoNotice] = useState<string | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  // Delivery Zones State
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<string | null>(null);

  const fetchDeliveryZones = async () => {
    try {
      const res = await fetch('/api/delivery-zones');
      const data = await res.json();
      if (data.success && Array.isArray(data.deliveryZones)) {
        setDeliveryZones(data.deliveryZones);
        // Default select first active zone
        const active = data.deliveryZones.filter((z: DeliveryZone) => z.isActive);
        if (active.length > 0) {
          setSelectedZoneId(active[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch delivery zones:', e);
    }
  };

  const setSelectedZone = (zoneId: string, subAreaId: string | null = null) => {
    setSelectedZoneId(zoneId);
    setSelectedSubAreaId(subAreaId);
  };

  // Dynamic Database Products State
  const [products, setProducts] = useState<Product[]>(initialProducts);
  // Already have the server's copy, so nothing is "loading" on first paint.
  const [isLoadingProducts, setIsLoadingProducts] = useState(initialProducts.length === 0 && !initialProductsError);
  const [productsError, setProductsError] = useState<string | null>(initialProductsError);

  // Load products from Database API
  const refreshProductsFromApi = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !Array.isArray(data.products)) {
        // Keep whatever is already on screen. Blanking the catalog on a failed
        // refresh used to turn a transient network blip into an empty store.
        setProductsError(data?.error || `Could not load the catalog (HTTP ${res.status}).`);
        return;
      }

      setProducts(data.products);
      setProductsError(null);
    } catch (err) {
      setProductsError((err as Error).message || 'Network error while loading the catalog.');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // The server already handed us the catalog; re-fetching on mount would just
  // duplicate that query. Only fetch when it arrived empty.
  useEffect(() => {
    if (initialProducts.length === 0 && !initialProductsError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshProductsFromApi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getProductBySlug = (slug: string) => {
    const clean = slug.toLowerCase();
    return products.find((p) => p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean);
  };

  // Load orders from API & localStorage
  const refreshOrdersFromApi = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        localStorage.setItem('falak_orders', JSON.stringify(data.orders));
        return;
      }
    } catch { }

    try {
      const savedOrders = localStorage.getItem('falak_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('falak_cart');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('falak_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedCoupon = localStorage.getItem('falak_coupon');
      if (savedCoupon) setAppliedCoupon(JSON.parse(savedCoupon));
    } catch { }

    refreshOrdersFromApi();
    fetchDeliveryZones();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('falak_cart', JSON.stringify(cart));
    } catch { }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('falak_wishlist', JSON.stringify(wishlist));
    } catch { }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('falak_orders', JSON.stringify(orders));
    } catch { }
  }, [orders]);

  // Relocated coupon effects to be after subtotal/discountAmount declarations below

  const addToCart = (product: Product, color: string, size: string, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product?.id === product?.id &&
          item.selectedColor === color &&
          item.selectedSize === size
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, selectedColor: color, selectedSize: size, quantity }];
    });
    setIsCartDrawerOpen(true);
  };

  const removeFromCart = (productId: string, color: string, size: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product?.id === productId &&
            item.selectedColor === color &&
            item.selectedSize === size
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    color: string,
    size: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (
          item.product?.id === productId &&
          item.selectedColor === color &&
          item.selectedSize === size
        ) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setPromoNotice(null);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.product?.price * item.quantity,
    0
  );

  const applyPromoCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Promo code is required.' };

    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, cartSubtotal: subtotal }),
      });
      const data = await res.json();

      if (data.success) {
        setAppliedCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          calculatedDiscount: data.calculatedDiscount,
        });
        setPromoNotice(null);
        return { success: true, message: data.message || `Coupon ${data.code} applied successfully!` };
      } else {
        return { success: false, message: data.error || 'Invalid promo code.' };
      }
    } catch (err) {
      console.error('Failed to validate promo code:', err);
      return { success: false, message: 'Could not verify code — please try again.' };
    }
  };

  const removePromoCode = () => {
    setAppliedCoupon(null);
    setPromoNotice(null);
  };

  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.calculatedDiscount, subtotal) : 0;

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('falak_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('falak_coupon');
      }
    } catch { }
  }, [appliedCoupon]);

  // Stale promo guard: re-validate the coupon silently when subtotal changes
  useEffect(() => {
    if (!appliedCoupon) return;

    if (cart.length === 0 || subtotal === 0) {
      const oldCode = appliedCoupon.code;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAppliedCoupon(null);
      setPromoNotice(`Code ${oldCode} removed — cart is empty`);
      return;
    }

    let isMounted = true;
    const revalidate = async () => {
      try {
        const res = await fetch('/api/promotions/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: appliedCoupon.code, cartSubtotal: subtotal }),
        });
        const data = await res.json();
        if (!isMounted) return;

        if (data.success) {
          if (data.calculatedDiscount !== appliedCoupon.calculatedDiscount) {
            setAppliedCoupon({
              code: data.code,
              discountType: data.discountType,
              discountValue: data.discountValue,
              calculatedDiscount: data.calculatedDiscount,
            });
          }
        } else {
          const oldCode = appliedCoupon.code;
          setAppliedCoupon(null);
          setPromoNotice(`Code ${oldCode} removed — ${data.error || 'cart no longer meets the requirements'}`);
        }
      } catch (err) {
        console.error('Silent promo revalidation failed:', err);
      }
    };

    revalidate();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, appliedCoupon?.code]);

  // Sum quantities by product ID
  const quantitiesByProductId: Record<string, number> = {};
  cart.forEach((item) => {
    const pid = item.product?.id;
    if (pid) {
      quantitiesByProductId[pid] = (quantitiesByProductId[pid] || 0) + (item.quantity ?? 0);
    }
  });

  let quantityFreeDelivery: { unlocked: boolean; productName: string; requiredQty: number; currentQty: number } | null = null;

  for (const item of cart) {
    const prod = item.product;
    const reqQty = prod?.freeDeliveryQuantity;
    if (prod && typeof reqQty === 'number' && reqQty > 0) {
      const currentQty = quantitiesByProductId[prod.id] || 0;
      if (currentQty >= reqQty) {
        quantityFreeDelivery = {
          unlocked: true,
          productName: prod.name,
          requiredQty: reqQty,
          currentQty
        };
        break;
      } else {
        if (!quantityFreeDelivery || (currentQty / reqQty > quantityFreeDelivery.currentQty / quantityFreeDelivery.requiredQty)) {
          quantityFreeDelivery = {
            unlocked: false,
            productName: prod.name,
            requiredQty: reqQty,
            currentQty
          };
        }
      }
    }
  }

  const activeZone = deliveryZones.find((z) => z.id === selectedZoneId);
  const activeSubArea = activeZone?.subAreas?.find((s: DeliverySubArea) => s.id === selectedSubAreaId);

  const selectedZoneName = activeZone?.name || 'Inside Dhaka';
  const selectedSubAreaName = activeSubArea?.name || null;

  const baseFee = activeSubArea?.charge ?? activeZone?.charge ?? 60; // fallback charge

  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);
  const isFreeDelivery = subtotal >= FREE_SHIPPING_MIN || (quantityFreeDelivery?.unlocked === true);
  const shippingFee = subtotal === 0 || isFreeDelivery ? 0 : baseFee;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product?.id);
      if (exists) {
        return prev.filter((p) => p.id !== product?.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  // Place order with API post to /api/orders
  const placeOrder = async (
    orderData: Omit<OrderRecord, 'id' | 'date' | 'status' | 'trackingNumber' | 'estimatedDelivery'>
  ): Promise<OrderRecord> => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `FLK-${randomNum}`;
    const trackingNum = `TRK-FLK-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: OrderRecord = {
      ...orderData,
      id: orderId,
      date: new Date().toISOString(),
      status: 'Processing',
      trackingNumber: trackingNum,
      estimatedDelivery: '3-5 Business Days'
    };

    let finalOrder = newOrder;

    // Post to API (MongoDB)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      const data = await res.json();
      if (data.success && data.order) {
        finalOrder = {
          ...data.order,
          items: newOrder.items // keep the client-side items structure
        };
        if (data.warning) {
          alert(data.warning);
        }
      }
    } catch (e) {
      console.warn('API post fallback to local state:', e);
    }

    setOrders((prev) => [finalOrder, ...prev]);
    clearCart();

    // Real-Time Socket Notification to Admin
    sendNewOrderNotification(finalOrder);

    return finalOrder;
  };

  const getOrderById = (orderId: string) => {
    const clean = orderId.trim().toUpperCase();
    return orders.find((o) => o.id.toUpperCase() === clean || (o.trackingNumber || '').toUpperCase() === clean);
  };

  const getOrdersByPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    return orders.filter((o) => o.shippingAddress.phone.replace(/\D/g, '').includes(clean));
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
        appliedCoupon,
        applyPromoCode,
        removePromoCode,
        promoNotice,
        discountAmount,
        shippingFee,
        totalAmount,
        freeShippingThreshold: FREE_SHIPPING_MIN,
        freeShippingProgress,
        deliveryZones,
        selectedZoneId,
        selectedSubAreaId,
        setSelectedZone,
        selectedZoneName,
        selectedSubAreaName,
        quantityFreeDelivery,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        products,
        isLoadingProducts,
        productsError,
        refreshProductsFromApi,
        getProductBySlug,
        orders,
        placeOrder,
        getOrderById,
        getOrdersByPhone,
        refreshOrdersFromApi
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
