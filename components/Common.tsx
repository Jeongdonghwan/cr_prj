// 공통 UI — 이모지 없이 선 아이콘, 각진 버튼, 번호 붙은 섹션 머리.
import Link from 'next/link';
import { BRAND, CONTACT, BUSINESS, tel, smsHref } from '../lib/site';
import { FLEET } from '../lib/data';

export const JsonLd = ({ data }: { data: object | object[] }) => (
  <>{(Array.isArray(data) ? data : [data]).map((d, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />)}</>
);

const Svg = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
export const IconPhone = () => <Svg d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />;
export const IconMsg = () => <Svg d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />;
export const IconArrow = () => <Svg d="M5 12h14M13 6l6 6-6 6" size={16} />;

export const Actions = ({ dark }: { dark?: boolean }) => (
  <div className={`actions ${dark ? 'on-dark' : ''}`}>
    <a className="btn-primary" href={tel}><IconPhone /><span>{CONTACT.phone}</span></a>
    <a className="btn-text" href={smsHref}><IconMsg /><span>현장 사진 문자로 보내기</span><IconArrow /></a>
    {CONTACT.kakao && <a className="btn-text" href={CONTACT.kakao} target="_blank" rel="noopener noreferrer"><span>카카오톡 상담</span><IconArrow /></a>}
  </div>
);

export const SectionHead = ({ no, title, sub }: { no: string; title: string; sub?: string }) => (
  <header className="sh" data-reveal>
    <span className="sh-no">{no}</span>
    <h2>{title}</h2>
    {sub && <p>{sub}</p>}
  </header>
);

// 보유 장비 톤수 눈금 — 3.5t ~ 100t (로그 축). highlight 에 든 장비는 강조
export const TonScale = ({ highlight = [] as string[] }) => {
  const tons = Array.from(new Set(FLEET.map((f) => f.ton))).sort((a, b) => a - b);
  const pos = (t: number) => ((Math.log(t) - Math.log(3)) / (Math.log(110) - Math.log(3))) * 100;
  const hi = new Set(FLEET.filter((f) => highlight.includes(f.id)).map((f) => f.ton));
  return (
    <div className="scale" data-reveal aria-label="보유 장비 톤수">
      <div className="scale-bar"><span className="scale-fill" /></div>
      {tons.map((t) => (
        <span key={t} className={`tick ${hi.has(t) ? 'hi' : ''}`} style={{ left: `${pos(t)}%` }}>
          <i />{t}t
        </span>
      ))}
    </div>
  );
};

export const Ticker = ({ items }: { items: string[] }) => (
  <div className="ticker" aria-hidden="true">
    <div className="ticker-track">{[...items, ...items].map((x, i) => <span key={i}>{x}</span>)}</div>
  </div>
);

export const Header = () => (
  <header className="site-header">
    <div className="wrap header-inner">
      <Link href="/" className="logo"><b>POWER</b> CRANE<small>{BRAND}</small></Link>
      <nav className="nav">
        <Link href="/#fleet">장비</Link>
        <Link href="/area/">지역</Link>
        <Link href="/blog/">작업 안내</Link>
        <a href={tel} className="nav-call"><IconPhone />{CONTACT.phone}</a>
      </nav>
    </div>
  </header>
);

export const Footer = () => (
  <footer className="site-footer">
    <div className="wrap foot-grid">
      <div>
        <strong className="foot-brand">{BRAND}</strong>
        <p>크레인 임대·대여, 크레인 작업. 김포·파주·일산을 중심으로 경기북부, 서울 서부, 인천·부천.</p>
        <p className="foot-links"><Link href="/area/">지역별 안내</Link><Link href="/blog/">크레인 작업 안내 글</Link><a href="/rss.xml">RSS</a></p>
      </div>
      <ul className="foot-info">
        {BUSINESS.ceo && <li><span>대표</span>{BUSINESS.ceo}</li>}
        {BUSINESS.bizNumber && <li><span>사업자</span>{BUSINESS.bizNumber}</li>}
        <li><span>주소</span>{BUSINESS.address}</li>
        <li><span>전화</span>{CONTACT.phone}</li>
      </ul>
    </div>
    <div className="wrap foot-bottom">© {new Date().getFullYear()} {BRAND} · 상담 시 받은 정보는 견적 안내에만 씁니다.</div>
  </footer>
);

export const StickyBar = () => (
  <div className="sticky-bar">
    <a href={tel} className="sb-call"><IconPhone />전화</a>
    <a href={smsHref} className="sb-sms"><IconMsg />문자 견적</a>
  </div>
);
