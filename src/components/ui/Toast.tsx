'use client';

import React, { createContext, useContext, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, Heart, X, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  type: 'cart' | 'wishlist' | 'info';
  title: string;
  subtitle: string;
  image?: string;
  price?: number;
  actionLink?: string;
  actionText?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (toastData: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toastData, id };

    setToasts((prev) => [newToast, ...prev.slice(0, 2)]); // Keep max 3 toasts

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-3.5 bg-stone-900/95 text-stone-100 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-right-8 duration-300 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              {toast.image ? (
                <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0 border border-stone-700">
                  <Image src={toast.image} alt={toast.title} fill sizes="48px" className="object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
                  {toast.type === 'cart' ? <ShoppingBag className="w-5 h-5" /> : <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{toast.title}</span>
                </div>
                <p className="text-xs font-bold text-stone-100 truncate">{toast.subtitle}</p>
                {toast.price !== undefined && (
                  <p className="text-[11px] font-mono text-stone-400 font-bold">
                    {formatCurrency(toast.price)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {toast.actionLink && (
                <Link
                  href={toast.actionLink}
                  onClick={() => removeToast(toast.id)}
                  className="px-3 py-1.5 bg-amber-400 text-stone-950 text-[11px] font-bold rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <span>{toast.actionText || 'View'}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
