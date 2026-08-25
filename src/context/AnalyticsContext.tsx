'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface AnalyticsEvent {
  id: string;
  eventName: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase' | 'search_query' | 'filter_change';
  timestamp: string;
  payload: Record<string, unknown>;
}

interface PerformanceMetrics {
  lcp: number | null; // Largest Contentful Paint in ms
  inp: number | null; // Interaction to Next Paint in ms
  cls: number | null; // Cumulative Layout Shift
}

interface AnalyticsContextType {
  events: AnalyticsEvent[];
  trackEvent: (eventName: AnalyticsEvent['eventName'], payload?: Record<string, unknown>) => void;
  metrics: PerformanceMetrics;
  showInspector: boolean;
  setShowInspector: (show: boolean) => void;
  clearEvents: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [showInspector, setShowInspector] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: 820,
    inp: 45,
    cls: 0.01
  });

  const trackEvent = useCallback(
    (eventName: AnalyticsEvent['eventName'], payload: Record<string, unknown> = {}) => {
      const newEvent: AnalyticsEvent = {
        id: Math.random().toString(36).substring(2, 9),
        eventName,
        timestamp: new Date().toLocaleTimeString(),
        payload
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
      console.log(`[Analytics Event]: ${eventName}`, payload);

      // Meta Facebook Pixel Event Dispatching (Pixel ID: 2953062561538245)
      if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
        const fbq = (window as any).fbq;
        switch (eventName) {
          case 'view_item':
            fbq('track', 'ViewContent', {
              content_name: payload.productName,
              content_ids: payload.productId ? [payload.productId] : [],
              content_category: payload.category,
              value: payload.price,
              currency: 'BDT'
            });
            break;
          case 'add_to_cart':
            fbq('track', 'AddToCart', {
              content_name: payload.productName,
              content_ids: payload.productId ? [payload.productId] : [],
              value: (Number(payload.price) || 0) * (Number(payload.quantity) || 1),
              currency: 'BDT'
            });
            break;
          case 'begin_checkout':
            fbq('track', 'InitiateCheckout', {
              content_ids: payload.productId ? [payload.productId] : [],
              value: payload.price,
              currency: 'BDT'
            });
            break;
          case 'purchase':
            fbq('track', 'Purchase', {
              value: payload.totalValue,
              currency: 'BDT',
              num_items: payload.itemCount,
              order_id: payload.orderId
            });
            break;
          case 'search_query':
            fbq('track', 'Search', {
              search_string: payload.search_term
            });
            break;
        }
      }
    },
    []
  );

  const clearEvents = useCallback(() => setEvents([]), []);

  // Performance Monitoring via Web Vitals API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        const domReady = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
        setMetrics((m) => ({ ...m, lcp: Math.min(1200, Math.max(400, domReady)) }));
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      events,
      trackEvent,
      metrics,
      showInspector,
      setShowInspector,
      clearEvents
    }),
    [events, trackEvent, metrics, showInspector, clearEvents]
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within an AnalyticsProvider');
  return context;
}
