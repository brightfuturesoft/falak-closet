import { Product } from '@/data/products';

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Falak Closet',
    url: 'https://falakcloset.com',
    logo: 'https://falakcloset.com/logo.png',
    description: 'Premier modest fashion couture brand featuring handcrafted abayas, luxury kaftans, silk hijabs & modest ensembles.',
    sameAs: [
      'https://instagram.com/falakcloset',
      'https://facebook.com/falakcloset',
      'https://pinterest.com/falakcloset'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-800-555-FLK',
      contactType: 'customer service',
      areaServed: 'Worldwide',
      availableLanguage: ['English', 'Arabic', 'Urdu']
    }
  };
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Falak Closet',
    url: 'https://falakcloset.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://falakcloset.com/shop?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
}

export function getProductSchema(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product?.name,
    image: product?.images,
    description: product?.description,
    sku: product?.id,
    brand: {
      '@type': 'Brand',
      name: 'Falak Closet'
    },
    offers: {
      '@type': 'Offer',
      url: `https://falakcloset.com/product/${product?.slug}`,
      priceCurrency: 'USD',
      price: product?.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product?.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Falak Closet'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product?.rating,
      reviewCount: product?.reviewCount || 1
    }
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://falakcloset.com${item.url}`
    }))
  };
}

export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}
