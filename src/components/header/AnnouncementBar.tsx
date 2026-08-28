'use client';

import React, { useState, useEffect } from 'react';
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

  // Read localStorage only after mount. Reading it during render makes the
  // hydration pass diverge from the server HTML (server can't see localStorage)
  // and throws React error #418 for every visitor who dismissed the message.
  useEffect(() => {
    if (!announcement.isActive || !announcement.message) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === announcement.message) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of persisted dismissal; safe to run post-mount
        setDismissed(true);
      }
    } catch {
      /* localStorage unavailable — keep showing the bar */
    }
  }, [announcement.isActive, announcement.message]);

  // Admin has its own chrome; the storefront bar never shows there.
  if (!announcement.isActive || !announcement.message || pathname?.startsWith('/admin')) {
    return null;
  }

  if (dismissed) return null;

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
    <div className="bg-gradient-to-r from-[#0D153A] via-[#A80C14] to-[#0D153A] text-white text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-2 relative">
        <Megaphone className="w-3.5 h-3.5 text-[#F5C77E] shrink-0" />
        <p className="font-bold tracking-wide text-center truncate">
          {announcement.message}
          {safeLink && (
            <Link
              href={safeLink}
              className="inline-flex items-center gap-1 ml-2 text-[#F5C77E] hover:text-white underline underline-offset-2 transition-colors"
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
