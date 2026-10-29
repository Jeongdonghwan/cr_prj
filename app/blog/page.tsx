import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts, postPath, postEncodedPath } from '../../lib/blog';
import { breadcrumbJsonLd, itemListJsonLd } from '../../lib/jsonld';
import { Actions, IconArrow, JsonLd } from '../../components/Common';
import { BRAND, shareMeta } from '../../lib/site';

const TITLE = `크레인 작업 안내 글 | ${BRAND}`;
const DESC = '크레인·카고크레인·스카이차 작업 전에 알아둘 것을 정리한 글. 톤수 고르는 법, 작업 반경, 도로 점용, 신호수와 안전, 현장 준비 사항을 차례로 올립니다.';
export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/blog/', types: { 'application/rss+xml': '/rss.xml' } },
  ...shareMeta('blog', '크레인 작업 안내 글', { title: TITLE, description: DESC, url: '/blog/' }),
};

export default function BlogIndex() {
  const posts = getPosts();
  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: '홈', path: '/' }, { name: '작업 안내 글', path: '/blog/' }]),
          itemListJsonLd(posts.map((p) => ({ name: p.title, path: postEncodedPath(p) }))),
        ]}
      />
      <div className="wrap content page-top">
        <p className="hero-label dark">NOTES</p>
        <h1 className="page-title">크레인 작업 안내 글</h1>
        <p className="prose-p">장비를 부르기 전에 현장에서 미리 정해 두면 좋은 것들을 {BRAND} 기사 입장에서 정리합니다. 지역별 장비 안내는 <Link href="/area/">지역 페이지</Link>에 있습니다.</p>
        <section className="sec">
          <h2 className="area-h">최근 글</h2>
          {posts.length ? (
            <ul className="post-list">
              {posts.map((p) => (
                <li key={p.slug} data-reveal>
                  <Link href={postPath(p)}>
                    <time dateTime={p.publishedAt}>{p.publishedAt}</time>
                    <strong>{p.title}</strong>
                    <span>{p.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="prose-p">첫 글을 준비하고 있습니다. 그동안 궁금한 점은 전화나 문자로 물어보세요. <Link href="/" className="more">메인으로 <IconArrow /></Link></p>
          )}
        </section>
        <section className="sec">
          <h2 className="area-h">현장 사진으로 먼저 물어보기</h2>
          <p className="prose-p">무게, 높이, 차를 세울 자리와 설치 지점 사이 거리를 알려주시면 보유 장비 중에서 맞는 것을 고릅니다.</p>
          <Actions />
        </section>
      </div>
    </main>
  );
}
