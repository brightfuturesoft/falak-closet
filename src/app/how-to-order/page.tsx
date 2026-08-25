import React from 'react';
import { Metadata } from 'next';
import HowToOrderClient from './HowToOrderClient';

export const metadata: Metadata = {
  title: 'How to Order & Customer Service FAQ | Falak Closet',
  description: 'Step-by-step shopping guide for placing orders, sizing recommendations, payment options, and delivery FAQs.',
  openGraph: {
    title: 'How to Order & FAQ | Falak Closet Modest Fashion',
    description: 'Shopping guide, sizing chart advice, and ordering FAQs for Falak Closet.',
    url: 'https://falakcloset.com/how-to-order',
    siteName: 'Falak Closet Modest Fashion',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'How to Order'
      }
    ],
    type: 'website'
  }
};

export default function HowToOrderPage() {
  return <HowToOrderClient />;
}
