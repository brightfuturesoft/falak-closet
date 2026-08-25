'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const bgStyles = {
          success: 'bg-[#060B1E]/95 border-emerald-500/50 text-emerald-400',
          warning: 'bg-[#060B1E]/95 border-amber-500/50 text-amber-400',
          error: 'bg-[#060B1E]/95 border-red-500/50 text-red-400',
          info: 'bg-[#060B1E]/95 border-[#F2C76E]/50 text-[#F2C76E]'
        }[toast.type];

        const Icon = {
          success: CheckCircle2,
          warning: AlertTriangle,
          error: XCircle,
          info: Info
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl border backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-start gap-3 pointer-events-auto transition-all animate-in slide-in-from-bottom-5 fade-in ${bgStyles}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-semibold text-white">
              {toast.message}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
