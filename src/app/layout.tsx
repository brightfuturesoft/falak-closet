import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { Suspense } from 'react';
import TopProgressBar from '@/components/ui/TopProgressBar';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import { ToastProvider } from '@/components/ui/Toast';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { MobileBottomNav } from '@/components/header/MobileBottomNav';
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/schema';
import { getSiteIdentitySafe, getAnnouncementSafe } from '@/lib/siteSettings';
import { AnnouncementBar } from '@/components/header/AnnouncementBar';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';
import { getProductsSafe } from '@/lib/products';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
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
  }
  // Favicon/app icons come from the file conventions (src/app/icon.png,
  // apple-icon.png, favicon.ico) — all freshly optimized. The previous
  // `icons` metadata pointed every variant at the 199KB /logo.png.
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Admin-configured contact identity (Settings → Site Identity) feeds both
  // the Organization JSON-LD and the Footer — one source, cached & tagged.
  const siteIdentity = await getSiteIdentitySafe();
  const announcement = await getAnnouncementSafe();
  const orgSchema = getOrganizationSchema(siteIdentity);
  const webSiteSchema = getWebSiteSchema();

  // Read the catalog here rather than in each page: the Header search and the
  // cart both need it, so seeding the provider once means every route ships
  // products in its initial HTML instead of fetching them after hydration.
  // The read is `unstable_cache`d and tagged, so this is one shared query.
  const { products, error: productsError } = await getProductsSafe();

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        {/* Product imagery is served straight from Cloudinary's CDN —
            warming that connection shaves time off the LCP hero image. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
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
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <FacebookPixel />
        <AnalyticsProvider>
          <ToastProvider>
            <CartProvider initialProducts={products} initialProductsError={productsError}>
              <div className="flex flex-col min-h-screen">
                <AnnouncementBar announcement={announcement} />
                <Header />
                <main className="flex-1">{children}</main>
                <Footer identity={siteIdentity} />
                <MobileBottomNav />
              </div>
            </CartProvider>
          </ToastProvider>
        </AnalyticsProvider>

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
