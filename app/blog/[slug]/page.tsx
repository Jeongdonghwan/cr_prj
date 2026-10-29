import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPosts, getPost, postPath, postEncodedPath } from '../../../lib/blog';
import { seedOf } from '../../../lib/data';
import { articleJsonLd, breadcrumbJsonLd } from '../../../lib/jsonld';
import { Actions, IconArrow, JsonLd, SectionHead } from '../../../components/Common';
import { BRAND, SITE_URL, shareMeta } from '../../../lib/site';

export const dynamicParams = false;

// 글이 0편이면 Next 14 정적 export 가 빈 목록을 거부하므로 자리표시 1개(/blog/404/ = 404 화면, noindex, 사이트맵 제외)
const NONE = '404';
export function generateStaticParams() {
  const posts = getPosts();
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: NONE }];
}

const ogKey = (slug: string) => `blog-${slug}`;
// make_og.py PHOTOS 와 같은 순서
const PHOTOS = ['fleet-yard', 'fleet-trucks', 'fleet-line', 'fleet-aerial', 'work-concert', 'work-stage-truss'];

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPost(params.slug);
  if (!p) return { robots: { index: false, follow: true } };
  const title = `${p.title} | ${BRAND}`.length <= 60 ? `${p.title} | ${BRAND}` : p.title;
  const url = postEncodedPath(p);
  return {
    title,
    description: p.description,
    alternates: { canonical: url },
    ...shareMeta(ogKey(p.slug), p.title, { title, description: p.description, url }),
    openGraph: { ...shareMeta(ogKey(p.slug), p.title, { title, description: p.description, url }).openGraph, type: 'article', publishedTime: p.publishedAt },
  };
}

// 본문 한 줄: [글자](/경로/) 만 링크로. 아직 공개 전(예약)인 글로 가는 링크는 글자만 남긴다
const Inline = ({ text }: { text: string }) => (
  <>
    {text.split(/(\[[^\]]+\]\([^)]+\))/).map((part, i) => {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (!m) return part;
      const blog = m[2].match(/^\/blog\/([^/]+)\/?$/);
      return blog && !getPost(blog[1]) ? m[1] : <Link key={i} href={m[2]}>{m[1]}</Link>;
    })}
  </>
);

export default function BlogPost({ params }: { params: { slug: string } }) {
  const p = getPost(params.slug);
  if (!p) notFound();
  const path = postEncodedPath(p);
  const others = getPosts().filter((x) => x.slug !== p.slug).slice(0, 5);
  const photo = PHOTOS[seedOf(ogKey(p.slug)) % PHOTOS.length];
  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: '홈', path: '/' }, { name: '작업 안내 글', path: '/blog/' }, { name: p.title, path }]),
          articleJsonLd({ title: p.title, description: p.description, path, image: `${SITE_URL}/og/${encodeURIComponent(ogKey(p.slug))}.jpg`, date: p.publishedAt }),
        ]}
      />
      <section className="hero">
        <div className="hero-media" style={{ backgroundImage: `url(/images/${photo}.webp)` }} />
        <div className="wrap hero-body">
          <nav className="crumbs" aria-label="경로">
            <Link href="/">홈</Link><span>/</span><Link href="/blog/">작업 안내 글</Link>
          </nav>
          <p className="hero-label">NOTES · <time dateTime={p.publishedAt}>{p.publishedAt}</time></p>
          <h1 className="hero-title"><span>{p.title}</span></h1>
          <p className="hero-lead">{p.description}</p>
        </div>
      </section>

      <div className="wrap content">
        <article className="post">
          {p.sections.map((s, i) => (
            <section key={i} className="sec">
              <SectionHead no={String(i + 1).padStart(2, '0')} title={s.h} />
              <div className="prose" data-reveal>
                {s.blocks.map((b, j) =>
                  'p' in b
                    ? <p key={j} className={i === 0 && j === 0 ? 'first' : ''}><Inline text={b.p} /></p>
                    : <ul key={j} className="post-ul">{b.list.map((li, k) => <li key={k}><Inline text={li} /></li>)}</ul>
                )}
              </div>
            </section>
          ))}
        </article>

        <section className="sec related one">
          <div>
            <h2 className="area-h">다른 글</h2>
            <ul>
              {others.map((x) => <li key={x.slug}><Link href={postPath(x)}><span>{x.title}</span><IconArrow /></Link></li>)}
              <li><Link href="/blog/"><span>전체 글 목록</span><IconArrow /></Link></li>
              <li><Link href="/area/"><span>지역별 크레인 안내</span><IconArrow /></Link></li>
            </ul>
          </div>
        </section>
      </div>

      <section className="closing">
        <div className="wrap" data-reveal>
          <h2>현장 사진 한 장으로 장비를 정합니다</h2>
          <p>무게, 높이, 차를 세울 자리와 설치 지점 사이 거리를 알려주세요.</p>
          <Actions dark />
        </div>
      </section>
    </main>
  );
}
