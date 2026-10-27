import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header, Footer, StickyBar, JsonLd } from '../components/Common';
import Motion from '../components/Motion';
import { businessJsonLd, webSiteJsonLd } from '../lib/jsonld';
import { SITE_URL, BRAND, shareMeta } from '../lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} | 크레인 임대·대여·크레인 작업`, template: `%s` },
  description: '파주 차고지의 크레인 임대·작업 업체 파워크레인. 3.5톤 스카이차부터 100톤 크레인까지 보유, 경기북부·서울 서부·인천·부천 출동.',
  robots: { index: true, follow: true },
  ...shareMeta('home', `${BRAND} 크레인 임대·작업`),
  // TODO: 서치어드바이저·서치콘솔 소유확인 코드
};

export const viewport: Viewport = { themeColor: '#111418', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <JsonLd data={[businessJsonLd(), webSiteJsonLd()]} />
        <Header />
        {children}
        <Footer />
        <StickyBar />
        <Motion />
      </body>
    </html>
  );
}
