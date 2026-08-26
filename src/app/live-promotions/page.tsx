import React from 'react';
import { Metadata } from 'next';
import LivePromotionsClient from './LivePromotionsClient';
import { getActiveBanners } from '@/lib/promotionBanners';
import { getFlashSaleProducts } from '@/lib/products';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const banners = await getActiveBanners();
  const banner = banners[0];

  if (!banner) {
    return {
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
  }

  return {
    title: `${banner.title} | Falak Closet`,
    description: banner.subtitle || 'Active promotional coupon codes and seasonal offers at Falak Closet.',
    openGraph: {
      title: `${banner.title} | Falak Closet`,
      description: banner.subtitle || 'Active promotional coupon codes and seasonal offers at Falak Closet.',
      url: 'https://falakcloset.com/live-promotions',
      siteName: 'Falak Closet Modest Fashion',
      images: [
        {
          url: banner.bannerImage || 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&h=630&q=80',
          width: 1200,
          height: 630,
          alt: banner.title
        }
      ],
      type: 'website'
    }
  };
}

export default async function LivePromotionsPage() {
  const [banners, flashProducts] = await Promise.all([
    getActiveBanners(),
    getFlashSaleProducts()
  ]);

  const now = new Date();
  const futureBanners = banners.filter(
    (b) => b.isFlashSale && b.flashSaleEndsAt && new Date(b.flashSaleEndsAt) > now
  );
  
  const saleEndsAt = futureBanners.length > 0
    ? futureBanners.reduce((max, b) => {
        const endsAt = new Date(b.flashSaleEndsAt!).getTime();
        return endsAt > max ? endsAt : max;
      }, 0)
    : null;

  const saleEndsAtStr = saleEndsAt ? new Date(saleEndsAt).toISOString() : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SaleEvent',
        '@id': 'https://falakcloset.com/live-promotions#saleevent',
        'name': banners[0]?.title || 'Seasonal Offers at Falak Closet',
        'description': banners[0]?.subtitle || 'Active promotional coupons and flash discounts',
        'url': 'https://falakcloset.com/live-promotions',
        'image': banners[0]?.bannerImage || 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&q=80',
        'startDate': now.toISOString(),
        'endDate': saleEndsAtStr || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        '@type': 'ItemList',
        '@id': 'https://falakcloset.com/live-promotions#itemlist',
        'name': 'Flash Sale Products',
        'numberOfItems': flashProducts.length,
        'itemListElement': flashProducts.map((prod, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'item': {
            '@type': 'Product',
            'name': prod.name,
            'url': `https://falakcloset.com/product/${prod.slug}`,
            'image': prod.images?.[0] || '',
            'offers': {
              '@type': 'Offer',
              'price': prod.price,
              'priceCurrency': 'BDT',
              'availability': prod.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
            }
          }
        }))
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LivePromotionsClient
        banners={banners}
        flashProducts={flashProducts}
        saleEndsAt={saleEndsAtStr}
      />
    </>
  );
}
