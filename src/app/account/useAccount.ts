'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCart, type OrderRecord } from '@/context/CartContext';
import { useSearchParams } from 'next/navigation';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  fullAddress: string;
}

/**
 * /api/orders/mine returns the full serialized order (same shape the admin
 * table consumes), so the account Orders tab can render receipts too.
 */
export type MineOrder = OrderRecord;

export type AuthMode = 'signin' | 'signup' | 'forgot';
export type FeedbackMessage = { type: 'success' | 'error'; message: string };

export const AUTH_CHANGED_EVENT = 'falak:auth-changed';

export interface SignUpData {
  name: string;
  email: string;
  phone: string;
  district: string;
  fullAddress: string;
  password: string;
}

function toProfile(user: Record<string, string | undefined>): UserProfile {
  return {
    id: user.id,
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    district: user.district || 'Dhaka',
    fullAddress: user.fullAddress || '',
  };
}

export function useAccount(initialUser: UserProfile | null) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialUser);
  const params = useSearchParams()
  const type = params.get('type')
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const { mergeServerWishlist, mergeServerCart, clearCart } = useCart();

  const [orders, setOrders] = useState<MineOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await fetch('/api/orders/mine', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOrdersError(data.error || 'Could not load your orders. Please try again.');
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      setOrdersError('Unable to connect. Please check your internet connection.');
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (userProfile) {
      Promise.resolve().then(() => {
        fetchOrders();
      });
    } else {
      Promise.resolve().then(() => {
        setOrders([]);
      });
    }
  }, [userProfile, fetchOrders]);

  const switchMode = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (type === 'register') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      switchMode('signup')
    } else if (type === 'login') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      switchMode('signin')
    } else if (type === 'forgot') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      switchMode('forgot')
    }
  }, [type, switchMode])

  // Sync client state if the server session disappears while the tab is open
  useEffect(() => {
    const onAuthChanged = () => {
      fetch('/api/auth/me', { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.user) {
            setUserProfile(toProfile(data.user));
            if (Array.isArray(data.wishlist) && mergeServerWishlist) {
              mergeServerWishlist(data.wishlist);
            }
            if (Array.isArray(data.cart) && mergeServerCart) {
              mergeServerCart(data.cart);
            }
          } else {
            setUserProfile(null);
          }
        })
        .catch(() => { /* offline — keep current state */ });
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [mergeServerWishlist, mergeServerCart]);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  }, []);

  const applySession = useCallback((data: { user: Record<string, string | undefined>; wishlist?: string[]; cart?: { productId: string; selectedColor: string; selectedSize: string; quantity: number }[] }) => {
    setUserProfile(toProfile(data.user));
    if (Array.isArray(data.wishlist) && mergeServerWishlist) {
      mergeServerWishlist(data.wishlist);
    }
    if (Array.isArray(data.cart) && mergeServerCart) {
      mergeServerCart(data.cart);
    }
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }, [mergeServerWishlist, mergeServerCart]);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setFeedback(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showFeedback('error', data.error || 'Sign-in failed. Please check your credentials.');
        return false;
      }

      applySession(data);
      showFeedback('success', `Welcome back, ${data.user.name}! 🎉`);
      return true;
    } catch {
      showFeedback('error', 'Unable to connect. Please check your internet connection.');
      return false;
    }
  }, [applySession, showFeedback]);

  const signUp = useCallback(async (payload: SignUpData): Promise<boolean> => {
    setFeedback(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showFeedback('error', data.error || 'Sign-up failed. Please try again.');
        return false;
      }

      applySession(data);
      showFeedback('success', 'Account created! Welcome to Falak Closet ✨');
      return true;
    } catch {
      showFeedback('error', 'Unable to connect. Please check your internet connection.');
      return false;
    }
  }, [applySession, showFeedback]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* clear local state regardless */ }
    setUserProfile(null);
    setAuthMode('signin');
    setFeedback(null);
    clearCart();
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }, [clearCart]);

  const updateUser = useCallback((updated: UserProfile) => {
    setUserProfile(updated);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.user) applySession(data);
    } catch { /* keep current state */ }
  }, [applySession]);

  return {
    userProfile,
    authMode,
    switchMode,
    feedback,
    showFeedback,
    signIn,
    signUp,
    logout,
    updateUser,
    refreshMe,
    orders,
    isLoadingOrders,
    ordersError,
    fetchOrders,
  };
}

export type Account = ReturnType<typeof useAccount>;
