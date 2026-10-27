// out/rss.xml — 네이버 서치어드바이저 제출용. 오픈된 단계(OPEN_WAVE)의 대표 페이지만
import { SITE_URL, SITE_NAME } from '../../lib/site';
import { OPEN_PAGES, pageEncodedPath, inSitemap } from '../../lib/data';
import { compose } from '../../lib/compose';

export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const date = new Date().toUTCString();
  const items = OPEN_PAGES.filter(inSitemap).map((p) => {
    const c = compose(p);
    const link = `${SITE_URL}${pageEncodedPath(p)}`;
    return `<item><title>${esc(c.title)}</title><link>${link}</link><description>${esc(c.description)}</description><pubDate>${date}</pubDate><guid isPermaLink="true">${link}</guid></item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${esc(SITE_NAME)}</title><link>${SITE_URL}/</link><description>파주 차고지의 크레인 임대·작업 업체 파워크레인. 지역별 크레인·카고크레인 안내.</description><language>ko</language><lastBuildDate>${date}</lastBuildDate>
${items.join('\n')}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
