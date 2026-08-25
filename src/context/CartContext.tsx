'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, PRODUCTS } from '@/data/products';
import { PROMOTIONS, Promotion } from '@/data/promotions';
import { sendNewOrderNotification } from '@/lib/socketClient';

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
  applyPromoCode: (code: string) => { success: boolean; message: string };
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
}

const FREE_SHIPPING_MIN = 100;

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  // Dynamic Database Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Load products from Database API
  const refreshProductsFromApi = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
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

  const applyPromoCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = PROMOTIONS.find((p) => p.code === cleanCode);
    if (!found) {
      return { success: false, message: 'Invalid promo code. Please try FLASH25 or HIJAB15.' };
    }
    if (found.minSpend && subtotal < found.minSpend) {
      return {
        success: false,
        message: `Minimum spend of $${found.minSpend} required for code ${found.code}.`
      };
    }
    setAppliedPromo(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  let discountAmount = 0;
  if (appliedPromo && appliedPromo.discountPercentage > 0) {
    discountAmount = (subtotal * appliedPromo.discountPercentage) / 100;
  }

  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);
  const shippingFee = subtotal >= FREE_SHIPPING_MIN || subtotal === 0 ? 0 : 15.0;
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

    // Post to API (MongoDB)
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
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
        freeShippingThreshold: FREE_SHIPPING_MIN,
        freeShippingProgress,
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
