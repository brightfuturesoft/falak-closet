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
import Image from 'next/image';

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
  Icon: string
}

interface ContactLine {
  Icon: React.ComponentType<{ className?: string }>;
  text: string;
  href: string | null;
}

function SocialIcon({ label, className = "w-5 h-5" }: { label: string; className?: string }) {
  const l = label.toLowerCase();
  if (l.includes('instagram')) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  if (l.includes('facebook')) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (l.includes('whatsapp')) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
      </svg>
    );
  }
  if (l.includes('youtube')) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  return null;
}

export function Footer({ identity }: { identity: SiteIdentity }) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Only configured channels render — no more placeholder instagram.com links.
  const socials: SocialLink[] = [];
  if (identity.instagram) socials.push({ href: socialHref(identity.instagram, 'https://instagram.com'), label: 'Instagram', Icon: "/icons/instagram.svg" });
  if (identity.facebook) socials.push({ href: socialHref(identity.facebook, 'https://facebook.com'), label: 'Facebook', Icon: "/icons/facebook.svg" });
  if (identity.whatsapp) socials.push({ href: socialHref(identity.whatsapp, 'https://wa.me'), label: 'WhatsApp', Icon: "/icons/whatsapp.svg" });
  if (identity.youtube) socials.push({ href: socialHref(identity.youtube, 'https://youtube.com'), label: 'YouTube', Icon: "/icons/youtube.svg" });

  const rawAddress = identity.address || 'House 3, Banasree Main Road, Dhaka 1219 | Shop 248, 2nd Floor, Moti Super Market, Chattogram';
  const addresses = rawAddress.split(/[|\n;]/).map(a => a.trim()).filter(Boolean);
  const phone = identity.contactPhone || '01799-775487';
  const phoneClean = phone.replace(/[^+\d]/g, '');
  const email = identity.contactEmail || 'info@falakcloset.com';

  return (
    <footer className="bg-[#FDF2F3]/40 text-[#0D153A] border-t border-[#F8D2D5] pt-12 pb-28 sm:pb-24 lg:pb-12 font-sans">
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
              {socials.map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="group p-2.5 bg-[#FDF2F3] hover:bg-[#A80C14] text-[#A80C14] hover:text-white rounded-full transition-colors border border-[#F8D2D5]/80 flex items-center justify-center"
                >
                  <SocialIcon label={label} className="w-5 h-5 fill-current transition-colors" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-[#F8D2D5]/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 font-sans text-center sm:text-left">
        <p>© {new Date().getFullYear()} <strong className="font-semibold text-stone-700">FALAK CLOSET</strong>. All Rights Reserved.</p>
        <p className="flex items-center gap-1.5">
          <span>Design &amp; Development by</span>
          <a
            href="https://brightfuturesoft.com?ref=falakcloset"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#A80C14] font-bold hover:underline underline-offset-2 decoration-[#A80C14]/50 hover:decoration-[#A80C14] transition-colors"
          >
            Bright Future Soft
          </a>
        </p>
      </div>
    </footer>
  );
}
