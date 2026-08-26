'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Megaphone, ArrowRight, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { Announcement } from '@/lib/siteSettings';

const DISMISS_KEY = 'falak_announcement_dismissed';

/**
 * Slim top-of-page bar for offers/notices. Content is admin-managed
 * (Settings → Announcement Bar); dismissed state survives reloads per
 * message — a new message re-opens the bar automatically.
 */
export function AnnouncementBar({ announcement }: { announcement: Announcement }) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // Admin has its own chrome; the storefront bar never shows there.
  if (!announcement.isActive || !announcement.message || pathname?.startsWith('/admin')) {
    return null;
  }

  // Checked lazily so SSR and the first client render agree (no hydration
  // mismatch) — the dismissal only hides after mount.
  let alreadyDismissed = false;
  try {
    alreadyDismissed = dismissed || localStorage.getItem(DISMISS_KEY) === announcement.message;
  } catch {
    /* localStorage unavailable — just show the bar */
  }
  if (alreadyDismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, announcement.message);
    } catch {
      /* non-fatal */
    }
  };

  const link = announcement.link.trim();
  const safeLink = link.startsWith('/') || /^https?:\/\//i.test(link) ? link : null;

  return (
    <div className="bg-gradient-to-r from-[#0C163A] via-[#9B050B] to-[#0C163A] text-white text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-2 relative">
        <Megaphone className="w-3.5 h-3.5 text-[#F2C76E] shrink-0" />
        <p className="font-bold tracking-wide text-center truncate">
          {announcement.message}
          {safeLink && (
            <Link
              href={safeLink}
              className="inline-flex items-center gap-1 ml-2 text-[#F2C76E] hover:text-white underline underline-offset-2 transition-colors"
            >
              {announcement.linkLabel || 'Learn more'}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="absolute right-0 p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-white/70 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
