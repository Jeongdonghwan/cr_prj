// 본문 조합기 — 키워드 페이지 하나의 모든 문장을 만든다.
// 원칙: 보유 장비는 data/fleet.json(기존 사이트 표기)만 사실로 쓰고, 가격·시간 같은 수치는 지어내지 않는다.
// 2026-11-24 레이 모범 구조: 분류 줄 → h1(키워드 + 수식어 h1sub) → 설명 → 핵심 요약(결론 + 사실 4칸) → 번호 절 6개(한 문단) → FAQ → 관련 링크.
//   절마다 h2 문구 3벌·본문 3벌을 슬러그 해시로 고정 선택. 점검: OPEN_WAVE=6 npx tsx scripts/x_check.ts
import { Page, Region, ALL_PAGES, FLEET, EQUIPMENT, TONS, USES, regionOf, seedOf } from './data';
import { BRAND, CONTACT } from './site';
import { j } from './ko';

type Fleet = (typeof FLEET)[number];
const fleetById = new Map(FLEET.map((f) => [f.id, f]));
const HYDRO = FLEET.filter((f) => f.kind === '하이드로크레인').map((f) => f.id);

interface TypeInfo {
  short: string; // 제목용
  fleet: string[]; // 보여줄 보유 장비
  equip?: string; // data/equipment.json slug
  ton?: string; // data/tons.json slug
  note: string; // 보유 장비와 이 키워드의 관계 (사실만)
  rental?: boolean;
}

const ALL = FLEET.map((f) => f.id);
const TYPES: Record<string, TypeInfo> = {
  크레인: { short: '크레인', fleet: ALL, note: '3.5톤 스카이차부터 리프헬 100톤 크레인까지 보유 장비 안에서 현장에 맞는 차량을 고릅니다.' },
  카고크레인: { short: '카고크레인', fleet: ['cargo-5t', 'truck-16t', 'sky-3_5t'], equip: '카고크레인', note: '자재를 싣고 와서 바로 올리는 작업은 5톤 카고크레인과 16톤 트럭크레인이 맡습니다.' },
  하이드로크레인: { short: '하이드로크레인', fleet: HYDRO, equip: '하이드로크레인', note: '13톤 타다노부터 카토 20·25톤, 70톤 타다노, 카토 80톤, 리프헬 100톤까지 하이드로 장비를 무게와 반경에 맞춰 배차합니다.' },
  미니크레인: { short: '미니크레인', fleet: ['cargo-5t', 'tadano-13t', 'sky-3_5t'], equip: '미니크레인', note: '미니(스파이더)크레인이 꼭 필요한 실내·협소 현장은 상담 때 배차 가능 여부부터 확인해 드립니다. 차량이 들어가는 현장이라면 5톤 카고나 13톤 타다노로 해결되는 경우가 많습니다.' },
  '5톤 크레인': { short: '5톤 크레인', fleet: ['cargo-5t', 'sky-5t', 'sky-3_5t'], ton: '5톤', note: '5톤급 작업은 5톤 카고크레인이 맡고, 사람이 올라가야 하는 작업은 3.5·5톤 스카이차로 함께 대응합니다.' },
  '10톤 크레인': { short: '10톤 크레인', fleet: ['tadano-13t', 'rough-16t', 'cargo-5t'], ton: '10톤', note: '10톤급 작업은 보유 장비 중 13톤 타다노 크레인이 맡고, 반경이 길면 16톤으로 올려 배차합니다.' },
  '15톤 크레인': { short: '15톤 크레인', fleet: ['rough-16t', 'truck-16t', 'tadano-13t'], ton: '15톤', note: '15톤급 작업은 16톤 크레인과 16톤 트럭크레인이 맡습니다.' },
  '25톤 크레인': { short: '25톤 크레인', fleet: ['crane-25t', 'kato-25t', 'kato-20t'], ton: '25톤', note: '25톤 크레인과 카토 25톤, 한 단계 아래 카토 20톤까지 25톤급 현장에 맞춰 배차합니다.' },
  '50톤 크레인': { short: '50톤 크레인', fleet: ['tadano-70t', 'kato-80t', 'crane-25t'], ton: '50톤', note: '50톤급 작업은 70톤 타다노와 카토 80톤으로 여유 있게 대응합니다. 정격하중은 반경에 따라 줄어들기 때문에 한 단계 큰 장비가 안전한 경우가 많습니다.' },
  '100톤 크레인': { short: '100톤 크레인', fleet: ['liebherr-100t', 'kato-80t', 'tadano-70t'], ton: '100톤', note: '100톤급 작업은 리프헬 100톤 크레인이 맡고, 조건에 따라 카토 80톤·70톤 타다노로 나눠 계획합니다.' },
  '크레인 임대': { short: '크레인 임대', fleet: ALL, rental: true, note: '장비만 빌리는 것이 아니라 크레인 전문 기사가 함께 출동해 작업까지 맡는 방식입니다.' },
  '크레인 대여': { short: '크레인 대여', fleet: ALL, rental: true, note: '기사 포함 대여로 운영하며, 반나절 작업부터 여러 날 이어지는 공정까지 일정에 맞춰 상담합니다.' },
};

