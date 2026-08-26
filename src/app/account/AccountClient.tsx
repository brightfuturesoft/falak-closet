'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  User, Package, Heart, MapPin, LogOut, ArrowRight,
  Mail, Phone, Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, ChevronLeft, KeyRound, ShieldCheck, Edit3, Save, X
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  district: string;
  fullAddress: string;
}

type AuthMode = 'signin' | 'signup' | 'forgot';
type ResetStep = 1 | 2;
type ActiveTab = 'orders' | 'wishlist' | 'addresses';

const DISTRICTS = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet',
  'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur',
  'Narayanganj', 'Tangail', 'Bogra', 'Jessore', 'Dinajpur',
  'Cox\'s Bazar', 'Faridpur', 'Pabna', 'Brahmanbaria', 'Other'
];

/* ─────────────────────────────────────────────
   Small helpers
───────────────────────────────────────────── */
function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function Feedback({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl text-xs font-medium border ${
        type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
      <span>{message}</span>
    </div>
  );
}

function InputField({
  label, type = 'text', value, onChange, placeholder, required, disabled,
  rightElement,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wide text-[#0C163A]/70">
        {label}{required && <span className="text-[#9B050B] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/70 rounded-xl text-[#0C163A] text-xs
                     placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9B050B]/25
                     focus:border-[#9B050B]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                     pr-10"
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

function PasswordInput({
  label, value, onChange, placeholder, required, disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <InputField
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? '••••••••'}
      required={required}
      disabled={disabled}
      rightElement={
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="text-stone-400 hover:text-[#9B050B] transition-colors cursor-pointer"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
}

function SubmitButton({ loading, children, disabled }: { loading?: boolean; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-3 bg-[#9B050B] hover:bg-[#B8000A] disabled:opacity-60 disabled:cursor-not-allowed
                 text-[#FFFBF0] font-bold text-xs uppercase tracking-wider rounded-full shadow-md
                 transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function AccountClient() {
  const { orders, wishlist } = useCart();

  /* Auth State */
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  /* Feedback */
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  }, []);

  /* ── Sign In ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  /* ── Sign Up ── */
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupDistrict, setSignupDistrict] = useState('Dhaka');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  /* ── Forgot Password ── */
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtpInput, setResetOtpInput] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [resetStep, setResetStep] = useState<ResetStep>(1);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  /* ── Account / Tabs ── */
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  /* Load saved user on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('falak_user_account');
      if (saved) setUserProfile(JSON.parse(saved));
    } catch { }
  }, []);

  /* Filter orders by logged-in user */
  const userOrders = orders.filter(o => {
    if (!userProfile) return false;
    const matchEmail = userProfile.email && o.userEmail?.toLowerCase() === userProfile.email.toLowerCase();
    const matchPhone = userProfile.phone && o.shippingAddress?.phone === userProfile.phone;
    return matchEmail || matchPhone;
  });

  /* ─── Handlers ─── */

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setIsSigningIn(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showFeedback('error', data.error || 'Sign-in failed. Please check your credentials.');
        return;
      }

      const profile: UserProfile = {
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || '',
        district: data.user.district || 'Dhaka',
        fullAddress: data.user.fullAddress || '',
      };
      setUserProfile(profile);
      localStorage.setItem('falak_user_account', JSON.stringify(profile));
      showFeedback('success', `Welcome back, ${profile.name}! 🎉`);
    } catch {
      showFeedback('error', 'Unable to connect. Please check your internet connection.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!signupName || !signupEmail || !signupPhone || !signupPassword) return;

    if (signupPassword.length < 6) {
      showFeedback('error', 'Password must be at least 6 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      showFeedback('error', 'Passwords do not match.');
      return;
    }

    setIsSigningUp(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim(),
          phone: signupPhone.trim(),
          district: signupDistrict,
          fullAddress: signupAddress,
          password: signupPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showFeedback('error', data.error || 'Sign-up failed. Please try again.');
        return;
      }

      const profile: UserProfile = {
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || '',
        district: data.user.district || 'Dhaka',
        fullAddress: data.user.fullAddress || '',
      };
      setUserProfile(profile);
      localStorage.setItem('falak_user_account', JSON.stringify(profile));
      showFeedback('success', 'Account created! Welcome to Falak Closet ✨');
    } catch {
      showFeedback('error', 'Unable to connect. Please check your internet connection.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier) return;
    setIsResetting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-otp', identifier: resetIdentifier.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showFeedback('error', data.error || 'Could not find an account with that email or phone.');
        return;
      }

      if (data.demoOtp) setDemoOtpCode(data.demoOtp);
      setResetStep(2);
      showFeedback('success', 'OTP sent! Check your email/phone for the code.');
    } catch {
      showFeedback('error', 'Unable to connect. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newResetPassword.length < 6) {
      showFeedback('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      showFeedback('error', 'Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          identifier: resetIdentifier.trim(),
          otp: resetOtpInput.trim(),
          newPassword: newResetPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showFeedback('error', data.error || 'Reset failed. Please check your OTP and try again.');
        return;
      }

      showFeedback('success', 'Password updated! You can now sign in.');
      setAuthMode('signin');
      setResetStep(1);
      setResetIdentifier('');
      setResetOtpInput('');
      setNewResetPassword('');
      setConfirmResetPassword('');
      setDemoOtpCode('');
    } catch {
      showFeedback('error', 'Unable to connect. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('falak_user_account');
    setAuthMode('signin');
    setFeedback(null);
  };

  const startEditAddress = () => {
    if (!userProfile) return;
    setEditName(userProfile.name);
    setEditPhone(userProfile.phone);
    setEditDistrict(userProfile.district);
    setEditAddress(userProfile.fullAddress);
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSavingAddress(true);

    const updated: UserProfile = {
      ...userProfile,
      name: editName.trim() || userProfile.name,
      phone: editPhone.trim() || userProfile.phone,
      district: editDistrict || userProfile.district,
      fullAddress: editAddress.trim(),
    };

    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          district: updated.district,
          fullAddress: updated.fullAddress,
        }),
      });
    } catch { }

    setUserProfile(updated);
    localStorage.setItem('falak_user_account', JSON.stringify(updated));
    setIsEditingAddress(false);
    setIsSavingAddress(false);
    showFeedback('success', 'Profile updated successfully!');
  };

  /* ─── Render helpers ─── */

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setFeedback(null);
    setResetStep(1);
    setDemoOtpCode('');
  };

  /* ========================================================
     MAIN RENDER
  ======================================================== */
  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-6 pb-36 lg:pb-12">

      {/* ── Authenticated View ── */}
      {userProfile ? (
        <>
          {/* Profile Header */}
          <div className="bg-[#FFFBF0] border-2 border-[#F2C76E]/80 p-4 sm:p-6 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#9B050B] to-[#C0392B] text-[#FFFBF0] font-extrabold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-md">
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
                id="account-signout-btn"
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-white border border-[#9B050B]/40 hover:bg-[#9B050B]/10 text-[#9B050B] text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2C76E]/40 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#F2C76E]/60 rounded-full font-mono text-stone-700">
                <Mail className="w-3 h-3 text-[#9B050B]" /> {userProfile.email}
              </span>
              {userProfile.phone && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#F2C76E]/60 rounded-full font-mono text-stone-700">
                  <Phone className="w-3 h-3 text-[#9B050B]" /> {userProfile.phone}
                </span>
              )}
            </div>
          </div>

          {/* Feedback */}
          {feedback && <Feedback type={feedback.type} message={feedback.message} />}

          {/* Tabs */}
          <div className="flex bg-[#FFFBF0] p-1 rounded-2xl border border-[#F2C76E]/60 text-xs font-bold gap-1 shadow-xs">
            {(['orders', 'wishlist', 'addresses'] as ActiveTab[]).map(tab => (
              <button
                key={tab}
                id={`account-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                  activeTab === tab
                    ? 'bg-[#9B050B] text-[#FFFBF0] shadow-xs font-extrabold'
                    : 'text-[#0C163A]/70 hover:text-[#9B050B]'
                }`}
              >
                {tab === 'orders' && <><Package className="w-4 h-4 shrink-0" /><span className="truncate">Orders ({userOrders.length})</span></>}
                {tab === 'wishlist' && <><Heart className="w-4 h-4 shrink-0" /><span className="truncate">Wishlist ({wishlist.length})</span></>}
                {tab === 'addresses' && <><MapPin className="w-4 h-4 shrink-0" /><span className="truncate">Address</span></>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-base text-[#0C163A]">Order History</h2>
              {userOrders.length > 0 ? (
                <div className="space-y-4">
                  {userOrders.map(ord => (
                    <div key={ord.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-[#F2C76E]/60 shadow-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between border-b border-[#F2C76E]/30 pb-2 text-xs gap-2">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-mono block">Order ID</span>
                          <Link
                            href={`/track?id=${encodeURIComponent(ord.id)}`}
                            className="font-mono font-extrabold text-[#9B050B] text-sm hover:underline flex items-center gap-1 group cursor-pointer"
                          >
                            <span>#{ord.id}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-mono block">Date</span>
                          <div className="text-stone-700 font-medium">{new Date(ord.date).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-mono block">Total</span>
                          <div className="font-extrabold text-[#0C163A] font-mono text-sm">{formatCurrency(ord.total)}</div>
                        </div>
                        <Link
                          href={`/track?id=${encodeURIComponent(ord.id)}`}
                          className="px-3.5 py-1.5 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] rounded-full font-bold text-[11px] transition-colors flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0 shadow-xs cursor-pointer"
                        >
                          <span>View Details</span><ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#F2C76E]/40 space-y-3">
                  <Package className="w-8 h-8 text-[#9B050B] mx-auto" />
                  <p className="text-xs text-stone-500 font-medium">No orders found for this account.</p>
                  <Link href="/shop" className="inline-block px-5 py-2 bg-[#9B050B] text-[#FFFBF0] text-xs font-bold rounded-full">
                    Explore Collections
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-base text-[#0C163A]">Saved Items ({wishlist.length})</h2>
              {wishlist.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {wishlist.map(item => (
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
                  <p className="text-xs text-stone-500 font-medium">Your wishlist is empty.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="p-5 bg-white rounded-3xl border border-[#F2C76E]/60 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="font-serif font-bold text-base text-[#0C163A]">Profile & Address</h2>
                {!isEditingAddress && (
                  <button
                    id="account-edit-address-btn"
                    onClick={startEditAddress}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#9B050B]/30 text-[#9B050B] rounded-full font-bold hover:bg-[#9B050B]/5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>

              {isEditingAddress ? (
                <form onSubmit={handleSaveAddress} className="space-y-3">
                  <InputField label="Full Name" value={editName} onChange={setEditName} placeholder="Your full name" required />
                  <InputField label="Phone Number" value={editPhone} onChange={setEditPhone} placeholder="01XXXXXXXXX" required />
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-[#0C163A]/70">District</label>
                    <select
                      value={editDistrict}
                      onChange={e => setEditDistrict(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/70 rounded-xl text-[#0C163A] text-xs focus:outline-none focus:ring-2 focus:ring-[#9B050B]/25"
                    >
                      {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <InputField label="Full Address" value={editAddress} onChange={setEditAddress} placeholder="House, road, area..." />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="flex-1 py-2.5 border border-stone-300 text-stone-600 font-bold rounded-full text-xs hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      type="submit"
                      id="account-save-address-btn"
                      disabled={isSavingAddress}
                      className="flex-1 py-2.5 bg-[#9B050B] text-[#FFFBF0] font-bold rounded-full text-xs hover:bg-[#B8000A] disabled:opacity-60 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSavingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-[#FFFBF0] rounded-2xl border border-[#F2C76E]/40 space-y-1.5">
                  <p className="font-bold text-[#0C163A] text-sm">{userProfile.name}</p>
                  {userProfile.fullAddress && <p className="text-stone-600">{userProfile.fullAddress}</p>}
                  <p className="text-stone-600 font-medium">{userProfile.district}, Bangladesh</p>
                  <p className="text-stone-600 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {userProfile.phone || '—'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (

        /* ── Unauthenticated View ── */
        <div className="max-w-md mx-auto space-y-4">

          {/* Card */}
          <div className="bg-white rounded-3xl border-2 border-[#F2C76E]/80 overflow-hidden shadow-sm">

            {/* Header */}
            <div className="bg-gradient-to-br from-[#9B050B] to-[#C0392B] px-6 py-7 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                {authMode === 'signin' && <User className="w-6 h-6 text-white" />}
                {authMode === 'signup' && <ShieldCheck className="w-6 h-6 text-white" />}
                {authMode === 'forgot' && <KeyRound className="w-6 h-6 text-white" />}
              </div>
              <h1 className="font-serif font-extrabold text-xl text-white">
                {authMode === 'signin' && 'Welcome Back'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'forgot' && 'Reset Password'}
              </h1>
              <p className="text-white/70 text-xs mt-1">
                {authMode === 'signin' && 'Sign in to manage your orders & profile'}
                {authMode === 'signup' && 'Join Falak Closet for exclusive access'}
                {authMode === 'forgot' && (resetStep === 1 ? 'Enter your email or phone to receive an OTP' : 'Enter the OTP and your new password')}
              </p>
            </div>

            <div className="p-6 space-y-5">

              {/* Feedback inside card */}
              {feedback && <Feedback type={feedback.type} message={feedback.message} />}

              {/* Demo OTP hint */}
              {demoOtpCode && authMode === 'forgot' && resetStep === 2 && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Demo OTP (SMS/Email): <strong className="font-mono tracking-widest">{demoOtpCode}</strong></span>
                </div>
              )}

              {/* ══ SIGN IN FORM ══ */}
              {authMode === 'signin' && (
                <form id="signin-form" onSubmit={handleSignIn} className="space-y-4">
                  <InputField
                    label="Email Address"
                    type="email"
                    value={loginEmail}
                    onChange={setLoginEmail}
                    placeholder="e.g. sarah@example.com"
                    required
                    disabled={isSigningIn}
                  />
                  <PasswordInput
                    label="Password"
                    value={loginPassword}
                    onChange={setLoginPassword}
                    required
                    disabled={isSigningIn}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] text-[#9B050B] font-bold hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <SubmitButton loading={isSigningIn}>Sign In to Account</SubmitButton>
                </form>
              )}

              {/* ══ SIGN UP FORM ══ */}
              {authMode === 'signup' && (
                <form id="signup-form" onSubmit={handleSignUp} className="space-y-3.5">
                  <InputField
                    label="Full Name"
                    value={signupName}
                    onChange={setSignupName}
                    placeholder="e.g. Sarah Akhtar"
                    required
                    disabled={isSigningUp}
                  />
                  <InputField
                    label="Email Address"
                    type="email"
                    value={signupEmail}
                    onChange={setSignupEmail}
                    placeholder="e.g. sarah@example.com"
                    required
                    disabled={isSigningUp}
                  />
                  <InputField
                    label="Phone Number"
                    type="tel"
                    value={signupPhone}
                    onChange={setSignupPhone}
                    placeholder="01XXXXXXXXX"
                    required
                    disabled={isSigningUp}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-[#0C163A]/70">
                      District <span className="text-[#9B050B]">*</span>
                    </label>
                    <select
                      value={signupDistrict}
                      onChange={e => setSignupDistrict(e.target.value)}
                      disabled={isSigningUp}
                      className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/70 rounded-xl text-[#0C163A] text-xs focus:outline-none focus:ring-2 focus:ring-[#9B050B]/25 disabled:opacity-50"
                    >
                      {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <InputField
                    label="Full Address (optional)"
                    value={signupAddress}
                    onChange={setSignupAddress}
                    placeholder="House, road, area..."
                    disabled={isSigningUp}
                  />
                  <PasswordInput
                    label="Password (min 6 chars)"
                    value={signupPassword}
                    onChange={setSignupPassword}
                    placeholder="Create a strong password"
                    required
                    disabled={isSigningUp}
                  />
                  <PasswordInput
                    label="Confirm Password"
                    value={signupConfirm}
                    onChange={setSignupConfirm}
                    placeholder="Re-enter your password"
                    required
                    disabled={isSigningUp}
                  />
                  <SubmitButton loading={isSigningUp}>Create Account</SubmitButton>
                </form>
              )}

              {/* ══ FORGOT PASSWORD ══ */}
              {authMode === 'forgot' && (
                <>
                  {resetStep === 1 ? (
                    <form id="forgot-step1-form" onSubmit={handleRequestOtp} className="space-y-4">
                      <InputField
                        label="Email or Phone Number"
                        value={resetIdentifier}
                        onChange={setResetIdentifier}
                        placeholder="e.g. sarah@example.com or 01700000000"
                        required
                        disabled={isResetting}
                      />
                      <SubmitButton loading={isResetting}>Send OTP Code</SubmitButton>
                    </form>
                  ) : (
                    <form id="forgot-step2-form" onSubmit={handleResetPassword} className="space-y-4">
                      <InputField
                        label="OTP Code"
                        value={resetOtpInput}
                        onChange={setResetOtpInput}
                        placeholder="6-digit code"
                        required
                        disabled={isResetting}
                      />
                      <PasswordInput
                        label="New Password"
                        value={newResetPassword}
                        onChange={setNewResetPassword}
                        placeholder="Min 6 characters"
                        required
                        disabled={isResetting}
                      />
                      <PasswordInput
                        label="Confirm New Password"
                        value={confirmResetPassword}
                        onChange={setConfirmResetPassword}
                        placeholder="Re-enter new password"
                        required
                        disabled={isResetting}
                      />
                      <SubmitButton loading={isResetting}>Reset Password</SubmitButton>
                      <button
                        type="button"
                        onClick={() => { setResetStep(1); setFeedback(null); }}
                        className="w-full text-center text-[11px] text-stone-500 hover:text-[#9B050B] cursor-pointer transition-colors flex items-center justify-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Back to step 1
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* ── Mode Switcher ── */}
              <div className="pt-2 border-t border-[#F2C76E]/40 text-center space-y-2">
                {authMode !== 'signin' && (
                  <button
                    type="button"
                    id="switch-to-signin"
                    onClick={() => switchMode('signin')}
                    className="flex items-center justify-center gap-1 w-full text-xs text-[#0C163A]/70 hover:text-[#9B050B] cursor-pointer transition-colors font-medium"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Already have an account? Sign In
                  </button>
                )}
                {authMode !== 'signup' && (
                  <p className="text-[11px] text-stone-500">
                    New to Falak Closet?{' '}
                    <button
                      type="button"
                      id="switch-to-signup"
                      onClick={() => switchMode('signup')}
                      className="text-[#9B050B] font-bold hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
