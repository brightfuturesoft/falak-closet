import type { Metadata } from 'next';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Security | Falak Closet',
  description: 'How Falak Closet protects customer data, order details, payment transactions, and user privacy.',
  openGraph: {
    title: 'Privacy Policy | Falak Closet Modest Fashion',
    description: 'Our commitments to protecting your personal information and transaction security.',
    url: 'https://falakcloset.com/privacy',
    siteName: 'Falak Closet Modest Fashion',
    type: 'website'
  }
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Security & Trust</span>
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
          Privacy Policy
        </h1>
        <p className="text-xs text-stone-500 mt-1">Last updated: August 2026</p>
      </div>

      <div className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 space-y-6 leading-relaxed">
        <section className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
          <h2 className="font-serif font-bold text-base text-amber-600 flex items-center gap-2">
            <Lock className="w-5 h-5" /> Data Protection & Encryption
          </h2>
          <p>
            At Falak Closet, we treat customer data privacy with highest reverence. All transactions are encrypted via 256-Bit SSL protocols.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-stone-900 dark:text-stone-100">Information We Collect</h3>
          <p>
            We collect shipping addresses, email addresses, and phone numbers strictly for order fulfillment, logistics delivery, and customer service updates. We do not sell or rent customer data to third-party advertisers.
          </p>
        </section>
      </div>
    </div>
  );
}