// 지역 데이터의 출동 문구는 명사구·문장이 섞여 있어 문장으로 맞춘다
const sentence = (x: string) => { const t = x.replace(/[.。]$/, ''); return t.endsWith('다') ? `${t}.` : `${t}입니다.`; };

const pick = <T,>(arr: T[], seed: string, salt: string): T => arr[seedOf(`${seed}::${salt}`) % arr.length];
const rotate = <T,>(arr: T[], seed: string, salt: string): T[] => {
  if (!arr.length) return arr;
  const k = seedOf(`${seed}::${salt}`) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
};

export interface Composed {
  title: string; description: string; h1sub: string; lead: string; cat: string;
  summary: string; facts: [string, string][];
  sections: { h: string; p: string }[];
  heroImg: string; fleet: Fleet[];
  faq: { q: string; a: string }[];
  closing: { heading: string; text: string };
  gallery: { src: string; alt: string }[];
}

export function placeLabel(p: Page, r: Region) {
  const last = p.place.split(' ').slice(-1)[0];
  if (p.level === '동·읍면') return `${r.containedIn} ${last}`;
  return r.containedIn;
}

export function compose(p: Page): Composed {
  const r = regionOf(p);
  const t = TYPES[p.type];
  const s = p.slug;
  const place = p.place;
  const full = placeLabel(p, r);
  const label = p.type;
  const R = r.name;
  const fleet = rotate(t.fleet.map((id) => fleetById.get(id)!).filter(Boolean), s, 'fleet');
  const fleet2 = fleet.slice(0, 2).map((f) => f.name).join('·');
  const [f0, f1, f2] = fleet.map((f) => f.name);
  const hs = rotate(r.hotspots, s, 'hot');
  const dm = rotate(r.demand, s, 'dem');
  const eq = t.equip ? EQUIPMENT.find((e) => e.slug === t.equip) : undefined;
  const ton = t.ton ? TONS.find((x) => x.slug === t.ton) : undefined;
  // h1 수식어용: 키워드에 이미 든 지역명(송도동 → 송도)이 들어간 현장 이름은 뺀다
  const stems = place.split(' ').map((w) => w.replace(/(특별시|광역시|시|군|구|동|읍|면|리)$/, '')).filter((w) => w.length >= 2);
  const hsx = hs.filter((h) => !stems.some((w) => h.includes(w)));
  const hx = hsx.length ? hsx : hs;

  // ---- 메타 (주소·title·description 은 2026-11-24 이전과 같다) ----
  const title = pick([
    `${p.kw} | ${t.short} 배차·견적 상담 - ${BRAND}`,
    `${p.kw} 전문 ${BRAND} | ${r.kw} 현장 출동`,
    `${p.kw} - ${hs[0]} 현장 ${t.short} 작업 안내 | ${BRAND}`,
  ], s, 'title');
  // description 45~80자(2026-11-24 §5-3): 키워드 → 관련 장비·작업 → 페이지 사실 → 상담 전화. 80자 넘으면 앞 후보부터 짧은 쪽으로
  const ph = CONTACT.phone;
  const descs = pick([
    [`${p.kw} — ${j(fleet2, '을')} 중심으로 배차합니다. ${hs[0]} 현장 상담 ${ph}`, `${p.kw} — ${f0} 중심 배차. ${hs[0]} 현장 상담 ${ph}`, `${p.kw} — ${f0} 배차 상담 ${ph}`],
    [`${p.kw}, ${dm[0]} 작업에 ${f0} 배차. 기사 동행 상담 ${ph}`, `${p.kw}, ${f0} 배차와 기사 동행 작업. 상담 ${ph}`, `${p.kw} — ${f0} 배차 상담 ${ph}`],
    [`${p.kw} — ${dm[0]} 작업. 파주 차고지에서 ${f0} 출동, 상담 ${ph}`, `${p.kw} — ${dm[0]} 작업. 파주 차고지에서 출동, 상담 ${ph}`, `${p.kw} — 파주 차고지 출동 상담 ${ph}`],
  ], s, 'desc');
  const description = descs.find((d) => d.length <= 80 && d.length >= 50) || descs[descs.length - 1];

  // ---- 머리 ----
  const lead = pick([
    `${place} 현장에는 ${j(fleet2, '을')} 주로 보냅니다. 올릴 물건 무게와 설치 높이를 알려주시면 ${place} ${label} 톤수를 정해 드립니다.`,
    `${place} ${label} 작업은 ${hs[0]}, ${hs[1]} 쪽을 자주 다니며 맞춥니다. ${place} 일정은 전화로 바로 확인됩니다.`,
    `${j(dm[0], '과')} ${dm[1]} 작업이 많습니다. ${place} 현장 사진을 문자로 보내주시면 장비부터 맞춰 봅니다.`,
    `${place} 현장도 파주 차고지에서 출발합니다. ${place} ${label} 작업은 기사가 함께 나가 줄걸이와 신호까지 맡습니다.`,
  ], s, 'lead');
  const specSub = eq ? `${eq.tagline}, ${f0} 기준` : ton ? `${ton.reach} 제원과 배차` : t.rental ? '기사 포함 스카이차부터 100톤까지' : '스카이차부터 100톤까지 현장별 배차';
  const h1sub = pick([
    `${hx[0]} 현장까지 ${f0} 배차`,
    `${dm[0]} 작업 장비 고르기`,
    specSub,
    `무게·높이·반경으로 정하는 ${f0} 배차`,
  ], s, 'h1');

  // ---- 핵심 요약 ----
  const summary = pick([
    `${place} ${label} 작업은 ${j(fleet2, '을')} 중심으로 배차합니다. ${place} 현장 톤수는 올릴 물건 무게, 설치 높이, 차량에서 설치 지점까지 거리로 정합니다. ${hs[0]}·${hs[1]}처럼 ${R} 현장은 진입로와 차량 세울 자리를 함께 확인해야 당일 장비를 바꾸지 않습니다. 기사가 함께 출동해 ${place}에서 줄걸이와 신호까지 맡습니다. ${place} 현장 사진을 문자로 받으면 차량과 시간을 바로 잡습니다. 견적은 톤수와 작업 시간, ${place}까지 거리를 보고 드립니다.`,
    `${j(BRAND, '은')} 파주 차고지에서 ${place} 현장으로 ${label} 장비를 보냅니다. ${R}에서는 ${j(dm[0], '과')} ${dm[1]} 문의가 많고, ${place}의 이런 작업에는 보통 ${j(fleet2, '이')} 맞습니다. ${place} 현장 사진과 주소를 문자로 받으면 무게·높이·반경을 보고 차량과 시간을 정합니다. ${place} 현장에는 기사가 함께 나가 줄걸이와 신호까지 맡습니다. 견적은 톤수와 작업 시간, ${place}까지 거리를 보고 드립니다.`,
    `${place}에서 ${j(label, '이')} 필요한 일은 주로 ${dm[0]}, ${dm[1]} 쪽입니다. 장비는 보유 차량 가운데 ${j(fleet2, '을')} 먼저 검토하고, ${hs[0]} 같은 현장은 아웃트리거 펼칠 공간을 확인한 뒤 확정합니다. 작업 내용을 전화나 문자로 알려주시면 ${place} ${label} 배차와 견적을 안내합니다. ${place} 현장에는 기사가 함께 나가 줄걸이와 신호까지 맡습니다. ${place} 일정이 비어 있으면 당일 배차도 상담합니다.`,
  ], s, 'sum');
  const facts: [string, string][] = [
    ['작업 지역', full],
    ['배차 장비', fleet.slice(0, 3).map((f) => f.name).join(', ')],
    ['주요 현장', hs.slice(0, 2).join(', ')],
    ['출동', '파주 차고지 · 기사 동행'],
  ];

  // ---- 절 재료 ----
  const nearby = rotate(Array.from(new Set(ALL_PAGES.filter((x) => x.parent === p.parent && x.level === '동·읍면' && x.place !== place)
    .map((x) => x.place.split(' ').slice(-1)[0]))), s, 'near').slice(0, 3);
  const nearLine = nearby.length >= 3 ? `${place} 현장을 오가는 길에 ${nearby.join('·')} 현장도 함께 다닙니다.` : `${place}에서 ${hs[2]} 쪽 현장까지 같은 동선으로 다닙니다.`;
  const nearLine2 = nearby.length >= 2 ? `${place} 일정은 ${nearby[0]}·${nearby[1]} 쪽 일정과 묶어 다니기도 합니다.` : `${place} 일정은 ${hs[2]} 쪽 일정과 묶어 다니기도 합니다.`;
  const trait1 = sentence(r.traits.split('. ')[0]);
  const kindName = t.equip || (ton ? (Number(ton.slug.replace('톤', '')) >= 25 ? '하이드로크레인' : '카고크레인') : '');
  let uses = USES.filter((u) => !kindName || u.equip.includes(kindName) || kindName === '미니크레인');
  if (uses.length < 4) uses = USES;
  const demandText = r.demand.join(' ') + r.traits;
  uses = [...uses].sort((a, b) => Number(demandText.includes(b.kw)) - Number(demandText.includes(a.kw)));
  const [u0, u1] = [...uses.slice(0, 1), ...rotate(uses.slice(1), s, 'uses')];
  const detail = (u: any, salt: string) => sentence(pick((u.detail as string).split('. ').map((x) => x.trim()).filter(Boolean), s, salt));
  const specLine = eq
    ? `${j(eq.name, '은')} ${eq.intent}에 쓰고, 일반 제원은 ${eq.range}입니다.`
    : ton
      ? `${ton.name}급 제원은 ${ton.reach} 정도로, ${ton.typical} 작업에 주로 씁니다.`
      : '보유 장비는 3.5·5톤 스카이차와 5톤 카고, 13·16·20·25톤, 70·80톤, 리프헬 100톤까지입니다.';
  const checks = rotate<string>(eq ? eq.checks : ['진입로 폭과 아웃트리거 펼칠 공간', '양중물 무게와 올릴 높이', '차량에서 설치 지점까지 거리'], s, 'chk');
  const pit = sentence(eq ? pick<string>(eq.pitfalls, s, 'pit') : ton ? ton.limit : '현장 사진 없이 톤수를 정하면 당일 장비를 바꾸는 일이 생길 수 있습니다');

  const KW_AT = new Set([0, 1, 2, 5]); // 6개 절 중 4개 h2 에 키워드 전체
  // 절 본문: 문장마다 이 페이지 장소·장비가 들어가게 쓴다(같은 장비 페이지끼리 같은 문장 30% 이하)
  const SECS: { sub: string[]; p: string[] }[] = [
    { // 0 현장 사정
      sub: [`${hx[0]} 쪽 현장 사정`, `${R} 현장에서 먼저 보는 것`, '어떤 현장이 많은가'],
      p: [
        `${place}에서 ${label} 일을 하다 보면 ${R} 전체 현장 사정이 그대로 보입니다. ${trait1} ${place} ${label} 문의도 이 흐름 안에서 들어오지만, 같은 동네라도 건물 높이와 앞 도로 폭이 제각각이라 주소와 사진으로 차량 세울 자리부터 확인합니다. ${hs[0]} 쪽처럼 차가 많은 곳이면 ${place} 작업 시간대도 함께 정합니다. 그래서 ${place} 상담은 무엇을 올리는지와 차가 어디까지 들어가는지 두 가지로 시작합니다. ${place} 현장 사진에 앞 도로가 함께 나오면 판단이 빨라집니다.`,
        `${place} 주변에서 ${label} 작업이 잦은 곳은 ${hs[0]}, ${hs[1]}, ${hs[2]} 쪽입니다. ${place} 기준으로 ${hs[0]}에서는 ${dm[0]}, ${hs[1]} 쪽은 ${dm[1]} 일정이 꾸준히 잡힙니다. 현장마다 진입로 폭과 차량 세울 위치가 달라서 같은 무게라도 ${place}에 보내는 장비가 달라지므로, 주소를 먼저 받아 도로 사정을 봅니다. ${place}에서 가까운 ${hs[3] || hs[2]} 쪽 문의도 같은 방식으로 확인합니다. ${place} 현장은 주소와 사진 두 가지만 있으면 진입로와 세울 자리를 미리 볼 수 있습니다. ${place} 현장 높이에 따라 ${f0} 대신 더 큰 차량을 권하기도 합니다.`,
        `${R}에서 들어오는 ${label} 문의는 ${dm[0]}, ${dm[1]}, ${dm[2]} 세 갈래가 대부분이고, ${place} 현장도 크게 다르지 않습니다. 그래서 ${place}에서 무엇을 올리는지 들으면 ${label} 차량 종류가 먼저 좁혀집니다. ${nearLine} 다만 건물 높이와 앞 도로 사정이 집마다 달라 ${place} ${label} 상담에서도 현장 사진 확인은 빼지 않습니다. ${place} 가까이에서는 ${hs[0]}, ${hs[1]} 쪽 현장도 같은 방식으로 확인합니다. ${place} 현장 높이에 따라 ${f0} 대신 더 큰 차량을 권하기도 합니다.`,
      ],
    },
    { // 1 장비·톤수
      sub: ['보내는 장비와 톤수', `${f0}부터 보는 이유`, '어떤 차량이 가나'],
      p: [
        `${t.note} ${place} 현장에는 ${j(f0, '을')} 먼저 검토하고, 반경이 길거나 설치 위치가 높으면 ${f1} 쪽으로 올립니다. ${specLine} 같은 무게라도 차량에서 멀리 뻗을수록 들 수 있는 무게가 줄어서, ${place} ${label} 상담에서는 무게보다 설치 지점까지 거리부터 묻습니다. ${place} 현장 사진에 차량 세울 자리가 함께 나오면 판단이 더 빠릅니다. ${place} 현장 설치 높이가 높을수록 반경도 함께 늘어난다는 점을 감안합니다.`,
        `${place} ${label} 배차는 보유 차량 가운데 ${f0}, ${f1}, ${f2} 순으로 봅니다. ${place} 현장에서 ${j(f0, '은')} ${fleet[0].fit}에 맞고, ${j(f1, '은')} ${fleet[1].fit}에 씁니다. ${t.note} ${place} 현장 장비를 정하는 기준은 결국 무게·높이·반경 세 가지라서, 이 세 가지를 들으면 차량이 정해집니다. ${place} 현장 사진이 있으면 판단이 더 빨라집니다.`,
        `${place} ${label} 톤수는 물건 무게만으로 정하지 않습니다. ${place}처럼 ${hs[0]} 주변 현장은 차량이 설치 지점에서 얼마나 떨어져 서는지가 더 크게 작용합니다. ${specLine} ${t.note} 판단이 서지 않으면 ${place} 현장 사진을 보고 ${f0} 기준으로 다시 맞춥니다. ${f1}까지 올려야 하는 현장인지도 ${place} 사진으로 함께 봅니다. ${place} 현장 설치 높이가 높을수록 반경도 함께 늘어난다는 점을 감안합니다.`,
      ],
    },
    { // 2 작업 종류
      sub: ['많이 하는 작업', `${u0.name}·${u1.name} 작업`, '현장별 작업 방식'],
      p: [
        `${place}에서 ${j(label, '으로')} 많이 하는 일은 ${j(u0.name, '과')} ${u1.name}입니다. ${detail(u0, 'd0')} ${place} 현장 가운데 ${hs[0]} 쪽이라면 ${j(u0.checks[0], '을')} 먼저 확인하고, ${j(u1.name, '은')} ${j(u1.checks[0], '을')} 먼저 듣습니다. 작업 종류를 알면 ${place}에 보낼 차량이 바로 좁혀집니다. ${detail(u1, 'd0b')} ${place} 현장에서 두 작업이 함께 있으면 상담 때 순서를 같이 정합니다. ${place} 현장 사진과 작업 날짜를 함께 알려주시면 일정이 빨라집니다.`,
        `${place} 가까이 ${hs[0]} 쪽은 ${u0.name}, ${hs[1]} 쪽은 ${j(u1.name, '이')} 많습니다. ${detail(u1, 'd1')} ${place} 현장도 작업 종류를 들으면 어떤 ${label} 차량으로 갈지 정해지고, ${j(u0.checks[1] || u0.checks[0], '은')} 상담 때 함께 확인합니다. ${u0.name} 일정이 다른 업체와 겹치면 ${place} 현장 시간을 그쪽에 맞춥니다. ${detail(u0, 'd1b')} ${place} 현장 사진과 작업 날짜를 함께 알려주시면 일정이 빨라집니다.`,
        `${R} ${label} 문의 가운데 ${j(u0.name, '과')} ${j(u1.name, '이')} 자주 들어오고, ${place}도 마찬가지입니다. ${detail(u0, 'd2')} ${place} 현장이라면 ${u0.checks.slice(0, 2).join(', ')}부터 알려주시면 배차가 빨라집니다. ${u1.name} 작업도 ${place}에서는 ${j(u1.checks[0], '을')} 먼저 확인하고 장비를 정합니다. ${detail(u1, 'd2b')} ${place} 현장에서 두 작업이 이어지면 상담 때 순서를 같이 정합니다. ${place} 현장 사진과 작업 날짜를 함께 알려주시면 일정이 빨라집니다.`,
      ],
    },
    { // 3 진입·설치 조건
      sub: ['진입로와 아웃트리거 공간', '현장에서 확인할 조건', '작업 전에 걸리는 것'],
      p: [
        `${place} 현장에서 먼저 걸리는 것은 진입로와 아웃트리거를 펼칠 공간입니다. ${place} ${hs[0]} 주변처럼 차가 많은 도로는 ${label} 차량 세울 위치를 미리 정해야 하고, 도로·인도를 쓰면 관할 기관 점용 절차가 필요할 수 있습니다. ${pit} 전선이나 가로수가 붐 회전 범위에 걸리는지도 ${place} 현장 사진으로 먼저 봅니다. 작업 날짜가 정해지면 ${place} 현장 주변 주차 차량도 미리 비워 두는 편이 좋습니다. ${label} 차량이 들어갈 길이 좁으면 다른 진입 방향도 같이 봅니다.`,
        `${place} ${label} 작업 전에 확인할 것은 ${checks.join(', ')}입니다. ${pit} ${place}의 ${hs[1]} 쪽처럼 건물이 붙어 있는 곳은 장비 크기보다 세울 자리가 먼저 문제가 됩니다. ${place} 아파트·상가 현장이라면 관리사무소 작업 신고를 먼저 해두면 당일 진행이 빨라집니다. ${place} 현장 사진에 진입로와 세울 자리가 함께 나오면 ${j(f0, '으로')} 될지 바로 판단할 수 있습니다.`,
        `${place}에서는 같은 ${dm[0]} 작업이라도 현장마다 조건이 다릅니다. ${place} 현장의 ${checks[0]}, ${j(checks[1], '을')} 사진으로 받으면 ${j(f0, '으로')} 될지 더 큰 차량이 필요한지 판단할 수 있습니다. ${pit} ${place} 작업이 반나절인지 여러 날인지도 함께 알려주시면 ${label} 일정을 맞춥니다. 전선이나 가로수가 붐 회전 범위에 걸리는지도 ${place} 현장 사진으로 먼저 봅니다. ${hs[2]} 쪽 현장도 같은 순서로 확인합니다.`,
      ],
    },
    { // 4 진행 순서
      sub: ['상담부터 철수까지', '진행 순서', '문의 뒤 작업까지 흐름'],
      p: [
        `진행은 ${place} 주소와 작업 내용을 전화나 문자로 받는 데서 시작합니다. 사진이 있으면 무게·높이·반경을 보고 톤수를 정하고, ${f0} 등 맞는 차량과 시간을 잡아 ${place} ${label} 견적을 드립니다. 당일에는 기사가 아웃트리거를 펴고 신호에 맞춰 ${dm[0]} 작업을 진행한 뒤, ${place} 현장의 설치 위치와 고정 상태를 함께 확인하고 철수합니다. ${place} 현장에 함께 일하는 업체가 있으면 작업 시간을 그쪽과 맞추고 신호수 위치도 미리 정합니다. ${place} 일정이 바뀌면 전화로 다시 잡습니다.`,
        `${hs[0]} 같은 ${place} 현장이라면 먼저 위치와 올릴 물건을 문자로 남겨 주세요. 설치 지점까지 거리가 멀면 한 단계 큰 장비를 권하고, ${f0} 일정이 비는 날로 ${place} 작업 시간을 맞춥니다. 작업 날에는 줄걸이와 신호수 위치를 정한 뒤 양중하고, 끝나면 아웃트리거를 접고 ${place} 현장 주변을 정리한 다음 출발합니다. ${place} ${label} 견적은 톤수와 작업 시간, 이동 거리를 보고 드리고, 함께 작업할 업체와 인원도 미리 알려주시면 신호 체계를 맞추기 쉽습니다.`,
        `${label} 문의를 받으면 작업 날짜와 ${place} 현장 위치부터 확인합니다. 이어서 물건 무게와 차량에서 설치 지점까지 거리를 듣고 ${fleet2} 가운데 ${place}에 맞는 차량을 배정합니다. 파주 차고지에서 ${R} 현장으로 출발해 작업하고, 마친 뒤 설치 위치를 같이 보며 ${place} 쪽 추가 일정이 있으면 그 자리에서 잡습니다. ${place} 현장 사진이 있으면 톤수 결정이 빨라지고, 없으면 주소로 도로 사정부터 봅니다. ${label} 견적은 톤수와 작업 시간, 이동 거리를 보고 드립니다.`,
      ],
    },
    { // 5 출동·일정
      sub: ['출동 동선과 일정', `${R} 출동`, '기사 동행과 일정 잡기'],
      p: [
        `장비는 파주 차고지에서 ${place}까지 바로 출발하고, ${R} 쪽 출동 동선은 ${sentence(r.access)} ${place} ${label} 일정은 전화로 바로 확인되며 비어 있으면 당일 배차도 상담합니다. ${nearLine2} 기사가 장비와 함께 나가 줄걸이와 신호를 맞추므로 ${place} 현장에서는 올릴 물건과 설치 위치만 준비하면 됩니다. ${place} 작업 시간이 길어질 것 같으면 상담 때 미리 말해 주세요. ${R} 다른 현장과 일정이 겹치면 순서를 조정해 맞춥니다.`,
        `${j(BRAND, '은')} 김포·파주·일산을 중심으로 경기북부와 서울 서부, 인천·부천까지 다니고, ${place}도 그 출동 권역 안에 있습니다. 그래서 ${dm[1]} 같은 짧은 ${label} 작업도 ${place} 일정에 맞춰 잡습니다. 반나절 작업부터 여러 날 이어지는 공정까지 상담하며, ${place} 야간·주말 작업은 일정을 듣고 안내합니다. ${R} 쪽 출동 동선은 ${sentence(r.access)} ${place} 현장 주소와 날짜를 알려주시면 ${f0} 일정이 비는지 바로 확인합니다.`,
        `${place}에서 ${hs[1]} 쪽까지 같은 동선으로 다니며, 일정이 겹치면 순서를 조정해 시간을 맞춥니다. ${place}까지 출동 동선은 ${sentence(r.access)} 크레인 기사가 ${j(f0, '과')} 함께 나가 ${place} ${label} 작업까지 맡고, 작업 시간이 길어질 수 있으면 상담 때 미리 말해 두는 편이 일정 잡기에 좋습니다. ${nearLine2} ${place} 일정이 비어 있으면 당일 배차도 상담합니다.`,
      ],
    },
  ];
  const sections = SECS.map((x, i) => {
    const sub = pick(x.sub, s, `sub${i}`);
    return { h: KW_AT.has(i) ? `${p.kw}${i % 2 ? ' — ' : ': '}${sub}` : sub, p: pick(x.p, s, `p${i}`) };
  });

  // ---- FAQ (뱅크에서 3개) ----
  const bank = [
    { q: `${place} ${label} 비용은 어떻게 정해지나요?`, a: `톤수, 작업 시간, ${place}까지 거리, 야간·휴일 여부로 정해집니다. ${place} 현장 사진을 보고 안내합니다.` },
    { q: `${place}까지 출동이 되나요?`, a: `네, ${j(place, '을')} 포함해 ${R} 전역으로 출동합니다. 동선은 ${sentence(r.access)} ${place} 일정이 비어 있으면 당일 배차도 상담합니다.` },
    { q: '몇 톤이 필요한지 모르겠어요.', a: `무게·높이·거리를 알려주시거나 ${place} 현장 사진을 보내주시면 맞는 톤수를 골라 드립니다.` },
    { q: '작업 전에 준비할 것이 있나요?', a: `${checks.slice(0, 2).join(', ')} 정도를 미리 확인해 주세요.${pick([' 아파트·상가라면 관리사무소 작업 신고도 먼저 해두면 좋습니다.', ' 현장 사진이 있으면 더 빨리 정해집니다.', ''], s, 'fq4')}` },
    { q: `${label} 말고 다른 장비가 맞을 수도 있나요?`, a: pick(['사람이 올라가면 스카이차, 자재를 싣고 와서 올리면 카고, 무겁거나 멀면 하이드로가 맞습니다.', `${place} 현장 조건을 듣고 ${label} 대신 스카이차나 다른 톤수를 권하기도 합니다.`], s, 'fq5') },
    { q: '야간이나 주말 작업도 가능한가요?', a: `행사 무대 트러스 설치 같은 야간 작업 사례가 있습니다. ${place} ${label} 일정을 듣고 안내합니다.` },
    { q: '도로에 크레인을 세워야 하는데 괜찮나요?', a: `도로·인도 점용은 관할 허가가 필요할 수 있어 ${place} 차량 위치를 먼저 확인합니다.` },
    { q: `${R} 말고 다른 지역도 되나요?`, a: `김포·파주·일산을 중심으로 경기북부, 서울 서부, 인천·부천을 다니며 ${place} 쪽 일정과 함께 잡기도 합니다.` },
    { q: '기사도 함께 오나요?', a: `네, 크레인 기사가 장비와 함께 ${place} 현장으로 나가 줄걸이와 신호를 맞춥니다.` },
    { q: '스카이차도 있나요?', a: `3.5톤·5톤 스카이차를 보유하고 있어 ${place} 현장의 간판·외벽처럼 사람이 올라가는 작업도 함께 상담합니다.` },
    { q: '현장을 먼저 봐 줄 수 있나요?', a: `${place}처럼 조건이 까다로운 현장은 답사 후 장비를 정하기도 합니다. ${place} 답사 일정은 전화로 맞춥니다.` },
    { q: '장비는 어디서 출발하나요?', a: `${place} 현장도 파주 차고지에서 출발합니다. ${R} 쪽은 ${sentence(r.access)}` },
  ];
  const faq = rotate(bank, s, 'faq').slice(0, 3);

  const closing = {
    heading: pick([`${place} ${label} 문의`, `${place} 작업 일정 확인`, `${label} 배차 문의`], s, 'ch'),
    text: pick([
      `${place} 현장 주소와 올릴 물건, 날짜를 알려주시면 장비와 시간을 잡아 드립니다.`,
      `제원 문의, 현장 답사, 견적 모두 받습니다. ${place} 쪽 일정은 전화가 빠릅니다.`,
      `현장 사진과 주소를 문자로 보내주시면 ${place} 현장은 보통 당일에 답을 드립니다.`,
    ], s, 'ct'),
  };

  const galleryAll = [
    { src: '/images/work-rooftop-lift.webp', alt: '카고크레인 옥상 자재 양중 작업' },
    { src: '/images/work-rooftop-unit.webp', alt: '건물 옥상 설비 양중 작업' },
    { src: '/images/work-stage-night.webp', alt: '야간 행사 무대 트러스 설치 크레인 작업' },
    { src: '/images/work-stage-truss.webp', alt: '대형 무대 트러스 양쪽 크레인 작업' },
    { src: '/images/work-concert.webp', alt: '야외 공연 무대 설치 크레인 작업' },
    { src: '/images/fleet-line.webp', alt: '파워크레인 보유 크레인 차고지' },
    { src: '/images/fleet-aerial.webp', alt: '파워크레인 하이드로크레인 차고지 항공 사진' },
  ];
  const gallery = rotate(galleryAll, s, 'gal').slice(0, 3).map((g) => ({ ...g, alt: `${place} ${label} - ${g.alt}` }));
  const heroImg = pick(['/images/fleet-yard.webp', '/images/fleet-trucks.webp', '/images/fleet-line.webp'], s, 'hero');

  return {
    title, description, h1sub, lead,
    cat: `${p.area} · ${R} · ${label}`,
    summary, facts, sections, heroImg, fleet: fleet.slice(0, 3), faq, closing, gallery,
  };
}
