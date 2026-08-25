import React from 'react';
import { Metadata } from 'next';
import AccountClient from './AccountClient';

export const metadata: Metadata = {
  title: 'My Account & Order History | Falak Closet',
  description: 'Manage your client profile, track active shipments, review order receipts, and update shipping addresses.',
  openGraph: {
    title: 'Client Account Portal | Falak Closet Modest Fashion',
    description: 'Track orders, manage saved items, and review purchase history at Falak Closet.',
    url: 'https://falakcloset.com/account',
    siteName: 'Falak Closet Modest Fashion',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'Client Portal'
      }
    ],
    type: 'website'
  }
};

export default function AccountPage() {
  return <AccountClient />;
}
