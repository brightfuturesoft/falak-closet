import React from 'react';
import { Metadata } from 'next';
import LivePromotionsClient from './LivePromotionsClient';

export const metadata: Metadata = {
  title: 'Live Discount Offers & Flash Vouchers | Falak Closet',
  description: 'Active promotional coupon codes, flash sale discounts, and seasonal offers at Falak Closet.',
  openGraph: {
    title: 'Live Promotional Vouchers & Flash Sale Offers | Falak Closet',
    description: 'Save instantly on handcrafted abayas, luxury hijabs, and kaftans with active promo codes.',
    url: 'https://falakcloset.com/live-promotions',
    siteName: 'Falak Closet Modest Fashion',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'Live Promotions'
      }
    ],
    type: 'website'
  }
};

export default function LivePromotionsPage() {
  return <LivePromotionsClient />;
}
