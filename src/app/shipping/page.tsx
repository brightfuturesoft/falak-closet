import type { Metadata } from 'next';
import { Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Express Delivery Policy | Falak Closet',
  description: 'Nationwide shipping rates, delivery speeds, express logistics in Dhaka and all 64 districts of Bangladesh.',
  openGraph: {
    title: 'Shipping & Express Delivery Policy | Falak Closet',
    description: 'Express shipping speeds across Bangladesh with Cash on Delivery options.',
    url: 'https://falakcloset.com/shipping',
    siteName: 'Falak Closet Modest Fashion',
    type: 'website'
  }
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Logistics & Express Delivery</span>
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
          Shipping & Delivery Policy
        </h1>
        <p className="text-xs text-stone-500 mt-1">Last updated: August 2026</p>
      </div>

      <div className="prose dark:prose-invert text-xs sm:text-sm text-stone-700 dark:text-stone-300 space-y-6 leading-relaxed">
        <section className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
          <h2 className="font-serif font-bold text-base text-amber-600 flex items-center gap-2">
            <Truck className="w-5 h-5" /> 1. Worldwide Shipping Rates & Speeds
          </h2>
          <p>
            Falak Closet ships modest haute couture directly to customers across North America, Europe, the Middle East, Asia, and Australasia via DHL Express and FedEx Courier.
          </p>
          <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400">
            <li><strong>Standard Express Shipping:</strong> 3-5 Business Days ($15.00 flat rate or FREE for orders over $100).</li>
            <li><strong>VIP Priority Overnight:</strong> 1-2 Business Days ($25.00 flat rate).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-stone-900 dark:text-stone-100">2. Processing & Dispatch Timeline</h3>
          <p>
            Ready-to-wear abayas and hijab sets are dispatched within 24 hours of payment verification. Custom tailored or embroidery-heavy pieces require 48 hours for final quality control before dispatch.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-stone-900 dark:text-stone-100">3. Customs & Import Duties</h3>
          <p>
            International shipments may be subject to local import taxes and duties depending on the destination country. Falak Closet covers pre-paid duties for US and GCC orders.
          </p>
        </section>
      </div>
    </div>
  );
}
