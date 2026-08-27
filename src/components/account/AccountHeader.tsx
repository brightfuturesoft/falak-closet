'use client';

import React from 'react';
import { User, LogOut, Mail, Phone } from 'lucide-react';
import { getInitials } from './fields';
import type { UserProfile } from '@/app/account/useAccount';

export function AccountHeader({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  return (
    <div className="bg-[#FFFBF0] border-2 border-[#F2C76E]/80 p-4 sm:p-6 rounded-3xl shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#9B050B] to-[#C0392B] text-[#FFFBF0] font-extrabold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-md">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 space-y-0.5">
            <h1 className="font-serif font-extrabold text-base sm:text-xl text-[#0C163A] truncate">
              {user.name}
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-500 font-mono truncate">
              {user.district || 'Dhaka'}, Bangladesh
            </p>
          </div>
        </div>

        <button
          id="account-signout-btn"
          onClick={onLogout}
          className="px-3.5 py-1.5 bg-white border border-[#9B050B]/40 hover:bg-[#9B050B]/10 text-[#9B050B] text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2C76E]/40 text-[11px]">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#F2C76E]/60 rounded-full font-mono text-stone-700">
          <Mail className="w-3 h-3 text-[#9B050B]" /> {user.email}
        </span>
        {user.phone && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#F2C76E]/60 rounded-full font-mono text-stone-700">
            <Phone className="w-3 h-3 text-[#9B050B]" /> {user.phone}
          </span>
        )}
      </div>
    </div>
  );
}

// Re-export for convenience so consumers don't need two import paths.
export { User as UserIcon };
