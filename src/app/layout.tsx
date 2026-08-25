import type { Metadata } from 'next';
import { Playfair_Display, Inter, Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import { ToastProvider } from '@/components/ui/Toast';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { MobileBottomNav } from '@/components/header/MobileBottomNav';
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/schema';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap'
});

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap'
});

const hindSiliguri = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-bengali',
  subsets: ['bengali', 'latin'],
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://falakcloset.com'),
  title: {
    default: 'Falak Closet | Premium Modest Fashion, Abayas & Hijabs (৳ BDT)',
    template: '%s | Falak Closet'
  },
  description: 'Discover handcrafted abayas, luxury hijabs, designer kaftans, borkha, and haute couture modest fashion in Bangladesh. Fast nationwide delivery.',
  keywords: [
    'Falak Closet',
    'Modest Fashion Bangladesh',
    'Abayas BD',
    'Luxury Hijabs',
    'Designer Kaftans',
    'Borkha Shop Dhaka',
    'Islamic Wear Bangladesh',
    'Modest Clothing Dhaka'
  ],
  authors: [{ name: 'Falak Closet' }],
  creator: 'Falak Closet',
  publisher: 'Falak Closet Modest Fashion',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: 'https://falakcloset.com'
  },
  openGraph: {
    title: 'Falak Closet | Premium Modest Fashion, Abayas & Hijabs',
    description: 'Explore handcrafted abayas, luxury hijabs, kaftans, and modest fashion creations. Fast delivery across Bangladesh.',
    url: 'https://falakcloset.com',
    siteName: 'Falak Closet',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'Falak Closet Haute Couture Collection'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Falak Closet | Premium Modest Fashion',
    description: 'Handcrafted abayas, luxury hijabs, and modest fashion creations in Bangladesh.',
    images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80']
  },
  icons: {
    icon: [
      { url: '/transparent_logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/transparent_logo.png', sizes: '192x192', type: 'image/png' }
    ],
    shortcut: '/transparent_logo.png',
    apple: '/transparent_logo.png'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${hindSiliguri.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Kalpurush&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className="bg-[#FAFAFA] text-stone-900 antialiased selection:bg-[#D92670] selection:text-white">
        <FacebookPixel />
        <AnalyticsProvider>
          <ToastProvider>
            <CartProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <MobileBottomNav />
              </div>
            </CartProvider>
          </ToastProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
