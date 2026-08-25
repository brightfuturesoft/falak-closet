'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Package, Heart, MapPin, LogOut, ArrowRight, ShieldCheck, Mail, Phone } from 'lucide-react';
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

    try {
      const res = await fetch('/api/user/all');
      const data = await res.json();

      if (data.success && data.users) {
        const matched = data.users.find(
          (u: any) => u.email.toLowerCase() === loginEmail.toLowerCase()
        );
        if (matched) {
          const profileObj: UserProfile = {
            name: matched.name,
            email: matched.email,
            phone: matched.phone || '01700000000',
            district: matched.district || 'Dhaka',
            fullAddress: matched.fullAddress || 'Banani, Dhaka'
          };
          setUserProfile(profileObj);
          localStorage.setItem('falak_user_account', JSON.stringify(profileObj));
          setFeedback({ type: 'success', message: `Welcome back, ${profileObj.name}!` });
          return;
        }
      }
    } catch { }

    // Demo account fallback
    const demoProfile: UserProfile = {
      name: loginEmail.split('@')[0] || 'Valued Member',
      email: loginEmail,
      phone: '01700000000',
      district: 'Dhaka',
      fullAddress: 'House 12, Road 5, Dhanmondi'
    };
    setUserProfile(demoProfile);
    localStorage.setItem('falak_user_account', JSON.stringify(demoProfile));
    setFeedback({ type: 'success', message: 'Signed in successfully!' });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) return;

    try {
      await fetch('/api/user', {
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
    } catch { }

    const profileObj: UserProfile = {
      name: signupName,
      email: signupEmail,
      phone: signupPhone || '01700000000',
      district: signupDistrict || 'Dhaka',
      fullAddress: signupAddress || 'Dhaka, Bangladesh'
    };

    setUserProfile(profileObj);
    localStorage.setItem('falak_user_account', JSON.stringify(profileObj));
    setFeedback({ type: 'success', message: 'Account created successfully!' });
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('falak_user_account');
    setFeedback({ type: 'success', message: 'Signed out successfully.' });
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
        /* Sign In / Sign Up Form */
        <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-[#F2C76E]/80 p-6 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h1 className="font-serif font-extrabold text-2xl text-[#0C163A]">Customer Portal</h1>
            <p className="text-xs text-stone-500">Sign in to manage your orders & profile</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#0C163A]">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. sarah@example.com"
                className="w-full px-3.5 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none focus:ring-2 focus:ring-[#9B050B]/30"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#0C163A]">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-full text-[#0C163A] focus:outline-none focus:ring-2 focus:ring-[#9B050B]/30"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-colors cursor-pointer"
            >
              Sign In to Account
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
