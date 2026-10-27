import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OPEN_PAGES, getPage, pagePath, pageEncodedPath, canonicalPath, regionHub, regionOf, related } from '../../lib/data';
import { compose, placeLabel } from '../../lib/compose';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, serviceJsonLd } from '../../lib/jsonld';
import { BRAND, shareMeta } from '../../lib/site';
import { Actions, IconArrow, JsonLd, SectionHead, Ticker, TonScale } from '../../components/Common';

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

export default function KeywordPage({ params }: { params: { slug: string } }) {
  const p = getPage(params.slug);
  if (!p) notFound();
  const c = compose(p);
  const r = regionOf(p);
  const hub = regionHub(p.parent);
  const rel = related(p);
  const path = pageEncodedPath(p);
  const relList = [...rel.samePlace, ...rel.sameType, ...rel.otherAreas].map((x) => ({ name: x.kw, path: pageEncodedPath(x) }));
  const tickerItems = c.nearby.length >= 3 ? [p.place, ...c.nearby, ...c.region.hotspots] : [r.name, ...c.region.hotspots, ...c.region.demand];

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

      <section className="hero">
        <div className="hero-media" style={{ backgroundImage: `url(${c.heroImg})` }} />
        <div className="wrap hero-body">
          <nav className="crumbs" aria-label="경로">
            <Link href="/">홈</Link><span>/</span><Link href="/area/">지역</Link>
            {hub && hub.slug !== p.slug && <><span>/</span><Link href={pagePath(hub)}>{hub.kw}</Link></>}
          </nav>
          <p className="hero-label">{c.eyebrow}</p>
          <h1 className="hero-title"><span>{c.h1}</span></h1>
          <p className="hero-lead">{c.lead}</p>
          <Actions dark />
          <dl className="hero-specs">{c.specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </div>
      </section>

      <div className="band"><div className="wrap"><TonScale highlight={c.fleetIds} /></div></div>
      <Ticker items={tickerItems} />

      <div className="wrap content">
        <section className="sec">
          <SectionHead no="01" title={c.region.heading} />
          <div className="cols">
            <div className="prose" data-reveal>
              {c.intro.map((t, i) => <p key={i} className={i === 0 ? 'first' : ''}>{t}</p>)}
              <p>{c.region.body}</p>
            </div>
            <aside className="facts" data-reveal>
              <h3>주요 현장</h3>
              <ol>{c.region.hotspots.map((h) => <li key={h}>{h}</li>)}</ol>
              <h3>많이 하는 작업</h3>
              <ol>{c.region.demand.map((d) => <li key={d}>{d}</li>)}</ol>
            </aside>
          </div>
        </section>

        <section className="sec alt">
          <SectionHead no="02" title={c.fleetHeading} sub={c.fleetNote} />
          <div className="rail-nav">
            <button type="button" data-scroll="-1" data-target="fleet-rail" aria-label="이전 장비">←</button>
            <button type="button" data-scroll="1" data-target="fleet-rail" aria-label="다음 장비">→</button>
          </div>
          <div className="rail" id="fleet-rail">
            {c.fleet.map((f, i) => (
              <figure className="unit" key={f.id} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                <div className="unit-img"><img src={`/images/${f.img}.webp`} alt={`${p.place} ${p.type} 배차 장비 ${f.name}`} loading="lazy" /><b>{f.ton}t</b></div>
                <figcaption><strong>{f.name}</strong><span>{f.fit}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="sec">
          <SectionHead no="03" title={c.guide.heading} />
          <div className="prose" data-reveal>{c.guide.paras.map((t, i) => <p key={i}>{t}</p>)}</div>
          <div className="lists" data-reveal>
            <div><h3>상담 전에 확인할 것</h3><ul className="check">{c.guide.checks.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><h3>자주 놓치는 점</h3><ul className="warn">{c.guide.pitfalls.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>
        </section>
      </div>

      <section className="cta-band" data-reveal>
        <div className="wrap cta-band-in">
          <p>현장 사진을 문자로 보내주시면 <em>톤수</em>부터 봐 드립니다.</p>
          <Actions dark />
        </div>
      </section>

      <div className="wrap content">
        <section className="sec alt">
          <SectionHead no="04" title={c.jobs.heading} />
          <ol className="jobs">
            {c.jobs.items.map((u, i) => (
              <li key={u.name} data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
                <span className="jobs-no">{String(i + 1).padStart(2, '0')}</span>
                <div><h3>{u.name}</h3><p>{u.text}</p><small>{u.season}</small></div>
              </li>
            ))}
          </ol>
        </section>

      </div>

      <section className="sec dark" data-reveal>
        <div className="wrap">
          <SectionHead no="05" title={c.sites.heading} />
          <ol className="sites">
            {c.sites.items.map((it, i) => (
              <li key={it.place} style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="sites-job">{it.job}</span>
                <h3>{it.place}</h3>
                <p>{it.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="wrap content">
        <section className="sec">
          <SectionHead no="06" title="진행 순서" />
          <ol className="timeline reveal-group">
            {c.steps.map((st) => <li key={st.title}><strong>{st.title}</strong><p>{st.text}</p></li>)}
          </ol>
        </section>

        <section className="sec alt">
          <SectionHead no="07" title={`${p.place} 작업 안내`} />
          <dl className="info" data-reveal>{c.info.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </section>

        <section className="sec">
          <SectionHead no="08" title="작업 현장" />
          <div className="mosaic">
            {c.gallery.map((g, i) => <figure key={g.src} data-reveal style={{ transitionDelay: `${i * 80}ms` }}><img src={g.src} alt={g.alt} loading="lazy" /></figure>)}
          </div>
        </section>

        <section className="sec alt" id="faq">
          <SectionHead no="09" title="자주 묻는 질문" />
          <div className="faq">
            {c.faq.map((f) => <details key={f.q} data-reveal><summary>{f.q}<i /></summary><p>{f.a}</p></details>)}
          </div>
        </section>

        {(rel.samePlace.length > 0 || rel.sameType.length > 0 || rel.otherAreas.length > 0) && (
          <section className="sec related">
            {rel.samePlace.length > 0 && <div><h3>{p.place} 다른 장비</h3><ul>{rel.samePlace.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>}
            {rel.sameType.length > 0 && <div><h3>{r.name} {p.type}</h3><ul>{rel.sameType.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>}
            {rel.otherAreas.length > 0 && <div><h3>다른 지역 {p.type}</h3><ul>{rel.otherAreas.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>}
          </section>
        )}
      </div>

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
