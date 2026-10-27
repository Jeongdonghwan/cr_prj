import type { Metadata } from 'next';
import Link from 'next/link';
import { OPEN_PAGES, openRegions, pagePath } from '../../lib/data';
import { BRAND } from '../../lib/site';

export const metadata: Metadata = {
  title: `지역별 크레인 안내 | ${BRAND}`,
  description: '경기북부·서울 서부·인천·부천 지역별 크레인·카고크레인·하이드로크레인 안내 페이지 모음.',
  alternates: { canonical: '/area/' },
};

// 열린 모든 키워드 페이지로 가는 크롤 경로 (상위 지역별)
export default function AreaIndex() {
  return (
    <main>
      <div className="wrap content page-top">
        <p className="hero-label dark">AREA</p>
        <h1 className="page-title">지역별 크레인 안내</h1>
        <p className="prose-p">{BRAND}가 다니는 지역의 안내 페이지입니다. 지금 {OPEN_PAGES.length.toLocaleString()}개가 열려 있습니다.</p>
        {openRegions().map(({ area, regions }) => (
          <section key={area} className="sec">
            <h2 className="area-h">{area}</h2>
            {regions.map(({ region }) => (
              <div key={region.name} className="area-block" data-reveal>
                <h3>{region.name}</h3>
                <ul className="area-list">
                  {OPEN_PAGES.filter((p) => p.parent === region.name).map((p) => <li key={p.slug}><Link href={pagePath(p)}>{p.kw}</Link></li>)}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
