// 키워드 페이지 점검(2026-11-24 h1 수식어·레이 구조): OPEN_WAVE=6 npx tsx scripts/x_check.ts
// h1(키워드+수식어) 중복, 절 길이, 문단 쪼개짐, 키워드 든 h2, 조사 오류, 같은 문장 비율(무작위 / 같은 장비 / 같은 상위 지역 / 같은 장소)
import { OPEN_PAGES, FLEET, USES, Page } from '../lib/data';
import { compose } from '../lib/compose';
import { josa } from '../lib/ko';
import regionsA from '../data/regions.json';
import regionsB from '../data/regions-incheon.json';

const pages = OPEN_PAGES;
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
const nospace = (x: string) => x.replace(/\s/g, '').length;
type C = ReturnType<typeof compose>;
const cache = new Map<string, { c: C; set: Set<string>; text: string }>();
const get = (p: Page) => {
  if (!cache.has(p.slug)) {
    const c = compose(p);
    const text = [c.lead, c.summary, ...c.sections.map((x) => x.p), ...c.faq.map((f) => f.a)].join(' ');
    cache.set(p.slug, { c, text, set: new Set(text.split(/(?<=[.?!])\s+/).map((x) => x.trim()).filter((x) => x.length > 12)) });
  }
  return cache.get(p.slug)!;
};
const share = (a: Page, b: Page) => { const A = get(a).set, B = get(b).set; let n = 0; A.forEach((x) => { if (B.has(x)) n++; }); return n / Math.min(A.size, B.size); };

// 조사 검사: 데이터 명사 바로 뒤에 붙은 조사가 받침과 맞는지
const regions = [...(regionsA.regions as any[]), ...(regionsB.regions as any[])];
const nouns = new Set<string>([
  ...pages.flatMap((p) => [p.place, p.type, p.kw]), ...FLEET.map((f) => f.name), ...USES.map((u) => u.name),
  ...regions.flatMap((r) => [r.name, r.kw, ...r.hotspots, ...r.demand]), '파워크레인',
]);
const nounList = [...nouns].filter((n) => n.length >= 2).sort((a, b) => b.length - a.length);
const PART = ['을', '를', '은', '는', '이', '가', '과', '와', '으로', '로'];
const josaErr = (text: string) => {
  const bad: string[] = [];
  for (const n of nounList) {
    let i = text.indexOf(n);
    while (i >= 0) {
      const rest = text.slice(i + n.length);
      const m = rest.match(/^(으로|을|를|은|는|이|가|과|와|로)(?=[\s,.])/);
      if (m && PART.includes(m[1]) && josa(n, m[1]) !== m[1]) bad.push(`${n}${m[1]}`);
      i = text.indexOf(n, i + n.length);
    }
  }
  return bad;
};

