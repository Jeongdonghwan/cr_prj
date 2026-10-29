// 블로그 글 로더 — content/blog/*.md (프런트매터 + '## 섹션'). '_' 로 시작하는 파일은 비공개(예시·초안).
// 서버(빌드) 전용. 글이 0편이어도 빈 배열.
// 예약 공개: 프런트매터 date(없으면 publishedAt, YYYY-MM-DD KST)가 빌드일보다 미래면 제외 — 목록·글·sitemap·rss·og 모두 이 함수를 쓴다.
// 빌드일 = env BUILD_DATE(YYYY-MM-DD) 또는 KST 오늘.
import fs from 'node:fs';
import path from 'node:path';

export const BUILD_DATE = process.env.BUILD_DATE || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

const DIR = path.join(process.cwd(), 'content', 'blog');

export interface Section { h: string; blocks: ({ p: string } | { list: string[] })[] }
export interface Post {
  slug: string; title: string; description: string; keyword: string; publishedAt: string;
  sections: Section[];
}

function parse(raw: string) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const k = line.indexOf(':');
    if (k < 0) continue;
    meta[line.slice(0, k).trim()] = line.slice(k + 1).trim().replace(/^'(.*)'$/, '$1');
  }
  return { meta, body: m[2] };
}

function toSections(body: string): Section[] {
  const out: Section[] = [];
  let cur: Section | null = null;
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) { cur = { h: h[1].trim(), blocks: [] }; out.push(cur); continue; }
    if (!cur || !line.trim()) continue;
    const li = line.match(/^[-*]\s+(.*)$/);
    const last = cur.blocks[cur.blocks.length - 1];
    if (li) {
      if (last && 'list' in last) last.list.push(li[1].trim());
      else cur.blocks.push({ list: [li[1].trim()] });
    } else cur.blocks.push({ p: line.trim() });
  }
  return out;
}

let cache: Post[] | null = null;
export function getPosts(): Post[] {
  if (cache) return cache;
  let files: string[] = [];
  try { files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_')); } catch {}
  const posts = files
    .map((f) => parse(fs.readFileSync(path.join(DIR, f), 'utf-8')))
    .filter((x): x is NonNullable<typeof x> => !!x && !!x.meta.slug && !!x.meta.title)
    .map(({ meta, body }) => ({
      slug: meta.slug, title: meta.title, description: meta.description || '', keyword: meta.keyword || '',
      publishedAt: meta.date || meta.publishedAt || '', sections: toSections(body),
    }))
    .filter((p) => p.publishedAt <= BUILD_DATE);
  posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
  return (cache = posts);
}

export function getPost(slug: string): Post | undefined {
  let key = slug;
  try { key = decodeURIComponent(slug); } catch {}
  return getPosts().find((p) => p.slug === key);
}

export const postPath = (p: Post) => `/blog/${p.slug}/`;
export const postEncodedPath = (p: Post) => `/blog/${encodeURIComponent(p.slug)}/`;
