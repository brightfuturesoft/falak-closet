import React from 'react';
import type { Metadata } from 'next';
import {
  ShieldCheck,
  PhoneCall,
  Truck,
  RotateCcw,
  Palette,
  Scale,
  HelpCircle,
  Mail,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Order Conditions | Falak Closet',
  description:
    'Falak Closet terms of service, customer purchasing agreements, order policies, and delivery terms in Bangladesh.',
  openGraph: {
    title: 'Terms & Order Conditions | Falak Closet Modest Fashion',
    description:
      'Understand customer rights, order fulfillment terms, and purchasing agreements.',
    url: 'https://falakcloset.com/terms',
    siteName: 'Falak Closet Modest Fashion',
    type: 'website',
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 font-sans text-stone-900">
      {/* ── Page Header ── */}
      <div className="p-5 sm:p-8 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-[#FDF2F3] text-[#A80C14] border border-[#F8D2D5] text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" /> Customer Agreement
          </span>
          <span className="text-xs text-stone-400 font-mono">
            Official Terms & Conditions
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight break-words">
          Terms & Order Conditions
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
          Welcome to Falak Closet. Please review our purchasing guidelines, order confirmation terms, and delivery policies below before placing your order.
        </p>
      </div>

      {/* ── Terms Content Sections ── */}
      <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
        {/* Section 1: Order Confirmation & Fixed Pricing */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>1. Order Placement & Confirmation Terms</span>
          </h2>
          <ul className="space-y-2.5 text-stone-700">
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>
                <strong>Order Details:</strong> Customers must provide valid Recipient Name, Contact Phone Number, and Full Delivery Address to confirm an order.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>
                <strong>Fixed Prices:</strong> All product prices displayed on Falak Closet are fixed in Bangladeshi Taka (BDT ৳).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>
                <strong>Confirmation Call:</strong> A phone confirmation call will be placed by our team. Parcels are dispatched only after receiving call confirmation.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>
                <strong>No Post-Confirmation Cancellations:</strong> Once an order is confirmed over the phone call, it cannot be cancelled or modified.
              </span>
            </li>
          </ul>
        </section>

        {/* Section 2: Cash on Delivery (COD) Rules */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>2. Cash on Delivery (COD) Conditions</span>
          </h2>
          <div className="p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl sm:rounded-2xl text-emerald-950 font-medium leading-relaxed">
            Cash on Delivery (COD) is eligible for customers maintaining an <strong>80% or higher successful delivery history</strong>. If your past delivery success record is under 80%, an advance payment of the delivery fee is required prior to shipping.
          </div>
        </section>

        {/* Section 3: Delivery Charges & Timelines */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>3. Delivery Rates & Timelines</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 font-mono text-center">
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl">
              <span className="block text-[11px] text-stone-500 font-sans font-semibold">Inside Dhaka</span>
              <span className="block font-black text-sm text-[#A80C14] mt-0.5">৳ 80</span>
            </div>
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl">
              <span className="block text-[11px] text-stone-500 font-sans font-semibold">Dhaka Adjacent Areas</span>
              <span className="block font-black text-sm text-[#A80C14] mt-0.5">৳ 100</span>
            </div>
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl">
              <span className="block text-[11px] text-stone-500 font-sans font-semibold">Outside Dhaka</span>
              <span className="block font-black text-sm text-[#A80C14] mt-0.5">৳ 150</span>
            </div>
          </div>
          <p className="text-xs text-stone-600">
            Parcels are delivered within <strong>2 to 3 business days</strong> following phone call confirmation.
          </p>
        </section>

        {/* Section 4: Parcel Checking & Return Terms */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
            <span>4. Doorstep Parcel Inspection & Returns</span>
          </h2>
          <ul className="space-y-2 text-stone-700">
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>Please inspect your parcel in front of the courier delivery rider upon arrival.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>To return a parcel upon inspection, return the full parcel to the rider with the delivery fee paid.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>No partial delivery is permitted (accepting only 1 item out of a multi-item package).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>Once the parcel is accepted and received from the delivery rider, returns are not accepted.</span>
            </li>
          </ul>
        </section>

        {/* Section 5: Color Disclaimer */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-700 shrink-0" />
            <span>5. Garment Color & Display Disclaimer</span>
          </h2>
          <div className="p-3.5 sm:p-4 bg-purple-50/70 border border-purple-200 rounded-xl sm:rounded-2xl text-purple-950 font-medium leading-relaxed">
            Due to differences in camera lighting, photography setups, and smartphone/monitor display settings, actual garment color shades or depth may vary slightly from online product photos.
          </div>
        </section>

        {/* Section 6: Copyright & Governing Law */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>6. Intellectual Property & Governing Law</span>
          </h2>
          <p className="text-stone-600">
            All photography, garment designs, brand names, and website media are protected under copyright laws. These terms are governed by the laws of the People&apos;s Republic of Bangladesh, with exclusive jurisdiction in the courts of Dhaka.
          </p>
        </section>

        {/* Support Banner */}
        <div className="p-5 sm:p-6 bg-stone-50 rounded-2xl sm:rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-white border border-stone-200 rounded-2xl text-[#A80C14] shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900">Questions about our Terms?</h4>
              <p className="text-xs text-stone-500 mt-0.5 break-all">Contact our support team at support@falakcloset.com.</p>
            </div>
          </div>
          <div className="shrink-0">
            <a
              href="mailto:support@falakcloset.com"
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-[#A80C14] shrink-0" /> Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
