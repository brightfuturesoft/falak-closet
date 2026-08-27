'use client';

import React from 'react';
import { LogOut, Mail, Phone, BadgeCheck } from 'lucide-react';
import { getInitials } from './fields';
import type { UserProfile } from '@/app/account/useAccount';

export function AccountHeader({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  return (
    <div className="bg-white border border-stone-200/80 p-5 sm:p-6 rounded-3xl shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#D92670] to-[#C2185B] text-white font-extrabold text-lg sm:text-xl flex items-center justify-center shadow-md shadow-[#D92670]/30">
              {getInitials(user.name)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <BadgeCheck className="w-4 h-4 text-[#D92670]" />
            </span>
          </div>
          <div className="min-w-0 space-y-0.5">
            <h1 className="font-serif font-extrabold text-lg sm:text-2xl text-[#0C163A] truncate">
              {user.name}
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-500 truncate">
              {user.district || 'Dhaka'}, Bangladesh
            </p>
          </div>
        </div>

        <button
          id="account-signout-btn"
          onClick={onLogout}
          className="px-3.5 py-2 bg-white border border-[#D92670]/30 hover:bg-[#D92670] hover:border-[#D92670] hover:text-white text-[#D92670] text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100 text-[11px]">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200/70 rounded-full font-mono text-stone-600 max-w-full">
          <Mail className="w-3 h-3 text-[#D92670] shrink-0" />
          <span className="truncate">{user.email}</span>
        </span>
        {user.phone && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200/70 rounded-full font-mono text-stone-600">
            <Phone className="w-3 h-3 text-[#D92670] shrink-0" /> {user.phone}
          </span>
        )}
      </div>
    </div>
  );
}

// Re-export for convenience so consumers don't need two import paths.
export { User as UserIcon } from 'lucide-react';
