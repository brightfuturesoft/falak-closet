import React from 'react';
import { Metadata } from 'next';
import CartClient from './CartClient';

export const metadata: Metadata = {
  title: 'Shopping Cart & Checkout Summary | Falak Closet',
  description: 'Review your selected haute couture modest fashion items, apply promotional vouchers, and calculate express shipping fees in Bangladesh.',
  openGraph: {
    title: 'Shopping Cart | Falak Closet Modest Fashion',
    description: 'Review your selected items and proceed to express checkout with Cash on Delivery across Bangladesh.',
    url: 'https://falakcloset.com/cart',
    siteName: 'Falak Closet Modest Fashion',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'Shopping Cart'
      }
    ],
    type: 'website'
  }
};

export default function CartPage() {
  return <CartClient />;
}
