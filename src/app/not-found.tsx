import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Compass, ShoppingBag } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-xl w-full text-center animate-fade-in">
        {/* 404 mark */}
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
          {/* <Compass className="w-8 h-8 text-amber-6  00" /> */}
          <Logo variant='transparent' size='xl' />
        </div>

        <p className="text-xs font-bold  uppercase tracking-wider">
          Page Not Found
        </p>

        <h1 className="font-serif text-6xl sm:text-7xl font-bold  mt-2">
          404
        </h1>

        <h2 className="font-serif text-2xl font-bold  mt-3">
          This page has slipped away
        </h2>

        <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
          The page you are looking for doesn&apos;t exist or may have been moved.
          Let&apos;s guide you back to our elegant collection.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-900  text-white  text-sm font-semibold hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-stone-300  text-stone-800  text-sm font-semibold hover:border-amber-500  hover:text-amber-600 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Helpful links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 pt-6 border-t border-stone-200  text-xs text-stone-500 ">
          <span className="font-semibold text-stone-700 ">Popular:</span>
          <Link href="/shop" className="hover:text-amber-600 transition-colors">
            Shop
          </Link>
          <Link href="/track" className="hover:text-amber-600 transition-colors">
            Track Order
          </Link>
          <Link href="/how-to-order" className="hover:text-amber-600 transition-colors">
            How to Order
          </Link>
          <Link href="/returns" className="hover:text-amber-600 transition-colors">
            Returns
          </Link>
        </div>
      </div>
    </div>
  );
}
