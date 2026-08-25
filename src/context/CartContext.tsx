'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, PRODUCTS } from '@/data/products';
import { sendNewOrderNotification } from '@/lib/socketClient';

export interface Promotion {
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
  discountPercentage?: number; // legacy compatibility fallback
}

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
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
  paymentStatus?: string;
  bkashSenderNumber?: string;
  bkashTrxId?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, color: string, size: string, quantity?: number) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  updateQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  appliedPromo: Promotion | null;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;

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
  refreshProductsFromApi: () => Promise<void>;
  getProductBySlug: (slug: string) => Product | undefined;

  // Order Creation & Tracking History
  orders: OrderRecord[];
  placeOrder: (orderData: Omit<OrderRecord, 'id' | 'date' | 'status' | 'trackingNumber' | 'estimatedDelivery'>) => Promise<OrderRecord>;
  getOrderById: (orderId: string) => OrderRecord | undefined;
  getOrdersByPhone: (phone: string) => OrderRecord[];
  refreshOrdersFromApi: () => Promise<void>;
  deliveryCity: string;
  setDeliveryCity: (city: string) => void;
  systemSettings: any;
}

const FREE_SHIPPING_MIN = 100;

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  const [deliveryCity, setDeliveryCity] = useState<string>('Dhaka');
  const [systemSettings, setSystemSettings] = useState<any>({
    deliveryFeeInsideDhaka: 60,
    deliveryFeeOutsideDhaka: 120,
    freeShippingMinSpend: 3000,
    adminBkashNumber: '01700000000'
  });

  useEffect(() => {
    import('@/actions/settingsActions').then(({ getSystemSettings }) => {
      getSystemSettings().then((res) => {
        if (res.success && res.settings) {
          setSystemSettings(res.settings);
        }
      });
    });
  }, []);

  // Dynamic Database Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Load products from Database API
  const refreshProductsFromApi = async () => {
    setIsLoadingProducts(true);
    try {
      const { getProducts } = await import('@/actions/productActions');
      const data = await getProducts();
      if (data.products) {
        setProducts(data.products as any);
      }
    } catch {
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProductsFromApi();
  }, []);

  const getProductBySlug = (slug: string) => {
    const clean = slug.toLowerCase();
    return products.find((p) => p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean);
  };

  // Load orders from API & localStorage
  const refreshOrdersFromApi = async () => {
    try {
      const { getOrders } = await import('@/actions/orderActions');
      const data = await getOrders();
      if (data.orders) {
        setOrders(data.orders as any);
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
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('falak_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch { }

    refreshOrdersFromApi();
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
    setAppliedPromo(null);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.product?.price * item.quantity,
    0
  );

  const applyPromoCode = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    try {
      const { validatePromotion } = await import('@/actions/orderActions');
      const res = (await validatePromotion({ code: cleanCode, cartSubtotal: subtotal })) as any;
      if (res.success && res.promotion) {
        setAppliedPromo(res.promotion);
        return { success: true, message: res.message || `Coupon ${cleanCode} applied successfully!` };
      } else {
        return { success: false, message: res.error || 'Invalid promo code.' };
      }
    } catch (err: any) {
      console.error('applyPromoCode error:', err);
      return { success: false, message: 'Failed to validate coupon code.' };
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage' || (appliedPromo as any).discountPercentage > 0) {
      const pct = appliedPromo.discountValue || (appliedPromo as any).discountPercentage || 0;
      discountAmount = (subtotal * pct) / 100;
      if (appliedPromo.maxDiscount && discountAmount > appliedPromo.maxDiscount) {
        discountAmount = appliedPromo.maxDiscount;
      }
    } else if (appliedPromo.discountType === 'fixed') {
      discountAmount = appliedPromo.discountValue || 0;
    }
  }

  const minSpend = systemSettings?.freeShippingMinSpend ?? 3000;
  const freeShippingProgress = Math.min(100, (subtotal / minSpend) * 100);

  const isDhaka = deliveryCity.trim().toLowerCase().includes('dhaka');
  const baseShippingFee = isDhaka 
    ? (systemSettings?.deliveryFeeInsideDhaka ?? 60) 
    : (systemSettings?.deliveryFeeOutsideDhaka ?? 120);

  const shippingFee = subtotal >= minSpend || subtotal === 0 ? 0 : baseShippingFee;
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

    // Post using Server Action
    try {
      const { createOrder } = await import('@/actions/orderActions');
      await createOrder(newOrder);
    } catch (e) {
      console.warn('API post fallback to local state:', e);
    }

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    // Real-Time Socket Notification to Admin
    sendNewOrderNotification(newOrder);

    return newOrder;
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
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        discountAmount,
        shippingFee,
        totalAmount,
        freeShippingThreshold: systemSettings?.freeShippingMinSpend ?? 3000,
        freeShippingProgress,
        deliveryCity,
        setDeliveryCity,
        systemSettings,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        products,
        isLoadingProducts,
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
