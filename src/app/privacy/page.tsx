import type { Metadata } from 'next';
import {
  Lock,
  ShieldCheck,
  Database,
  Eye,
  Server,
  Cookie,
  Mail,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Security | Falak Closet',
  description:
    'How Falak Closet protects customer data, order information, payment transactions, and user privacy.',
  openGraph: {
    title: 'Privacy Policy | Falak Closet Modest Fashion',
    description:
      'Our commitments to protecting your personal information and transaction security.',
    url: 'https://falakcloset.com/privacy',
    siteName: 'Falak Closet Modest Fashion',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 font-sans text-stone-900">
      {/* ── Page Header ── */}
      <div className="p-5 sm:p-8 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-[#FDF2F3] text-[#A80C14] border border-[#F8D2D5] text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0">
            <Lock className="w-3.5 h-3.5" /> 256-Bit Encryption
          </span>
          <span className="text-xs text-stone-400 font-mono">Last updated: August 2026</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight break-words">
          Privacy Policy & Data Protection
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
          At Falak Closet, we respect your privacy and handle your personal data with utmost security. This Privacy Policy details how we collect, safeguard, and use your information when shopping with us.
        </p>
      </div>

      {/* ── Security Commitments Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">Zero Data Selling</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            We never sell, rent, or trade your personal information to third-party advertisers.
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
            <Server className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">SSL Encrypted Checkout</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            All order details and transactions are secured using 256-Bit SSL encryption protocols.
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#A80C14] border border-rose-200 flex items-center justify-center">
            <Database className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">Strict Data Access</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Only authorized logistics and support personnel can view fulfillment details.
          </p>
        </div>
      </div>

      {/* ── Policy Sections ── */}
      <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
        {/* Section 1 */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>1. Information We Collect</span>
          </h2>
          <p>
            When you interact with falakcloset.com or place an order, we collect information required to complete your purchase:
          </p>
          <ul className="space-y-2 text-stone-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A80C14] mt-2 shrink-0" />
              <span>
                <strong>Fulfillment Details:</strong> Full name, delivery address, phone number, and email address for order confirmation and courier dispatch.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A80C14] mt-2 shrink-0" />
              <span>
                <strong>Transaction Reference Data:</strong> bKash sender phone numbers and Transaction IDs (TrxID) for manual payment verification. We do not store financial passwords or PINs.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A80C14] mt-2 shrink-0" />
              <span>
                <strong>Technical Usage Data:</strong> Anonymized IP addresses, device browser type, and site navigation activity to optimize page load speeds.
              </span>
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>2. How We Use Your Information</span>
          </h2>
          <p>
            We process your personal information strictly for legitimate operational purposes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <p className="font-bold text-stone-900">Order Delivery</p>
              <p className="text-stone-500 mt-0.5">Sharing address & phone with courier partners (Pathao/Steadfast) for doorstep delivery.</p>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <p className="font-bold text-stone-900">Customer Support</p>
              <p className="text-stone-500 mt-0.5">Sending SMS / WhatsApp tracking updates and responding to support inquiries.</p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <Cookie className="w-5 h-5 text-[#A80C14] shrink-0" />
            <span>3. Cookies & Session Storage</span>
          </h2>
          <p>
            Our website uses cookies and browser local storage to maintain your shopping cart items, remember signed-in sessions, and keep track of recent product browsing. You can disable cookies in your browser settings, though certain cart features may require cookies to function smoothly.
          </p>
        </section>

        {/* Section 4 */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900">
            4. Third-Party Services
          </h2>
          <p className="text-stone-600">
            We partner with trusted service providers — including courier delivery networks, Cloudinary image hosting, and Vercel Analytics. These partners are granted access only to the minimal data required to perform their specific services and are bound by strict confidentiality agreements.
          </p>
        </section>

        {/* Section 5 */}
        <section className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-900">
            5. Your Data Protection Rights
          </h2>
          <p className="text-stone-600">
            You have the right to request access to the personal data we hold about you, request corrections to inaccurate information, or ask for the deletion of your account history.
          </p>
        </section>

        {/* Privacy Contact Footer */}
        <div className="p-5 sm:p-6 bg-stone-50 rounded-2xl sm:rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900">Have questions about your privacy?</h4>
            <p className="text-xs text-stone-500 mt-0.5">Reach out to our Data Privacy Officer anytime.</p>
          </div>
          <div className="shrink-0">
            <a
              href="mailto:privacy@falakcloset.com"
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl transition-colors shadow-2xs break-all"
            >
              <Mail className="w-3.5 h-3.5 text-[#A80C14] shrink-0" /> Email Privacy Officer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
