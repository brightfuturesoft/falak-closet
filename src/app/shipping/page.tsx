import type { Metadata } from 'next';
import { Truck, MapPin, PackageCheck, Clock, BadgeCheck } from 'lucide-react';
import { getActiveZonesSafe } from '@/lib/deliveryZones';
import { getStoreSettingsSafe } from '@/lib/siteSettings';
import { formatCurrency } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Shipping & Express Delivery Policy | Falak Closet',
  description: 'Nationwide delivery rates and speeds across Bangladesh — Inside & Outside Dhaka zone charges, free delivery threshold, and COD options.',
  openGraph: {
    title: 'Shipping & Express Delivery Policy | Falak Closet',
    description: 'Express delivery speeds across Bangladesh with Cash on Delivery options.',
    url: 'https://falakcloset.com/shipping',
    siteName: 'Falak Closet Modest Fashion',
    type: 'website'
  }
};

export default async function ShippingPolicyPage() {
  // Cached, tagged reads — admin zone/setting writes bust them via
  // revalidateTag so this page never quotes stale charges.
  const [zones, store] = await Promise.all([getActiveZonesSafe(), getStoreSettingsSafe()]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Logistics & Express Delivery</span>
        <h1 className="font-serif text-3xl font-bold text-stone-900  mt-1">
          Shipping & Delivery Policy
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Nationwide doorstep delivery across Bangladesh with Cash on Delivery.
        </p>
      </div>

      <div className="prose dark:prose-invert text-xs sm:text-sm text-stone-700  space-y-6 leading-relaxed">
        {/* Zone rates — rendered from the admin-managed Delivery Zones config */}
        <section className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200  space-y-4">
          <h2 className="font-serif font-bold text-base text-amber-600 flex items-center gap-2">
            <Truck className="w-5 h-5" /> 1. Delivery Zones, Charges & Speeds
          </h2>

          {zones.length > 0 ? (
            <div className="space-y-3 not-prose">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#A80C14] shrink-0" />
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="flex items-center gap-1 text-stone-500">
                        <Clock className="w-3.5 h-3.5" /> {zone.etaDays}
                      </span>
                      <span className="px-2.5 py-1 bg-[#FDF2F3] text-[#A80C14] font-bold rounded-lg border border-[#F8D2D5]">
                        {formatCurrency(zone.charge)}
                      </span>
                    </div>
                  </div>

                  {zone.subAreas && zone.subAreas.length > 0 && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      Areas: {' '}
                      {zone.subAreas.map((s, i) => (
                        <span key={s.id}>
                          {s.name}
                          {s.charge !== null && s.charge !== undefined ? ` (${formatCurrency(s.charge)})` : ''}
                          {i < zone.subAreas.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      {zone.subAreas.some((s) => s.charge !== null && s.charge !== undefined) && (
                        <span className="block mt-1 text-[10px] text-stone-400">
                          Areas with their own rate are shown in brackets; the rest follow the zone rate.
                        </span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>
              Delivery charges are set by destination area and shown at checkout before you place your order.
            </p>
          )}
        </section>

        {/* Free delivery threshold — from Store Configuration settings */}
        <section className="space-y-2">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-emerald-600" /> 2. Free Delivery
          </h3>
          <p>
            {store.freeShippingThreshold > 0 && store.freeShippingThreshold < Infinity ? (
              <>
                Orders of <strong>{formatCurrency(store.freeShippingThreshold)}</strong> or more get free
                delivery to any zone — the charge is waived automatically at checkout. Selected products
                also unlock free delivery when you buy the quantity shown on their page.
              </>
            ) : (
              <>
                Standard delivery charges apply based on destination area. Selected products
                unlock free delivery when you buy the quantity shown on their product page.
              </>
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" /> 3. Processing & Dispatch Timeline
          </h3>
          <p>
            Ready-to-wear abayas and hijab sets are dispatched within 24 hours of order
            confirmation. Custom tailored or embroidery-heavy pieces require 48 hours for final
            quality control before dispatch.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-amber-600" /> 4. Payment on Delivery
          </h3>
          <p>
            Cash on Delivery (COD) is available nationwide. You can also pay in advance via the
            bKash Send Money option at checkout and confirm with your Transaction ID.
          </p>
        </section>
      </div>
    </div>
  );
}
