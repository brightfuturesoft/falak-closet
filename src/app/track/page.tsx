import React from 'react';
import { Metadata } from 'next';
import TrackClient from './TrackClient';

// Dynamic Open Graph & Metadata Generator for Order Tracking Page
export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const id = typeof resolvedSearchParams.id === 'string' ? resolvedSearchParams.id : undefined;

  const title = id
    ? `Order #${id} Details & Receipt | Falak Closet`
    : 'Track Order & Logistics Status | Falak Closet';

  const description = id
    ? `Real-time logistics tracking milestone, items list, and invoice receipt for Order #${id} at Falak Closet.`
    : 'Track your Falak Closet order shipment status in real-time across Bangladesh.';

  const canonicalUrl = `https://falakcloset.com/track${id ? `?id=${encodeURIComponent(id)}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Falak Closet Modest Fashion',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80',
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80']
    }
  };
}

export default function TrackPage() {
  return <TrackClient />;
}
