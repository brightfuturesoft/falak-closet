import type { Metadata } from 'next';
import Link from 'next/link';
import {
  RotateCcw,
  ShieldCheck,
  Truck,
  Clock,
  CheckCircle2,
  FileText,
  Mail,
  PhoneCall,
  Palette,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Returns & Parcel Policy | Falak Closet',
  description:
    'Official Falak Closet return policy, doorstep parcel inspection guidelines, and delivery terms in Bangladesh.',
  openGraph: {
    title: 'Returns & Parcel Policy | Falak Closet',
    description:
      'Official Falak Closet return policy, doorstep parcel inspection guidelines, and delivery terms.',
    url: 'https://falakcloset.com/returns',
    siteName: 'Falak Closet Modest Fashion',
    type: 'website',
  },
};

export default function ReturnsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 font-sans text-stone-900">
      {/* ── Page Header ── */}
      <div className="p-5 sm:p-8 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-[#FDF2F3] text-[#A80C14] border border-[#F8D2D5] text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0">
            <RotateCcw className="w-3.5 h-3.5" /> Official Parcel Policy
          </span>
          <span className="text-xs text-stone-400 font-mono">Falak Closet Policy</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight break-words">
          Returns & Parcel Checking Policy
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
          Please review our doorstep delivery, parcel checking, and return guidelines below.
        </p>
      </div>

      {/* ── Key Highlights Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">Doorstep Inspection</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Please check your parcel in front of the courier delivery rider upon arrival.
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[#FDF2F3] text-[#A80C14] border border-[#F8D2D5] flex items-center justify-center">
            <Truck className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">Full Parcel Returns</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            If returning, hand back the complete parcel to the rider with the delivery fee paid.
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">2–3 Days Delivery</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Parcels are delivered within 2 to 3 days following phone call confirmation.
          </p>
        </div>
      </div>

      {/* ── Official Policy Terms Content ── */}
      <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
        {/* Section 1: Parcel Checking Rules */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3 sm:space-y-4">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>1. Doorstep Inspection & Parcel Return Rules</span>
          </h2>
          <ul className="space-y-2.5 sm:space-y-3 text-stone-700">
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#A80C14] mt-1.5 shrink-0" />
              <span>
                <strong>Inspect in Front of Delivery Rider:</strong> Customers are required to check the contents of their parcel in front of the courier delivery rider at the time of delivery.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#A80C14] mt-1.5 shrink-0" />
              <span>
                <strong>Full Parcel Return:</strong> If you choose to return the parcel upon inspection, the entire parcel must be handed back to the rider along with payment for the delivery fee.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#A80C14] mt-1.5 shrink-0" />
              <span>
                <strong>No Partial Deliveries:</strong> We do not offer partial delivery (e.g. keeping only 1 item and returning the remainder from a multi-item package).
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#A80C14] mt-1.5 shrink-0" />
              <span>
                <strong>Post-Acceptance Policy:</strong> Once the parcel has been accepted and received from the delivery rider, returns are no longer accepted from our page.
              </span>
            </li>
          </ul>
        </section>

        {/* Section 2: Cash on Delivery Terms */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3 sm:space-y-4">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>2. Cash on Delivery (COD) Eligibility</span>
          </h2>
          <div className="p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl sm:rounded-2xl text-emerald-950 font-medium leading-relaxed">
            Cash on Delivery is available for customers with a successful delivery history of <strong>80% or higher</strong>. If your past successful delivery record is below 80%, an advance payment of the delivery fee is required prior to order dispatch.
          </div>
        </section>

        {/* Section 3: Delivery Charges & Timelines */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3 sm:space-y-4">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>3. Standard Delivery Fees & Timelines</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 font-mono">
            <div className="p-3.5 sm:p-4 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl text-center space-y-1">
              <span className="block text-[11px] text-stone-500 font-sans font-semibold">Inside Dhaka</span>
              <span className="block font-black text-base text-[#A80C14]">৳ 80</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl text-center space-y-1">
              <span className="block text-[11px] text-stone-500 font-sans font-semibold">Dhaka Adjacent Areas</span>
              <span className="block font-black text-base text-[#A80C14]">৳ 100</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl text-center space-y-1">
              <span className="block text-[11px] text-stone-500 font-sans font-semibold">Outside Dhaka</span>
              <span className="block font-black text-base text-[#A80C14]">৳ 150</span>
            </div>
          </div>
          <p className="text-xs text-stone-600">
            Parcels are delivered within <strong>2 to 3 business days</strong> following phone call confirmation from our team.
          </p>
        </section>

        {/* Section 4: Color Disclaimer */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-700 shrink-0" />
            <span>4. Garment Color & Display Disclaimer</span>
          </h2>
          <div className="p-3.5 sm:p-4 bg-purple-50/70 border border-purple-200 rounded-xl sm:rounded-2xl text-purple-950 font-medium leading-relaxed">
            Due to differences in camera lighting, studio photography, and individual mobile or monitor screen resolutions, garment colors may appear slightly lighter or darker than the actual product.
          </div>
        </section>

        {/* Section 5: Order Confirmation Call */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>5. Order Confirmation & Cancellation Policy</span>
          </h2>
          <ul className="space-y-2 text-stone-700">
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>All product prices on Falak Closet are fixed.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>Our team will place a phone confirmation call to verify your order details before dispatching the parcel.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#A80C14] font-bold">•</span>
              <span>Once an order is confirmed over the phone call, it cannot be cancelled or modified.</span>
            </li>
          </ul>
        </section>

        {/* Support Banner */}
        <div className="p-5 sm:p-6 bg-stone-50 rounded-2xl sm:rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900">Have questions about your order or parcel?</h4>
            <p className="text-xs text-stone-500 mt-0.5">Contact our customer helpline or track your order status live.</p>
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
