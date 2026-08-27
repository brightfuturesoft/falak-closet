'use client';

import React, { useState } from 'react';
import { Package, Heart, MapPin } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAccount } from './useAccount';
import { AccountHeader } from '@/components/account/AccountHeader';
import { OrdersTab } from '@/components/account/OrdersTab';
import { WishlistTab } from '@/components/account/WishlistTab';
import { AddressTab } from '@/components/account/AddressTab';
import { AuthTabs } from '@/components/account/AuthTabs';
import type { UserProfile } from './useAccount';

type ActiveTab = 'orders' | 'wishlist' | 'addresses';

interface AccountClientProps {
  initialUser: UserProfile | null;
}

export default function AccountClient({ initialUser }: AccountClientProps) {
  const { wishlist } = useCart();
  const account = useAccount(initialUser);
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');

  const {
    userProfile,
    authMode,
    switchMode,
    feedback,
    showFeedback,
    signIn,
    signUp,
    logout,
    updateUser,
    orders,
    isLoadingOrders,
    ordersError,
    fetchOrders,
  } = account;

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 pb-36 lg:pb-12">
      {userProfile ? (
        <>
          {/* Profile Header */}
          <AccountHeader user={userProfile} onLogout={logout} />

          {/* Tabs */}
          <div
            className="grid grid-cols-3 gap-1 bg-white p-1.5 rounded-full border border-stone-200/80 shadow-xs"
            role="tablist"
            aria-label="Account sections"
          >
            {(['orders', 'wishlist', 'addresses'] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                id={`account-tab-${tab}`}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center justify-center gap-1.5 min-h-[40px] px-2 rounded-full transition-all cursor-pointer text-center text-xs font-bold ${
                  activeTab === tab
                    ? 'bg-[#D92670] text-white shadow-md shadow-[#D92670]/25'
                    : 'text-stone-500 hover:text-[#D92670] hover:bg-pink-50'
                }`}
              >
                {tab === 'orders' && (
                  <>
                    <Package className="w-4 h-4 shrink-0" />
                    <span className="truncate">Orders ({orders.length})</span>
                  </>
                )}
                {tab === 'wishlist' && (
                  <>
                    <Heart className="w-4 h-4 shrink-0" />
                    <span className="truncate">Wishlist ({wishlist.length})</span>
                  </>
                )}
                {tab === 'addresses' && (
                  <>
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">Address</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              isLoading={isLoadingOrders}
              error={ordersError}
              onRetry={fetchOrders}
            />
          )}
          {activeTab === 'wishlist' && <WishlistTab />}
          {activeTab === 'addresses' && (
            <AddressTab
              user={userProfile}
              onUpdateUser={updateUser}
              onShowFeedback={showFeedback}
            />
          )}
        </>
      ) : (
        <AuthTabs
          authMode={authMode}
          onSwitchMode={switchMode}
          feedback={feedback}
          onShowFeedback={showFeedback}
          onSignIn={signIn}
          onSignUp={signUp}
        />
      )}
    </div>
  );
}
