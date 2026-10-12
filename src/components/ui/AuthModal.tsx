'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, X } from 'lucide-react';
import { Product } from '@/data/products';
import { useToast } from '@/components/ui/Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product?: Product;
  title?: string;
  subtitle?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  title = 'Add to Wishlist',
  subtitle = 'Please sign in to save your favorite abayas, hijabs, and couture collections to your wishlist.',
}: AuthModalProps) {
  const { showToast } = useToast();
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setAuthError('');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    setIsSubmittingAuth(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim(), password: authPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || 'Sign-in failed. Please check credentials.');
        return;
      }

      handleClose();
      setAuthEmail('');
      setAuthPassword('');

      // Auto-add product to wishlist in database if provided
      if (product) {
        try {
          await fetch('/api/user/me/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id }),
          });
        } catch {}

        showToast({
          type: 'wishlist',
          title: 'Saved to Wishlist',
          subtitle: `${product.name} saved to your account database.`,
          image: product.images?.[0],
          price: product.price,
          actionLink: '/account',
          actionText: 'View Wishlist',
        });
      }

      // Notify other parts of the app to reload session
      window.dispatchEvent(new CustomEvent('falak:auth-changed', { detail: data }));

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setAuthError('Connection issue. Please try again.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#0D153A]/25 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-2xl max-w-sm w-full max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-200 text-center overflow-hidden">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="w-12 h-12 rounded-full bg-[#FDF2F3] text-[#A80C14] flex items-center justify-center mx-auto mb-4 border border-[#F8D2D5]">
            <Heart className="w-6 h-6 fill-current" />
          </div>

          <h3 className="font-serif font-extrabold text-stone-900 text-lg mb-1">
            {title}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed mb-5">
            {subtitle}
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-left">
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A80C14]/20 focus:border-[#A80C14]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A80C14]/20 focus:border-[#A80C14]"
              />
            </div>

            {authError && (
              <p className="text-[11px] font-bold text-red-500 mt-1">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full py-2.5 bg-[#A80C14] hover:bg-[#8C0A10] text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              {isSubmittingAuth ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/account?type=register"
              onClick={handleClose}
              className="text-[11px] font-bold text-[#A80C14] hover:underline"
            >
              Don&apos;t have an account? Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
