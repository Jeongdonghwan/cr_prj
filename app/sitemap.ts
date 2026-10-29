import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/site';
import { OPEN_PAGES, pageEncodedPath, inSitemap } from '../lib/data';
import { getPosts, postEncodedPath } from '../lib/blog';

// 빌드 시 out/sitemap.xml — 오픈된 단계(OPEN_WAVE)의 페이지만 포함
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/area/`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/blog/`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    ...getPosts().map((p) => ({ url: `${SITE_URL}${postEncodedPath(p)}`, lastModified: p.publishedAt ? new Date(p.publishedAt) : now, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...OPEN_PAGES.filter(inSitemap).map((p) => ({
      url: `${SITE_URL}${pageEncodedPath(p)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: p.level === '시군구' ? 0.8 : p.level === '별칭·생활권' ? 0.7 : 0.6,
    })),
  ];
}
