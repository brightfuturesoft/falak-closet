import { Product } from '@/data/products';
import type { SiteIdentity } from '@/lib/siteSettings';

/** Turn "@handle" / digits into a full https URL, else pass through. */
function socialUrl(value: string | undefined, base: string): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('@')) return `${base}/${v.slice(1)}`;
  return `${base}/${v}`;
}

export function getOrganizationSchema(identity?: SiteIdentity) {
  const sameAs = [
    socialUrl(identity?.instagram, 'https://instagram.com'),
    socialUrl(identity?.facebook, 'https://facebook.com'),
    socialUrl(identity?.youtube, 'https://youtube.com'),
  ].filter((v): v is string => Boolean(v));

  // No phone configured → no contactPoint at all. The old hardcoded
  // "+1-800-555-FLK" told crawlers (and customers) to call a number that
  // never existed.
  const phone = identity?.contactPhone?.trim();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Falak Closet',
    url: 'https://falakcloset.com',
    logo: 'https://falakcloset.com/logo-512.png',
    description: 'Premier modest fashion couture brand featuring handcrafted abayas, luxury kaftans, silk hijabs & modest ensembles.',
    ...(identity?.contactEmail ? { email: identity.contactEmail } : {}),
    ...(identity?.address ? { address: identity.address } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(phone
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: phone,
            contactType: 'customer service',
            areaServed: 'BD',
            availableLanguage: ['Bangla', 'English'],
          },
        }
      : {}),
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
      // The store charges in Bangladeshi Taka everywhere (formatCurrency) —
      // schema.org feeds said USD before, contradicting every page.
      priceCurrency: 'BDT',
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
