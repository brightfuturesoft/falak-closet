import React from 'react';
import { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Express Secure Checkout | Falak Closet',
  description: 'Complete your order with Cash on Delivery (COD), bKash, or Mobile Banking. Fast nationwide delivery across Bangladesh.',
  openGraph: {
    title: 'Express Checkout | Falak Closet Modest Fashion',
    description: 'Fast, secure order completion with Cash on Delivery and bKash across Bangladesh.',
    url: 'https://falakcloset.com/checkout',
    siteName: 'Falak Closet Modest Fashion',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'Express Checkout'
      }
    ],
    type: 'website'
  }
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
