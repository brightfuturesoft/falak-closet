import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Truck,
  MapPin,
  PackageCheck,
  Clock,
  BadgeCheck,
  ShieldCheck,
  Mail,
  FileText,
  CreditCard,
} from 'lucide-react';
import { getActiveZonesSafe } from '@/lib/deliveryZones';
import { getStoreSettingsSafe } from '@/lib/siteSettings';
import { formatCurrency } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Shipping & Express Delivery Policy | Falak Closet',
  description:
    'Nationwide delivery rates and speeds across Bangladesh — Inside & Outside Dhaka zone charges, free delivery threshold, and COD options.',
  openGraph: {
    title: 'Shipping & Express Delivery Policy | Falak Closet',
    description:
      'Express delivery speeds across Bangladesh with Cash on Delivery options.',
    url: 'https://falakcloset.com/shipping',
    siteName: 'Falak Closet Modest Fashion',
    type: 'website',
  },
};

export default async function ShippingPolicyPage() {
  // Cached, tagged reads — admin zone/setting writes bust them via revalidateTag
  const [zones, store] = await Promise.all([
    getActiveZonesSafe(),
    getStoreSettingsSafe(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 font-sans text-stone-900">
      {/* ── Page Header ── */}
      <div className="p-5 sm:p-8 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-[#FDF2F3] text-[#A80C14] border border-[#F8D2D5] text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0">
            <Truck className="w-3.5 h-3.5" /> Express Logistics
          </span>
          <span className="text-xs text-stone-400 font-mono">
            Falak Closet Logistics
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight break-words">
          Shipping & Delivery Policy
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
          Fast, reliable doorstep delivery across Bangladesh with Cash on
          Delivery options and transparent shipping rates.
        </p>
      </div>

      {/* ── Key Highlights Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <MapPin className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">
            Nationwide Delivery
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Doorstep parcel delivery to all 64 districts across Bangladesh.
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[#FDF2F3] text-[#A80C14] border border-[#F8D2D5] flex items-center justify-center">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">Fast Dispatch</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Orders processed and dispatched within 24 to 48 business hours.
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <PackageCheck className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">
            Cash on Delivery
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Pay safely at your doorstep when receiving and inspecting your
            parcel.
          </p>
        </div>
      </div>

      {/* ── Policy Sections ── */}
      <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
        {/* Section 1: Delivery Zones & Rates */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3 sm:space-y-4">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>1. Delivery Zones, Rates & Speeds</span>
          </h2>

          {zones.length > 0 ? (
            <div className="space-y-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-stone-200 bg-stone-50/70 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-[#A80C14] shrink-0 shadow-2xs">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-stone-900 text-sm sm:text-base truncate">
                        {zone.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono shrink-0">
                      <span className="flex items-center gap-1 text-stone-600 bg-white px-2 sm:px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] sm:text-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />{' '}
                        {zone.etaDays}
                      </span>
                      <span className="px-2.5 sm:px-3 py-1 bg-[#FDF2F3] text-[#A80C14] font-extrabold text-xs rounded-lg border border-[#F8D2D5]">
                        {formatCurrency(zone.charge)}
                      </span>
                    </div>
                  </div>

                  {zone.subAreas && zone.subAreas.length > 0 && (
                    <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                        Covered Areas & Specific Rates:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {zone.subAreas.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-[11px] text-stone-700 font-medium shadow-2xs"
                          >
                            {s.name}
                            {s.charge !== null && s.charge !== undefined ? (
                              <span className="font-bold text-[#A80C14] ml-1">
                                ({formatCurrency(s.charge)})
                              </span>
                            ) : null}
                          </span>
                        ))}
                      </div>
                      {zone.subAreas.some(
                        (s) => s.charge !== null && s.charge !== undefined
                      ) && (
                        <p className="text-[10px] text-stone-400 italic pt-1">
                          Note: Specific area rates shown in brackets override
                          the general zone fee.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-stone-600">
              Delivery charges are calculated based on your destination area and
              clearly shown at checkout before placing your order.
            </p>
          )}
        </section>

        {/* Section 2: Free Delivery Threshold */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>2. Free Delivery Terms</span>
          </h2>
          <div className="p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl sm:rounded-2xl text-emerald-950 font-medium leading-relaxed">
            {store.freeShippingThreshold > 0 &&
            store.freeShippingThreshold < Infinity ? (
              <>
                Orders totaling{' '}
                <strong className="text-emerald-900 font-extrabold">
                  {formatCurrency(store.freeShippingThreshold)}
                </strong>{' '}
                or more qualify for <strong>FREE nationwide delivery</strong> to
                any zone — shipping fees are waived automatically at checkout.
                Additionally, select items unlock free delivery when purchased
                in specified bundle quantities.
              </>
            ) : (
              <>
                Standard delivery charges apply based on destination area.
                Selected products unlock free delivery when you buy the
                quantity indicated on their product detail page.
              </>
            )}
          </div>
        </section>

        {/* Section 3: Processing & Dispatch Timeline */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3 sm:space-y-4">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>3. Processing & Dispatch Timeline</span>
          </h2>
          <ul className="space-y-2.5 sm:space-y-3 text-stone-700">
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#A80C14] mt-1.5 shrink-0" />
              <span>
                <strong>Ready-to-Wear Collection:</strong> Abayas, hijab sets,
                and standard garments are dispatched within <strong>24 hours</strong> of
                order confirmation.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#A80C14] mt-1.5 shrink-0" />
              <span>
                <strong>Custom & Embroidered Pieces:</strong> Custom tailored
                or embroidery-heavy garments require up to <strong>48 hours</strong> for
                meticulous quality control before dispatch.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#A80C14] mt-1.5 shrink-0" />
              <span>
                <strong>Phone Confirmation:</strong> Delivery timelines begin
                from the moment our customer service team completes your order
                confirmation phone call.
              </span>
            </li>
          </ul>
        </section>

        {/* Section 4: Payment Methods on Delivery */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3 sm:space-y-4">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-700 shrink-0" />
            <span>4. Payment Methods & Cash on Delivery (COD)</span>
          </h2>
          <div className="space-y-3 text-stone-700">
            <p>
              We offer flexible payment methods for your convenience during
              checkout:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 sm:p-4 bg-stone-50 rounded-xl sm:rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#A80C14] shrink-0" />
                  <span>Cash on Delivery (COD)</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Pay cash directly to the courier rider upon inspecting your parcel at delivery.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 bg-stone-50 rounded-xl sm:rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm">
                  <CreditCard className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>bKash Advance Payment</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Pay in advance using bKash Send Money at checkout and confirm with your Transaction ID.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Banner */}
        <div className="p-5 sm:p-6 bg-stone-50 rounded-2xl sm:rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900">
              Need assistance with shipping or delivery?
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Contact our support team or check your parcel's live status.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
            <a
              href="mailto:support@falakcloset.com"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl transition-colors shadow-2xs break-all"
            >
              <Mail className="w-3.5 h-3.5 text-[#A80C14] shrink-0" /> Support Email
            </a>
            <Link
              href="/track"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 bg-[#A80C14] hover:bg-[#8C0A10] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" /> Track Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
