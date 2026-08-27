'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Lock,
  Camera,
  Share2,
  MessageCircle,
  Play,
  Phone,
  Mail,
  MapPin,
  Sparkles
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import type { SiteIdentity } from '@/lib/siteSettings';

/** "@handle" / digits → full https URL; plain https passes through. */
function socialHref(value: string, base: string): string {
  const v = (value || '').trim();
  if (!v) return '#';
  if (/^https?:\/\//i.test(v)) return v;
  return `${base}/${v.replace(/^@/, '')}`;
}

interface SocialLink {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface ContactLine {
  Icon: React.ComponentType<{ className?: string }>;
  text: string;
  href: string | null;
}

export function Footer({ identity }: { identity: SiteIdentity }) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Only configured channels render — no more placeholder instagram.com links.
  const socials: SocialLink[] = [];
  if (identity.instagram) socials.push({ href: socialHref(identity.instagram, 'https://instagram.com'), label: 'Instagram', Icon: Camera });
  if (identity.facebook) socials.push({ href: socialHref(identity.facebook, 'https://facebook.com'), label: 'Facebook', Icon: Share2 });
  if (identity.whatsapp) socials.push({ href: socialHref(identity.whatsapp, 'https://wa.me'), label: 'WhatsApp', Icon: MessageCircle });
  if (identity.youtube) socials.push({ href: socialHref(identity.youtube, 'https://youtube.com'), label: 'YouTube', Icon: Play });

  const rawAddress = identity.address || 'House 3, Banasree Main Road, Dhaka 1219 | Shop 248, 2nd Floor, Moti Super Market, Chattogram';
  const addresses = rawAddress.split(/[|\n;]/).map(a => a.trim()).filter(Boolean);
  const phone = identity.contactPhone || '01799-775487';
  const phoneClean = phone.replace(/[^+\d]/g, '');
  const email = identity.contactEmail || 'info@eziclick.com';

  return (
    <footer className="bg-[#FDF2F3]/40 text-[#0D153A] border-t border-[#F8D2D5] pt-12 pb-12 font-sans">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand Col */}
        <div className="lg:col-span-2 space-y-4">
          <Logo variant="full" size="md" />
          <p className="text-xs text-stone-600 leading-relaxed max-w-sm">
            Falak Closet is your destination for handcrafted luxury abayas, silk hijabs, kaftans, dresses, and modest couture collections.
          </p>

          {/* Value Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F3] border border-[#F8D2D5] text-[#A80C14] text-[10px] font-bold shadow-xs">
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span>Fast Delivery</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F3] border border-[#F8D2D5] text-[#A80C14] text-[10px] font-bold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>All Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F3] border border-[#F8D2D5] text-[#A80C14] text-[10px] font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Modest style</span>
            </span>
          </div>

          {/* Social Links */}
          {socials.length > 0 && (
            <div className="pt-2 flex items-center gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="p-2 bg-[#FDF2F3] hover:bg-[#A80C14] text-[#A80C14] hover:text-white rounded-full transition-colors border border-[#F8D2D5]/80"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Contact Info Col */}
        <div className="space-y-3 text-xs">
          <h4 className="font-extrabold text-[#A80C14] uppercase tracking-wider text-xs">Contact</h4>
          <div className="space-y-3 text-stone-600 font-sans">
            {addresses.map((addr, index) => {
              let label = '';
              const addrLower = addr.toLowerCase();
              if (addrLower.includes('dhaka')) label = 'Dhaka';
              else if (addrLower.includes('chattogram') || addrLower.includes('ctg')) label = 'Chattogram';
              else if (addresses.length > 1) label = `Address ${index + 1}`;

              return (
                <div key={index} className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#A80C14] shrink-0 mt-0.5" />
                  <div>
                    {label && <strong className="text-stone-800 uppercase block text-[9px] tracking-wider">{label}</strong>}
                    <span>{addr}</span>
                  </div>
                </div>
              );
            })}

            {phone && (
              <a href={`tel:${phoneClean}`} className="flex items-center gap-2 hover:text-[#A80C14] transition-colors">
                <Phone className="w-4 h-4 text-[#A80C14] shrink-0" />
                <span>{phone}</span>
              </a>
            )}

            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-[#A80C14] transition-colors">
                <Mail className="w-4 h-4 text-[#A80C14] shrink-0" />
                <span>{email}</span>
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3 text-xs">
          <h4 className="font-extrabold text-[#A80C14] uppercase tracking-wider text-xs">Account</h4>
          <ul className="space-y-2 text-stone-600">
            <li><Link href="/account" className="hover:text-[#A80C14]">My profile</Link></li>
            <li><Link href="/account" className="hover:text-[#A80C14]">Order history</Link></li>
            <li><Link href="/track" className="hover:text-[#A80C14]">Track order</Link></li>
            <li><Link href="/cart" className="hover:text-[#A80C14]">Cart</Link></li>
          </ul>
        </div>

        {/* Client Care */}
        <div className="space-y-3 text-xs">
          <h4 className="font-extrabold text-[#A80C14] uppercase tracking-wider text-xs">Help</h4>
          <ul className="space-y-2 text-stone-600">
            <li><Link href="/shipping" className="hover:text-[#A80C14]">Delivery charge</Link></li>
            <li><Link href="/returns" className="hover:text-[#A80C14]">Refunds & exchange</Link></li>
            <li><Link href="/terms" className="hover:text-[#A80C14]">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-[#A80C14]">Privacy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-4 border-t border-[#F8D2D5] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500 font-mono">
        <p>© {new Date().getFullYear()} FALAK CLOSET. All Rights Reserved.</p>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Encrypted Checkout</span>
        </div>
      </div>
    </footer>
  );
}
