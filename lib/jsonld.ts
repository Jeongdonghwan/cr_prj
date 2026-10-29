import { SITE_URL, SITE_NAME, BRAND, CONTACT, BUSINESS } from './site';

export const businessJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#business`,
  name: BRAND,
  url: `${SITE_URL}/`,
  image: `${SITE_URL}/images/fleet-yard.webp`,
  telephone: CONTACT.phone,
  address: { '@type': 'PostalAddress', addressCountry: 'KR', streetAddress: BUSINESS.address },
  areaServed: ['경기북부', '서울 서부', '인천', '부천'],
});

export const webSiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  inLanguage: 'ko',
  publisher: { '@id': `${SITE_URL}/#business` },
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
});

export const faqJsonLd = (faqs: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const serviceJsonLd = (o: { name: string; description: string; path: string; area: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: o.name,
  description: o.description,
  url: `${SITE_URL}${o.path}`,
  areaServed: { '@type': 'Place', name: o.area },
  provider: { '@id': `${SITE_URL}/#business` },
});

// 캐러셀용 목록. path 는 인코딩된 경로(/%EA%B9%80.../)
export const itemListJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}${it.path}`, name: it.name })),
});

// 블로그 글. path 는 인코딩된 경로
export const articleJsonLd = (o: { title: string; description: string; path: string; image: string; date: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: o.title,
  description: o.description,
  image: o.image,
  datePublished: o.date,
  dateModified: o.date,
  inLanguage: 'ko',
  mainEntityOfPage: `${SITE_URL}${o.path}`,
  author: { '@id': `${SITE_URL}/#business` },
  publisher: { '@id': `${SITE_URL}/#business` },
});
