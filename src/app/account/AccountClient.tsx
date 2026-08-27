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
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-6 pb-36 lg:pb-12">
      {userProfile ? (
        <>
          {/* Profile Header */}
          <AccountHeader user={userProfile} onLogout={logout} />

          {/* Tabs */}
          <div className="flex bg-[#FFFBF0] p-1 rounded-2xl border border-[#F2C76E]/60 text-xs font-bold gap-1 shadow-xs">
            {(['orders', 'wishlist', 'addresses'] as ActiveTab[]).map(tab => (
              <button
                key={tab}
                id={`account-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${activeTab === tab
                  ? 'bg-[#9B050B] text-[#FFFBF0] shadow-xs font-extrabold'
                  : 'text-[#0C163A]/70 hover:text-[#9B050B]'
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
