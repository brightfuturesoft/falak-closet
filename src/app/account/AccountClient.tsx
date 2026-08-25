'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Package, Heart, MapPin, LogOut, ArrowRight, ShieldCheck, Mail, Phone, ArrowLeft, Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  district: string;
  fullAddress: string;
}

export default function AccountClient() {
  const { orders, wishlist } = useCart();

  // Authentication State
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Filter orders for the currently logged-in user
  const userOrders = orders.filter((o) => {
    if (!userProfile) return false;
    const matchEmail = userProfile.email && o.userEmail?.toLowerCase() === userProfile.email.toLowerCase();
    const matchPhone = userProfile.phone && o.shippingAddress?.phone === userProfile.phone;
    const matchName = userProfile.name && o.shippingAddress?.fullName?.toLowerCase() === userProfile.name.toLowerCase();
    return matchEmail || matchPhone || matchName;
  });

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password State
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtpInput, setResetOtpInput] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupDistrict, setSignupDistrict] = useState('Dhaka');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Feedback Banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile Edit State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses'>('orders');

  // Load User Account on Mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('falak_user_account');
      if (savedUser) {
        setUserProfile(JSON.parse(savedUser));
      }
    } catch { }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setFeedback(null);

    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (data.success && data.user) {
        const profileObj: UserProfile = {
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || '01700000000',
          district: data.user.district || 'Dhaka',
          fullAddress: data.user.fullAddress || ''
        };
        setUserProfile(profileObj);
        localStorage.setItem('falak_user_account', JSON.stringify(profileObj));
        setFeedback({ type: 'success', message: `Welcome back, ${profileObj.name}!` });
        // Trigger storage event so that Header component state syncs instantly
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('falak_auth_change'));
      } else {
        setFeedback({ type: 'error', message: data.error || 'Incorrect credentials' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Authentication server error. Check your connection.' });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) return;
    setFeedback(null);

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          district: signupDistrict,
          fullAddress: signupAddress,
          password: signupPassword
        })
      });
      const data = await res.json();

      if (data.success && data.user) {
        const profileObj: UserProfile = {
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || '01700000000',
          district: data.user.district || 'Dhaka',
          fullAddress: data.user.fullAddress || ''
        };
        setUserProfile(profileObj);
        localStorage.setItem('falak_user_account', JSON.stringify(profileObj));
        setFeedback({ type: 'success', message: 'Account registered and signed in successfully!' });
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('falak_auth_change'));
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to create account.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Registration server error.' });
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier) return;
    setFeedback(null);
    setIsResetting(true);

    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-otp', identifier: resetIdentifier })
      });
      const data = await res.json();

      if (data.success) {
        setDemoOtpCode(data.demoOtp || '');
        setFeedback({ type: 'success', message: `OTP verification code generated! Use: ${data.demoOtp}` });
        setResetStep(2);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Account not found.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to request password reset OTP.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtpInput || !newResetPassword || !confirmResetPassword) {
      setFeedback({ type: 'error', message: 'All password fields are required.' });
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    if (newResetPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setFeedback(null);
    setIsResetting(true);

    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          identifier: resetIdentifier,
          otp: resetOtpInput,
          newPassword: newResetPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: 'success', message: 'Password reset successful! You can now log in.' });
        setAuthMode('signin');
        setResetStep(1);
        setDemoOtpCode('');
        setResetOtpInput('');
        setNewResetPassword('');
        setConfirmResetPassword('');
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to reset password.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Reset request server error.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('falak_user_account');
    setFeedback({ type: 'success', message: 'Signed out successfully.' });
    // Trigger storage event so that Header component syncs instantly
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('falak_auth_change'));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-6 pb-36 lg:pb-12">
      {userProfile ? (
        <>
          {/* User Profile Header */}
          <div className="bg-[#FFFBF0] border-2 border-[#F2C76E]/80 p-4 sm:p-6 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#9B050B] text-[#FFFBF0] font-extrabold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-md">
                  {getInitials(userProfile.name)}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h1 className="font-serif font-extrabold text-base sm:text-xl text-[#0C163A] truncate">
                    {userProfile.name}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-stone-500 font-mono truncate">
                    {userProfile.district || 'Dhaka'}, Bangladesh
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-white border border-[#9B050B]/40 hover:bg-[#9B050B]/10 text-[#9B050B] text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2C76E]/40 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#F2C76E]/60 rounded-full font-mono text-stone-700">
                <Mail className="w-3 h-3 text-[#9B050B]" /> {userProfile.email}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#F2C76E]/60 rounded-full font-mono text-stone-700">
                <Phone className="w-3 h-3 text-[#9B050B]" /> {userProfile.phone}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-[#FFFBF0] p-1 rounded-2xl border border-[#F2C76E]/60 text-xs font-bold gap-1 shadow-xs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                activeTab === 'orders'
                  ? 'bg-[#9B050B] text-[#FFFBF0] shadow-xs font-extrabold'
                  : 'text-[#0C163A]/70 hover:text-[#9B050B]'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span className="truncate">Orders ({userOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                activeTab === 'wishlist'
                  ? 'bg-[#9B050B] text-[#FFFBF0] shadow-xs font-extrabold'
                  : 'text-[#0C163A]/70 hover:text-[#9B050B]'
              }`}
            >
              <Heart className="w-4 h-4 shrink-0" />
              <span className="truncate">Wishlist ({wishlist.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                activeTab === 'addresses'
                  ? 'bg-[#9B050B] text-[#FFFBF0] shadow-xs font-extrabold'
                  : 'text-[#0C163A]/70 hover:text-[#9B050B]'
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">Address</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-base text-[#0C163A]">Order History</h2>
              {userOrders.length > 0 ? (
                <div className="space-y-4">
                  {userOrders.map((ord) => (
                    <div key={ord.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-[#F2C76E]/60 shadow-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between border-b border-[#F2C76E]/30 pb-2 text-xs gap-2">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-mono block">Order ID (Click for Details)</span>
                          <Link
                            href={`/track?id=${encodeURIComponent(ord.id)}`}
                            className="font-mono font-extrabold text-[#9B050B] text-sm hover:underline flex items-center gap-1 group cursor-pointer"
                          >
                            <span>#{ord.id}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#9B050B]" />
                          </Link>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-mono block">Date</span>
                          <div className="text-stone-700 font-medium">{new Date(ord.date).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-mono block">Total Amount</span>
                          <div className="font-extrabold text-[#0C163A] font-mono text-sm">{formatCurrency(ord.total)}</div>
                        </div>
                        <Link
                          href={`/track?id=${encodeURIComponent(ord.id)}`}
                          className="px-3.5 py-1.5 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] rounded-full font-bold text-[11px] transition-colors flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0 shadow-xs cursor-pointer"
                        >
                          <span>View Order Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#F2C76E]/40 space-y-3">
                  <Package className="w-8 h-8 text-[#9B050B] mx-auto" />
                  <p className="text-xs text-stone-500 font-medium">No order records found for this account.</p>
                  <Link href="/shop" className="inline-block px-5 py-2 bg-[#9B050B] text-[#FFFBF0] text-xs font-bold rounded-full">
                    Explore Collections
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-base text-[#0C163A]">Saved Wishlist Items ({wishlist.length})</h2>
              {wishlist.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {wishlist.map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded-2xl border border-[#F2C76E]/40 space-y-2 text-xs">
                      <p className="font-bold text-[#0C163A] line-clamp-1">{item.name}</p>
                      <p className="font-mono text-[#9B050B] font-extrabold">{formatCurrency(item.price)}</p>
                      <Link href={`/product/${item.slug}`} className="block text-center py-1.5 bg-[#9B050B] text-[#FFFBF0] font-bold rounded-xl text-[11px]">
                        View Product
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#F2C76E]/40 space-y-2">
                  <Heart className="w-8 h-8 text-[#9B050B] mx-auto" />
                  <p className="text-xs text-stone-500 font-medium">Your wishlist is currently empty.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="p-5 bg-white rounded-3xl border border-[#F2C76E]/60 space-y-4 text-xs">
              <h2 className="font-serif font-bold text-base text-[#0C163A]">Primary Shipping Address</h2>
              <div className="p-4 bg-[#FFFBF0] rounded-2xl border border-[#F2C76E]/40 space-y-1">
                <p className="font-bold text-[#0C163A]">{userProfile.name}</p>
                <p className="text-stone-600">{userProfile.fullAddress}</p>
                <p className="text-stone-600 font-medium">{userProfile.district}, Bangladesh</p>
                <p className="text-stone-600 font-mono">Phone: {userProfile.phone}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Sign In / Sign Up Form Container */
        <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-[#F2C76E]/80 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="font-serif font-extrabold text-2xl text-[#0C163A]">
              {authMode === 'signin' && 'Customer Sign In'}
              {authMode === 'signup' && 'Create Account'}
              {authMode === 'forgot' && 'Reset Password'}
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              {authMode === 'signin' && 'Sign in to manage your orders & profile'}
              {authMode === 'signup' && 'Register for a new customer account'}
              {authMode === 'forgot' && 'Recover your account password'}
            </p>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className={`p-3.5 rounded-xl border text-xs font-bold text-center ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {feedback.message}
            </div>
          )}

          {/* Render Active Form */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#0C163A]">Email Address or Phone Number</label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. customer@example.com or 017XXXXXXXX"
                  className="w-full px-4 py-3 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none focus:ring-2 focus:ring-[#9B050B]/30"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0C163A]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setFeedback(null);
                    }}
                    className="text-[11px] text-[#9B050B] hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none focus:ring-2 focus:ring-[#9B050B]/30"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-colors cursor-pointer"
              >
                Sign In to Account
              </button>

              <div className="text-center pt-2">
                <span className="text-stone-500 font-medium">New to Falak Closet? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setFeedback(null);
                  }}
                  className="text-[#9B050B] font-extrabold hover:underline"
                >
                  Create an Account
                </button>
              </div>
            </form>
          )}

          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#0C163A]">Full Name</label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Sarah Rahman"
                  className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0C163A]">Email Address</label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0C163A]">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#0C163A]">District</label>
                  <select
                    value={signupDistrict}
                    onChange={(e) => setSignupDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none font-bold"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barisal">Barisal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0C163A]">Password</label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0C163A]">Full Shipping Address</label>
                <input
                  type="text"
                  value={signupAddress}
                  onChange={(e) => setSignupAddress(e.target.value)}
                  placeholder="House 12, Road 4, Dhanmondi"
                  className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-colors cursor-pointer mt-2"
              >
                Register & Sign In
              </button>

              <div className="text-center pt-2">
                <span className="text-stone-500 font-medium">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setFeedback(null);
                  }}
                  className="text-[#9B050B] font-extrabold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {authMode === 'forgot' && (
            <div className="space-y-4">
              {resetStep === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0C163A]">Email Address or Phone Number</label>
                    <input
                      type="text"
                      required
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="e.g. sarah@example.com or 017XXXXXXXX"
                      className="w-full px-4 py-3 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-3 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isResetting ? 'Generating Code...' : 'Request Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                  {demoOtpCode && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-stone-800 font-mono text-[11px] text-center">
                      Demo Mode OTP Code: <strong className="text-[#9B050B]">{demoOtpCode}</strong>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-[#0C163A]">Verification OTP Code</label>
                    <input
                      type="text"
                      required
                      value={resetOtpInput}
                      onChange={(e) => setResetOtpInput(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none text-center font-mono tracking-widest text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0C163A]">New Password</label>
                    <input
                      type="password"
                      required
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0C163A]">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-3 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isResetting ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setResetStep(1);
                    setFeedback(null);
                  }}
                  className="text-stone-500 hover:text-[#9B050B] text-xs font-bold inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
