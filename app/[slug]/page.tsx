import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OPEN_PAGES, getPage, pagePath, pageEncodedPath, canonicalPath, regionHub, regionOf, related } from '../../lib/data';
import { compose, placeLabel } from '../../lib/compose';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, serviceJsonLd } from '../../lib/jsonld';
import { BRAND, CONTACT, shareMeta, smsHref, tel } from '../../lib/site';
import { Actions, IconArrow, IconMsg, IconPhone, JsonLd } from '../../components/Common';

export const dynamicParams = false;

// 순차 오픈: lib/site.ts 의 OPEN_WAVE 이하 페이지만 생성
export function generateStaticParams() {
  return OPEN_PAGES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPage(params.slug);
  if (!p) return {};
  const c = compose(p);
  const url = canonicalPath(p);
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: url },
    ...shareMeta(p.slug, `${p.kw} - ${BRAND}`, { title: c.title, description: c.description, url }),
  };
}

// 레이 모범 구조(2026-11-24): 분류 줄 → h1(키워드 + 수식어) → 설명 → 핵심 요약 → 번호 절 6개 → FAQ → 관련 링크
export default function KeywordPage({ params }: { params: { slug: string } }) {
  const p = getPage(params.slug);
  if (!p) notFound();
  const c = compose(p);
  const r = regionOf(p);
  const hub = regionHub(p.parent);
  const rel = related(p);
  const groups = [
    { h: `${p.place} 다른 장비`, items: rel.samePlace.slice(0, 4) },
    { h: `${r.name} ${p.type}`, items: rel.sameType.slice(0, 4) },
    { h: `다른 지역 ${p.type}`, items: rel.otherAreas.slice(0, 4) },
  ].filter((g) => g.items.length);
  const path = pageEncodedPath(p);
  const relList = groups.flatMap((g) => g.items).map((x) => ({ name: x.kw, path: pageEncodedPath(x) }));

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: '홈', path: '/' },
            { name: '지역', path: '/area/' },
            ...(hub && hub.slug !== p.slug ? [{ name: hub.kw, path: pageEncodedPath(hub) }] : []),
            { name: p.kw, path },
          ]),
          serviceJsonLd({ name: p.kw, description: c.description, path, area: placeLabel(p, r) }),
          faqJsonLd(c.faq),
          ...(relList.length ? [itemListJsonLd(relList)] : []),
        ]}
      />

      <section className="hero x-hero">
        <div className="hero-media" style={{ backgroundImage: `url(${c.heroImg})` }} />
        <div className="wrap hero-body">
          <nav className="crumbs" aria-label="경로">
            <Link href="/">홈</Link><span>/</span><Link href="/area/">지역</Link>
            {hub && hub.slug !== p.slug && <><span>/</span><Link href={pagePath(hub)}>{hub.kw}</Link></>}
          </nav>
          <div className="hero-label">{c.cat}</div>
          <h1 className="hero-title"><span>{p.kw}</span>{' '}<span className="hero-sub">{c.h1sub}</span></h1>
          <p className="hero-lead">{c.lead}</p>
          <Actions dark />
        </div>
      </section>

      <div className="wrap x-grid">
        <div className="x-main">
          <section className="x-sum" data-reveal>
            <h2>{p.kw} 핵심 요약</h2>
            <p>{c.summary}</p>
            <dl>{c.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </section>
          <article className="x-article">
            {c.sections.map((x) => (
              <section key={x.h}>
                <h2>{x.h}</h2>
                <p>{x.p}</p>
              </section>
            ))}
          </article>
          <div className="x-photos">
            {c.gallery.map((g) => <figure key={g.src}><img src={g.src} alt={g.alt} loading="lazy" /></figure>)}
          </div>
          <section className="x-faq faq" id="faq">
            <h2>{p.kw} 자주 묻는 질문</h2>
            {c.faq.map((f) => <details key={f.q}><summary>{f.q}<i /></summary><p>{f.a}</p></details>)}
          </section>
        </div>
        <aside className="x-side">
          <h3>바로 확인</h3>
          <dl>{c.facts.slice(1, 3).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <a className="btn-primary" href={tel}><IconPhone /><span>{CONTACT.phone}</span></a>
          <a className="btn-text" href={smsHref}><IconMsg /><span>현장 사진 문자로 보내기</span><IconArrow /></a>
        </aside>
      </div>

      {groups.length > 0 && (
        <div className="wrap">
          <section className="sec related">
            {groups.map((g) => <div key={g.h}><h3>{g.h}</h3><ul>{g.items.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>)}
          </section>
        </div>
      )}

      <section className="closing">
        <div className="wrap" data-reveal>
          <h2>{c.closing.heading}</h2>
          <p>{c.closing.text}</p>
          <Actions dark />
        </div>
      </section>
    </main>
  );
}
