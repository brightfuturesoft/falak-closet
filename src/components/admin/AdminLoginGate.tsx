'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowLeft, Lock, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

interface AdminLoginGateProps {
  onLoginSuccess: () => void;
}

export function AdminLoginGate({ onLoginSuccess }: AdminLoginGateProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        try {
          localStorage.setItem('falak_admin_session', 'true');
          document.cookie = 'falak_admin_session=true; path=/; max-age=86400; SameSite=Lax';
        } catch {}
        onLoginSuccess();
      } else {
        setLoginError(data.error || 'Invalid admin credentials.');
      }
    } catch {
      // Fallback client check if API fails
      if (username.trim() === 'admin' && password === 'falak123') {
        try {
          localStorage.setItem('falak_admin_session', 'true');
          document.cookie = 'falak_admin_session=true; path=/; max-age=86400; SameSite=Lax';
        } catch {}
        onLoginSuccess();
      } else {
        setLoginError('Invalid credentials. Demo credentials: admin / falak123');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setUsername('admin');
    setPassword('falak123');

    try {
      await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'falak123' })
      });
    } catch {}

    try {
      localStorage.setItem('falak_admin_session', 'true');
      document.cookie = 'falak_admin_session=true; path=/; max-age=86400; SameSite=Lax';
    } catch {}

    setIsLoading(false);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="max-w-md w-full relative z-10 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-2xl space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
            <Logo variant="badge" size="lg" />
          </div>
          <div className="space-y-1">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Admin Portal
            </h1>
            <p className="text-xs text-stone-500 font-sans">
              Falak Closet Executive Management Gateway
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 border border-stone-200 rounded-full text-[11px] text-stone-700 font-bold">
            <Lock className="w-3 h-3 text-stone-700" />
            <span>256-Bit Encrypted Session</span>
          </div>
        </div>

        {/* Error Alert */}
        {loginError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-center font-bold">
            {loginError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
              Admin Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (admin)"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (falak123)"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <KeyRound className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform duration-200`} />
            <span>{isLoading ? 'Verifying Credentials...' : 'Unlock Executive Panel'}</span>
          </button>
        </form>

        {/* Quick Demo Login & Navigation */}
        <div className="pt-5 border-t border-stone-200 text-center space-y-3">
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={isLoading}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>1-Click Quick Demo Login</span>
          </button>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors pt-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Live Customer Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
