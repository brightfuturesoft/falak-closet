import type { Metadata } from 'next';
import { RotateCcw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Returns & Exchange Policy | Falak Closet',
  description: 'Hassle-free 30-day returns and exchanges policy for handcrafted modest fashion creations at Falak Closet.',
  openGraph: {
    title: 'Returns & Exchange Policy | Falak Closet',
    description: 'Learn about our 30-day hassle-free returns and quality guarantee.',
    url: 'https://falakcloset.com/returns',
    siteName: 'Falak Closet Modest Fashion',
    type: 'website'
  }
};

export default function ReturnsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Hassle-Free Guarantee</span>
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
          Returns & Refund Policy
        </h1>
        <p className="text-xs text-stone-500 mt-1">Last updated: August 2026</p>
      </div>

      <div className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 space-y-6 leading-relaxed">
        <section className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
          <h2 className="font-serif font-bold text-base text-amber-600 flex items-center gap-2">
            <RotateCcw className="w-5 h-5" /> 30-Day Money-Back Guarantee
          </h2>
          <p>
            We want you to feel completely confident and elegant in your Falak Closet outfits. If an item does not fit as expected or you wish to exchange colors, you may return it within 30 days of delivery.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-stone-900 dark:text-stone-100">Return Eligibility Requirements:</h3>
          <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400">
            <li>Garments must be unworn, unwashed, and undamaged.</li>
            <li>Original security seals and brand tags must remain attached.</li>
            <li>Hijab accessories and pins must be returned in original packaging box.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-stone-900 dark:text-stone-100">How to Initiate a Return</h3>
          <p>
            Contact our 24/7 Concierge at support@falakcloset.com with your Order Reference ID (e.g. FLK-98421). Our team will issue a pre-paid return label.
          </p>
        </section>
      </div>
    </div>
  );
}
