import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service & Conditions | Falak Closet',
  description: 'Falak Closet terms of service, customer agreements, purchasing guidelines, and site usage policies.',
  openGraph: {
    title: 'Terms of Service | Falak Closet Modest Fashion',
    description: 'Understand customer rights, order fulfillment terms, and purchasing agreements.',
    url: 'https://falakcloset.com/terms',
    siteName: 'Falak Closet Modest Fashion',
    type: 'website'
  }
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Terms of Service</span>
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
          Terms & Conditions
        </h1>
        <p className="text-xs text-stone-500 mt-1">Last updated: August 2026</p>
      </div>

      <div className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 space-y-6 leading-relaxed">
        <section className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
          <h2 className="font-serif font-bold text-base text-amber-600">
            Terms of Use & Agreement
          </h2>
          <p>
            By accessing and purchasing from Falak Closet (falakcloset.com), you agree to be bound by these terms. All designs, photography, and brand media are protected under copyright laws.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-stone-900 dark:text-stone-100">Product Authenticity & Colors</h3>
          <p>
            We take extreme care to display accurate garment colors and fabric textures. Minor color variations may occur depending on screen calibration.
          </p>
        </section>
      </div>
    </div>
  );
}
