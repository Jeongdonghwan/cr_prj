import Link from 'next/link';
import { FLEET, openRegions, pagePath } from '../lib/data';
import { BRAND } from '../lib/site';
import { faqJsonLd } from '../lib/jsonld';
import { Actions, IconArrow, JsonLd, SectionHead, Ticker, TonScale } from '../components/Common';
import type { Metadata } from 'next';

export const metadata: Metadata = { alternates: { canonical: '/' }, openGraph: { url: '/' } };

const FAQ = [
  { q: '어느 지역까지 가나요?', a: '김포·파주·일산을 중심으로 경기북부, 서울 서부, 인천·부천 현장을 다닙니다. 그 밖의 지역도 전화로 상담할 수 있습니다.' },
  { q: '몇 톤을 불러야 할지 모르겠어요.', a: '올릴 물건의 무게, 높이, 차량에서 설치 지점까지의 거리를 알려주세요. 현장 사진을 문자로 보내주시면 보유 장비 중에서 골라 드립니다.' },
  { q: '기사도 같이 오나요?', a: '네. 장비만 보내지 않고 크레인 기사가 함께 나가 작업합니다.' },
  { q: '견적은 어떻게 받나요?', a: '현장 주소와 작업 내용을 전화나 문자로 알려주시면 장비와 작업 시간을 정해 안내합니다. 제원 문의, 현장 답사 요청도 받습니다.' },
];

export default function Home() {
  const areas = openRegions();
  const fleet = FLEET.filter((f) => f.id !== 'sky-5t');
  const regionNames = areas.flatMap((a) => a.regions.map((r) => r.region.kw));
  return (
    <main>
      <JsonLd data={faqJsonLd(FAQ)} />
      <section className="hero hero-home">
        <div className="hero-media" style={{ backgroundImage: 'url(/images/fleet-yard.webp)' }} />
        <div className="wrap hero-body">
          <p className="hero-label">CRANE RENTAL · PAJU</p>
          <h1 className="hero-title"><span>크레인 임대와 작업,</span><span>파주 {BRAND}</span></h1>
          <p className="hero-lead">3.5톤 스카이차부터 리프헬 100톤까지 직접 보유한 장비로 나갑니다. 김포·파주·일산을 중심으로 경기북부, 서울 서부, 인천·부천까지 다닙니다.</p>
          <Actions dark />
          <dl className="stats">
            <div><dt>보유 장비</dt><dd><span data-count="12">12</span>종</dd></div>
            <div><dt>최대 톤수</dt><dd><span data-count="100">100</span>t</dd></div>
            <div><dt>출동 권역</dt><dd><span data-count="3">3</span>곳</dd></div>
          </dl>
        </div>
      </section>

      <div className="band"><div className="wrap"><TonScale /></div></div>
      <Ticker items={regionNames} />

      <div className="wrap content">
        <section className="sec">
          <SectionHead no="01" title="임대만 하는 곳이 아닙니다" />
          <div className="prose" data-reveal>
            <p className="first">{BRAND}는 크레인을 임대·대여하고, 크레인 작업까지 직접 맡습니다. 기사가 함께 나가 줄걸이 위치와 신호를 맞추며 일합니다.</p>
            <p>김포·파주·일산을 중심으로 일하고 있고, 그 밖의 지역도 전화 주시면 작업 방법과 맞는 장비를 안내합니다. 크레인 제원, 현장 답사, 견적 문의는 언제든 받습니다.</p>
          </div>
        </section>

        <section className="sec alt" id="fleet">
          <SectionHead no="02" title="보유 장비" sub="기존 장비 목록 그대로입니다. 현장 조건을 들은 뒤 이 중에서 고릅니다." />
          <div className="rail-nav">
            <button type="button" data-scroll="-1" data-target="home-rail" aria-label="이전 장비">←</button>
            <button type="button" data-scroll="1" data-target="home-rail" aria-label="다음 장비">→</button>
          </div>
          <div className="rail" id="home-rail">
            {fleet.map((f, i) => (
              <figure className="unit" key={f.id} data-reveal style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
                <div className="unit-img"><img src={`/images/${f.img}.webp`} alt={`${BRAND} 보유 장비 ${f.name}`} loading="lazy" /><b>{f.ton}t</b></div>
                <figcaption><strong>{f.name}</strong><span>{f.fit}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="sec">
          <SectionHead no="03" title="지역" sub="지역을 고르면 그 지역 장비별 안내로 이어집니다." />
          <div className="regions">
            {areas.map(({ area, regions }) => (
              <div key={area} className="region-col" data-reveal>
                <h3>{area}</h3>
                <ul>
                  {regions.map(({ region, hub, count }) => (
                    <li key={region.name}><Link href={pagePath(hub)}><span>{region.kw}</span><small>{count}</small><IconArrow /></Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p data-reveal><Link href="/area/" className="more">전체 지역 페이지 <IconArrow /></Link></p>
        </section>

        <section className="sec alt">
          <SectionHead no="04" title="작업 현장" />
          <div className="mosaic">
            {['work-rooftop-lift', 'work-stage-night', 'work-concert', 'work-stage-truss', 'fleet-aerial'].map((n, i) => (
              <figure key={n} data-reveal style={{ transitionDelay: `${(i % 3) * 80}ms` }}><img src={`/images/${n}.webp`} alt={`${BRAND} 크레인 작업 현장`} loading="lazy" /></figure>
            ))}
          </div>
        </section>

        <section className="sec">
          <SectionHead no="05" title="자주 묻는 질문" />
          <div className="faq">{FAQ.map((f) => <details key={f.q} data-reveal><summary>{f.q}<i /></summary><p>{f.a}</p></details>)}</div>
        </section>
      </div>

      <section className="closing">
        <div className="wrap" data-reveal>
          <h2>현장 주소와 작업 내용만 알려주세요</h2>
          <p>무게, 높이, 설치 위치까지의 거리를 들으면 장비와 일정이 정해집니다.</p>
          <Actions dark />
        </div>
      </section>
    </main>
  );
}
