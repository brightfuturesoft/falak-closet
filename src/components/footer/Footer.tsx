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
  MapPin
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

  const contactLines: ContactLine[] = [];
  if (identity.contactPhone) contactLines.push({ Icon: Phone, text: identity.contactPhone, href: `tel:${identity.contactPhone.replace(/[^+\d]/g, '')}` });
  if (identity.contactEmail) contactLines.push({ Icon: Mail, text: identity.contactEmail, href: `mailto:${identity.contactEmail}` });
  if (identity.address) contactLines.push({ Icon: MapPin, text: identity.address, href: null });
  return (
    <footer className="bg-[#FFFBF0] text-[#0C163A] border-t border-[#F2C76E]/40 pt-12 pb-12 font-sans">
      {/* 4 Value Pillars Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 border-b border-[#F2C76E]/30 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <div className="p-4 rounded-2xl bg-white border border-[#F2C76E]/40 space-y-1.5 shadow-xs">
          <Truck className="w-5 h-5 text-[#9B050B] mx-auto" />
          <h4 className="font-bold text-xs text-[#0C163A]">Express Delivery</h4>
          <p className="text-[11px] text-stone-500">Fast shipping across Bangladesh</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#F2C76E]/40 space-y-1.5 shadow-xs">
          <RotateCcw className="w-5 h-5 text-[#9B050B] mx-auto" />
          <h4 className="font-bold text-xs text-[#0C163A]">30-Day Returns</h4>
          <p className="text-[11px] text-stone-500">Easy exchanges & returns</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#F2C76E]/40 space-y-1.5 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-[#9B050B] mx-auto" />
          <h4 className="font-bold text-xs text-[#0C163A]">100% Quality Guarantee</h4>
          <p className="text-[11px] text-stone-500">Premium fabric & stitching</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#F2C76E]/40 space-y-1.5 shadow-xs">
          <Headphones className="w-5 h-5 text-[#9B050B] mx-auto" />
          <h4 className="font-bold text-xs text-[#0C163A]">Customer Support</h4>
          <p className="text-[11px] text-stone-500">24/7 dedicated assistance</p>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand Col */}
        <div className="lg:col-span-2 space-y-3">
          <Logo variant="full" size="md" />
          <p className="text-xs text-stone-600 leading-relaxed max-w-sm">
            Falak Closet is your destination for handcrafted luxury abayas, silk hijabs, kaftans, dresses, and modest couture collections.
          </p>

          {contactLines.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {contactLines.map(({ Icon, text, href }) =>
                href ? (
                  <a key={text} href={href} className="flex items-center gap-2 text-xs text-stone-600 hover:text-[#9B050B] transition-colors">
                    <Icon className="w-3.5 h-3.5 text-[#9B050B] shrink-0" />
                    <span>{text}</span>
                  </a>
                ) : (
                  <p key={text} className="flex items-start gap-2 text-xs text-stone-600">
                    <Icon className="w-3.5 h-3.5 text-[#9B050B] shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </p>
                )
              )}
            </div>
          )}

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
                  className="p-2 bg-[#F2C76E]/20 hover:bg-[#9B050B] text-[#0C163A] hover:text-white rounded-full transition-colors border border-[#F2C76E]/40"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="space-y-2 text-xs">
          <h4 className="font-extrabold text-[#9B050B] uppercase tracking-wider text-xs">Shop Collections</h4>
          <ul className="space-y-1.5 text-stone-600">
            <li><Link href="/shop?category=Abayas" className="hover:text-[#9B050B]">Abayas</Link></li>
            <li><Link href="/shop?category=Modest%20Dresses" className="hover:text-[#9B050B]">Modest Dresses</Link></li>
            <li><Link href="/shop?category=Hijabs%20%26%20Dupattas" className="hover:text-[#9B050B]">Hijabs & Dupattas</Link></li>
            <li><Link href="/live-promotions" className="hover:text-[#9B050B] text-[#9B050B] font-bold">Live Promotions</Link></li>
          </ul>
        </div>

        {/* Client Care */}
        <div className="space-y-2 text-xs">
          <h4 className="font-extrabold text-[#9B050B] uppercase tracking-wider text-xs">Customer Care</h4>
          <ul className="space-y-1.5 text-stone-600">
            <li><Link href="/track" className="hover:text-[#9B050B]">Track Order</Link></li>
            <li><Link href="/how-to-order" className="hover:text-[#9B050B]">How to Order</Link></li>
            <li><Link href="/shipping" className="hover:text-[#9B050B]">Shipping Info</Link></li>
            <li><Link href="/admin" className="hover:text-[#9B050B]">Admin Portal</Link></li>
          </ul>
        </div>

        {/* Legal Policies */}
        <div className="space-y-2 text-xs">
          <h4 className="font-extrabold text-[#9B050B] uppercase tracking-wider text-xs">Legal</h4>
          <ul className="space-y-1.5 text-stone-600">
            <li><Link href="/privacy" className="hover:text-[#9B050B]">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-[#9B050B]">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-4 border-t border-[#F2C76E]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500 font-mono">
        <p>© {new Date().getFullYear()} FALAK CLOSET. All Rights Reserved.</p>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Encrypted Checkout</span>
        </div>
      </div>
    </footer>
  );
}