const h1 = new Map<string, number>(); const desc = new Map<string, number>(); const dlen: number[] = []; let lens: number[] = []; let secLens: number[] = []; let kwH2 = 0; const errs: string[] = []; let raw = 0;
for (const p of pages) {
  const g = get(p); const c = g.c;
  const h = `${p.kw} ${c.h1sub}`; h1.set(h, (h1.get(h) || 0) + 1);
  desc.set(c.description, (desc.get(c.description) || 0) + 1); dlen.push(c.description.length);
  const len = nospace(g.text) + nospace(c.sections.map((x) => x.h).join(''));
  lens.push(len); c.sections.forEach((x) => secLens.push(nospace(x.p)));
  kwH2 += c.sections.filter((x) => x.h.includes(p.kw)).length;
  if (/undefined|\$\{|NaN/.test(JSON.stringify(c))) raw++;
  errs.push(...josaErr(g.text + ' ' + c.h1sub));
}
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const rnd = (seed: string, n: number) => hash(seed) % n;
const sample = (pairs: [Page, Page][]) => { const v = pairs.map(([a, b]) => share(a, b)); return v.length ? { avg: avg(v), max: Math.max(...v), n: v.length } : { avg: 0, max: 0, n: 0 }; };
const show = (name: string, r: { avg: number; max: number; n: number }) => console.log(`같은 문장 — ${name}: 평균 ${pct(r.avg)} · 최대 ${pct(r.max)} (${r.n}쌍)`);
const group = (key: (x: Page) => string) => { const m = new Map<string, Page[]>(); for (const x of pages) { const k = key(x); if (!m.has(k)) m.set(k, []); m.get(k)!.push(x); } return [...m.values()].filter((v) => v.length > 1); };
const within = (gs: Page[][], n: number, salt: string) => Array.from({ length: n }, (_, i) => { const g = gs[rnd(`${salt}g${i}`, gs.length)]; return [g[rnd(`${salt}x${i}`, g.length)], g[rnd(`${salt}y${i}`, g.length)]] as [Page, Page]; }).filter(([a, b]) => a !== b);

console.log(`열린 페이지 ${pages.length}`);
console.log(`h1(키워드+수식어) 중복 ${[...h1.values()].filter((v) => v > 1).length} · 자리표시자/undefined 남은 페이지 ${raw} · 조사 오류 ${errs.length}${errs.length ? ' 예) ' + [...new Set(errs)].slice(0, 8).join(', ') : ''}`);
const dBad = dlen.filter((x) => x < 50 || x > 80).length; const dDup = [...desc.values()].filter((v) => v > 1).length;
console.log(`description 길이 ${Math.min(...dlen)}~${Math.max(...dlen)}자 · 50~80 밖 ${dBad} · 중복 ${dDup} · 키워드 든 h2(요약·절·FAQ) 평균 ${(kwH2 / pages.length + 2).toFixed(1)}개`);
console.log(`본문 글자(설명+요약+절+FAQ답+h2, 공백 제외) 평균 ${Math.round(avg(lens))} · 최소 ${Math.min(...lens)} · 최대 ${Math.max(...lens)}`);
console.log(`절 한 문단(공백 제외) 평균 ${Math.round(avg(secLens))} · 최소 ${Math.min(...secLens)} · 최대 ${Math.max(...secLens)} · 키워드 든 h2 평균 ${(kwH2 / pages.length).toFixed(1)}개(절 6개 중)`); // 문단 쪼개짐(p 수 ≤ 본문 200자당 1개)은 빌드 뒤 scripts/x_html_check.py 로
const results = {
  random: sample(Array.from({ length: 600 }, (_, i) => [pages[rnd(`a${i}`, pages.length)], pages[rnd(`b${i}`, pages.length)]] as [Page, Page]).filter(([a, b]) => a !== b)),
  type: sample(within(group((x) => x.type), 1500, 't')),
  region: sample(within(group((x) => x.parent), 1500, 'r')),
  regionType: sample(within(group((x) => `${x.parent}|${x.type}`), 1500, 'rt')),
  place: sample(within(group((x) => `${x.parent}|${x.place}`), 1500, 'p')),
};
show('무작위', results.random); show('같은 장비(주제)', results.type); show('같은 상위 지역', results.region); show('같은 지역·같은 장비', results.regionType); show('같은 장소·다른 장비', results.place);
const worst = Math.max(results.type.max, results.regionType.max);
console.log(`같은 주제 페이지 같은 문장 최대 ${pct(worst)} → ${worst <= 0.3 ? '통과' : '미달'}`);
const ex = pages[rnd('show', pages.length)]; const c = get(ex).c;
console.log(`\n예) h1: ${ex.kw} / ${c.h1sub}\n분류: ${c.cat}\n요약: ${c.summary}\nh2: ${c.sections.map((x) => x.h).join(' | ')}\n절1: ${c.sections[0].p}\n절2: ${c.sections[1].p}`);
process.exit(worst <= 0.3 && errs.length === 0 && dBad === 0 && dDup === 0 && [...h1.values()].every((v) => v === 1) ? 0 : 1);
