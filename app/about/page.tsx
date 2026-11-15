// 소개 — 사실만 평서문으로 (무엇을·어디서·어떻게 연락). site.ts 와 데이터에 있는 것만 쓴다. 없는 정보는 줄을 내지 않는다.
import type { Metadata } from 'next';
import Link from 'next/link';
import { FLEET } from '../../lib/data';
import { BRAND, BUSINESS, CONTACT, UPDATED, shareMeta, tel, smsHref } from '../../lib/site';
import { breadcrumbJsonLd, businessJsonLd } from '../../lib/jsonld';
import { JsonLd } from '../../components/Common';

const TITLE = `소개 | ${BRAND}`;
const DESC = '크레인 임대·대여와 크레인 작업을 하는 파워크레인 소개입니다. 하는 일, 다니는 지역, 연락 방법을 사실대로 정리했습니다.';
export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/about/' },
  ...shareMeta('home', `${BRAND} 소개`, { title: TITLE, description: DESC, url: '/about/' }),
};

export default function About() {
  return (
    <main>
      <JsonLd data={[businessJsonLd(), breadcrumbJsonLd([{ name: '홈', path: '/' }, { name: '소개', path: '/about/' }])]} />
      <div className="wrap content page-top">
        <nav className="crumbs" aria-label="경로"><Link href="/">홈</Link><span>/</span>소개</nav>
        <h1 className="page-title">{BUSINESS.name || BRAND} 소개</h1>
        <p className="prose-p">{BUSINESS.name || BRAND}은 크레인 임대·대여와 크레인 작업을 합니다. 크레인 기사가 장비와 함께 현장에 나갑니다.</p>
        <section className="sec">
          <h2 className="area-h">하는 일</h2>
          <p className="prose-p">보유 장비는 {FLEET.map((f) => f.name).join(', ')}입니다.</p>
        </section>
        <section className="sec">
          <h2 className="area-h">다니는 지역</h2>
          <p className="prose-p">김포·파주·일산을 중심으로 경기북부, 서울 서부, 인천·부천 현장을 다닙니다. 지역별 안내는 <Link href="/area/">지역별 안내</Link>에 있습니다.</p>
        </section>
        <section className="sec">
          <h2 className="area-h">연락 방법</h2>
          <p className="prose-p">전화 <a href={tel}>{CONTACT.phone}</a>, 문자 <a href={smsHref}>{CONTACT.sms}</a>{CONTACT.hours && ` (${CONTACT.hours})`}로 받습니다.</p>
          {BUSINESS.address && <p className="prose-p">주소는 {BUSINESS.address}입니다.</p>}
          {BUSINESS.ceo && <p className="prose-p">대표는 {BUSINESS.ceo}입니다.</p>}
          {BUSINESS.bizNumber && <p className="prose-p">사업자등록번호는 {BUSINESS.bizNumber}입니다.</p>}
        </section>
        <p className="prose-p">이 페이지의 최종 수정일은 <time dateTime={UPDATED}>{UPDATED}</time>입니다.</p>
      </div>
    </main>
  );
}
