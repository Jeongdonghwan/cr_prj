// 본문 조합기 — 키워드 페이지 하나의 모든 문장을 만든다.
// 원칙: 보유 장비는 data/fleet.json(기존 사이트 표기)만 사실로 쓰고, 가격·시간 같은 수치는 지어내지 않는다.
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
  title: string; description: string; h1: string; lead: string; eyebrow: string;
  specs: [string, string][]; heroImg: string; nearby: string[]; fleetIds: string[];
  intro: string[];
  region: { heading: string; body: string; hotspots: string[]; demand: string[] };
  fleetHeading: string; fleetNote: string; fleet: Fleet[];
  guide: { heading: string; paras: string[]; checks: string[]; pitfalls: string[] };
  jobs: { heading: string; items: { name: string; text: string; season: string }[] };
  sites: { heading: string; items: { place: string; job: string; text: string }[] };
  steps: { title: string; text: string }[];
  info: [string, string][];
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
  const fleet = rotate(t.fleet.map((id) => fleetById.get(id)!).filter(Boolean), s, 'fleet');
  const fleet2 = fleet.slice(0, 2).map((f) => f.name).join('·');
  const hs = rotate(r.hotspots, s, 'hot');
  const dm = rotate(r.demand, s, 'dem');
  const eq = t.equip ? EQUIPMENT.find((e) => e.slug === t.equip) : undefined;
  const ton = t.ton ? TONS.find((x) => x.slug === t.ton) : undefined;

  // ---- 메타 ----
  const title = pick([
    `${p.kw} | ${t.short} 배차·견적 상담 - ${BRAND}`,
    `${p.kw} 전문 ${BRAND} | ${r.kw} 현장 출동`,
    `${p.kw} - ${hs[0]} 현장 ${t.short} 작업 안내 | ${BRAND}`,
  ], s, 'title');
  const description = `${full} ${label} 상담. ${hs[0]}·${hs[1]} 등 ${r.name} 현장에 ${fleet2} 배차, 무게·높이·반경 확인 후 견적 안내. ${BRAND} ${CONTACT.phone}`;

  // ---- 히어로 ----
  const lead = pick([
    `${place} 현장에는 ${j(fleet2, '을')} 주로 보냅니다. 올릴 물건 무게와 설치 높이를 알려주시면 톤수를 정해 드립니다.`,
    `${hs[0]}, ${hs[1]} 쪽 작업을 자주 다닙니다. ${place} 일정은 전화로 바로 확인됩니다.`,
    `${j(dm[0], '과')} ${dm[1]} 작업이 많습니다. ${place} 현장 사진을 문자로 보내주시면 장비부터 맞춰 봅니다.`,
    `파주 차고지에서 출발합니다. ${place} ${label} 작업은 기사가 함께 나가 줄걸이와 신호까지 맡습니다.`,
  ], s, 'lead');

  // ---- 도입 ----
  const intros = [
    `${place}에서 ${j(label, '을')} 찾는 현장은 대부분 ${j(dm[0], '이나')} ${dm[1]} 작업입니다. ${BRAND}는 김포·파주·일산을 중심으로 일하며 ${r.area} 현장까지 장비를 보내고, 올릴 물건의 무게와 높이, 차량에서 설치 지점까지의 거리를 먼저 듣고 톤수를 정합니다.`,
    `${r.name}의 현장 성격은 분명합니다. ${r.traits}. ${place} ${label} 문의도 이 흐름 안에서 들어오기 때문에, 현장 종류를 들으면 필요한 장비가 대략 정해집니다.`,
    `크레인은 톤수보다 현장 조건이 먼저입니다. ${place}처럼 ${hs[0]} 주변 현장은 진입로 폭과 아웃트리거를 펼칠 공간부터 확인해야 ${label} 배차가 정확해지고, 당일에 장비를 바꾸는 일이 생기지 않습니다.`,
    `${place} ${label} 문의는 사진으로 시작하면 빠릅니다. 올릴 물건, 설치 위치, 차량을 세울 곳을 찍어 문자로 보내주시면 보유 장비 중 맞는 차량과 작업 방법을 안내합니다.`,
    `${hs[1]} 같은 현장이 많은 ${r.name}에서는 같은 ${label} 작업이라도 건물 높이와 도로 사정에 따라 장비가 달라집니다. ${place} 현장도 무게·높이·반경 세 가지를 먼저 확인합니다.`,
  ];
  const [i1, i2] = rotate(intros, s, 'intro');  // 서로 다른 변형 두 개
  const intro = [i1, i2];

  // ---- 지역 ---- (같은 상위 지역의 다른 동 이름을 돌려 넣어 페이지마다 다른 문장)
  const nearby = rotate(Array.from(new Set(ALL_PAGES.filter((x) => x.parent === p.parent && x.level === '동·읍면' && x.place !== place)
    .map((x) => x.place.split(' ').slice(-1)[0]))), s, 'near').slice(0, 4);
  const nearLine = nearby.length >= 3
    ? (p.level === '동·읍면'
      ? `${place} 현장을 오가는 길에 ${nearby.slice(0, 3).join('·')} 현장도 함께 다닙니다.`
      : `${r.name} 안에서는 ${nearby.join('·')} 같은 동네 현장까지 다닙니다.`)
    : '';
  const region = {
    heading: pick([`${place} 주변 현장`, `${j(r.name, '은')} 이런 곳입니다`, `${r.kw} 현장 사정`], s, 'rh'),
    body: `${r.traits}. ${pick([
      `${place} 인근에서는 ${j(hs[0], '과')} ${hs[1]} 쪽 작업 문의가 꾸준합니다.`,
      `그래서 ${place} 현장 상담은 ${dm[0]} 문의가 가장 많고, ${dm[1]} 작업이 뒤를 잇습니다.`,
      `출동 동선은 ${sentence(r.access)}`,
    ], s, 'rb')} ${nearLine}`.trim(),
    hotspots: hs,
    demand: dm,
  };

  // ---- 장비/톤수 가이드 ----
  const guide = { heading: '', paras: [] as string[], checks: [] as string[], pitfalls: [] as string[] };
  if (eq) {
    guide.heading = pick([`${label}, 이럴 때 맞습니다`, `${place} ${label} 고르는 기준`, `${j(label, '이')} 필요한 현장인지 확인하세요`], s, 'gh');
    guide.paras = [
      `${j(label, '은')} ${eq.intent}에 쓰는 장비입니다. 일반적인 제원 범위는 ${eq.range}이고, ${eq.jobs.slice(0, 3).join(', ')} 작업에 많이 씁니다.`,
      `${place} 현장에서는 ${dm[0]} 작업과 연결되는 경우가 많습니다. ${eq.pageQuestion} 판단이 서지 않으면 현장 사진으로 먼저 확인해 드립니다.`,
    ];
    guide.checks = rotate<string>(eq.checks, s, 'chk').slice(0, 2);
    guide.pitfalls = rotate<string>(eq.pitfalls, s, 'pit').slice(0, 1);
  } else if (ton) {
    guide.heading = pick([`${j(label, '으로')} 할 수 있는 작업`, `${ton.name}급이 맞는 현장`, `${place}에서 ${j(ton.name, '을')} 고르는 이유`], s, 'gh');
    guide.paras = [
      `${ton.name}급은 ${ton.typical} 작업에 주로 씁니다. 일반적인 제원은 ${ton.reach} 정도이고, ${ton.fit} 같은 작업에 맞습니다.`,
      `${ton.limit}. ${place}처럼 ${hs[0]} 주변 현장은 차량을 세울 위치에 따라 같은 무게도 필요한 톤수가 달라집니다.`,
    ];
    guide.checks = ['올릴 물건의 무게(명판·도면 기준)', '설치 높이와 차량에서 설치 지점까지 거리', '차량 진입로와 아웃트리거 펼칠 공간'];
    guide.pitfalls = ['무게만 보고 톤수를 정하면 반경 때문에 작업이 안 될 수 있습니다', '도로 위에 장비를 세우면 관할 기관의 도로 점용 절차가 필요할 수 있습니다'];
  } else {
    guide.heading = pick([`${t.rental ? '크레인 임대' : '크레인'} 이렇게 진행합니다`, `${place} ${label} 전에 알아두세요`, `톤수는 이렇게 정합니다`], s, 'gh');
    guide.paras = [
      p.type === '크레인 임대'
        ? `임대는 기사 포함입니다. 전문 기사가 함께 출동해 줄걸이와 신호를 맞춥니다. ${place}처럼 ${dm[0]} 작업이 이어지는 현장은 여러 날 단위 일정도 상담합니다.`
        : p.type === '크레인 대여'
          ? `대여는 반나절 작업부터 받습니다. ${j(dm[1], '처럼')} 짧게 끝나는 일도 ${place} 주소와 시간만 알려주시면 일정을 잡습니다.`.replace('처럼처럼', '처럼')
          : `크레인은 무게, 높이, 설치 지점까지의 거리로 고릅니다. 같은 1톤도 멀리 뻗을수록 큰 장비가 필요합니다.`,
      `${place} 현장의 ${dm[0]}처럼 작업 종류를 알려주시면 스카이차부터 100톤까지 보유 장비 중에서 고릅니다.`,
    ];
    guide.checks = ['양중물 무게와 크기', '올릴 높이와 작업 반경', '진입로·주차 공간과 전선·가로수 위치'];
    guide.pitfalls = ['현장 사진 없이 톤수를 정하면 당일 장비 교체가 생길 수 있습니다', '아파트·상가는 관리사무소 작업 신고를 먼저 해두면 작업이 빨라집니다'];
  }

  // ---- 작업 종류 (용도 데이터에서 타입·지역 수요에 맞는 것) ----
  const kindName = t.equip || (ton ? (Number(ton.slug.replace('톤', '')) >= 25 ? '하이드로크레인' : '카고크레인') : '');
  let uses = USES.filter((u) => !kindName || u.equip.includes(kindName) || kindName === '미니크레인');
  if (uses.length < 4) uses = USES;
  const demandText = r.demand.join(' ') + r.traits;
  uses = [...uses].sort((a, b) => Number(demandText.includes(b.kw)) - Number(demandText.includes(a.kw)));
  const chosen = [...uses.slice(0, 1), ...rotate(uses.slice(1), s, 'uses')].slice(0, 4);
  const jobs = {
    heading: pick([`${place}에서 많이 하는 작업`, `${j(label, '으로')} 하는 일`, '주요 작업'], s, 'jh'),
    items: chosen.map((u, i) => ({
      name: u.name,
      // 현장 이름·장비를 넣고 설명은 첫 구절만 — 같은 작업 카드가 페이지마다 같은 문장이 되지 않게
      text: `${hs[i % hs.length]} 같은 현장의 ${j(u.name, '은')} ${j(u.equip.join('·'), '으로')} 진행합니다. ${u.detail.split(/[,.]/)[0].trim()}.`,
      season: u.season,
    })),
  };

  // ---- 절차 (5단계 고정) ----
  // ---- 현장별 작업 (지역 hotspots × 용도 × 이 페이지 장비) — 페이지마다 다른 고유 문장의 핵심 ----
  const RULES: [RegExp, string[]][] = [
    [/공항|항만|항 |부두|물류/, ['컨테이너상하차', '중량물운반']],
    [/산단|산업단지|공단|공장|창고|테크노|밸리/, ['공장설비반입', '판넬시공', '컨테이너상하차']],
    [/오피스|DMC|디지털|금융|R&D|연구|지식산업/, ['옥상장비양중', '공장설비반입']],
    [/재개발|재건축|택지|지구|신도시|뉴타운|신축/, ['에어컨실외기', '유리설치', '철골조립']],
    [/아파트|주택|주거/, ['에어컨실외기', '이사양중']],
    [/상권|역|거리|상가|시장|킨텍스|전시/, ['간판설치', '유리설치']],
    [/농|축사|읍|면|펜션|카페|관광|캠핑|전원|조경|농원/, ['조경수이식', '판넬시공', '태양광설치']],
  ];
  const kindOf = (u: any) => (u.equip as string[]).find((k: string) => fleet.some((f) => f.kind === k));
  const siteItems = hs.slice(0, 3).map((h, i) => {
    const pool = RULES.find(([re]) => re.test(h))?.[1] || ['중량물운반', '간판설치'];
    const u = USES.find((x) => x.slug === pool[(i + seedOf(s)) % pool.length]) || USES[0];
    const k = kindOf(u);
    const f = fleet.find((x) => x.kind === k) || fleet[i % fleet.length];
    const first = u.detail.split(/[.,]/)[0].trim();
    const text = pick([
      `${h} 쪽 ${u.name} 작업은 ${j(f.name, '이')} 맡습니다. ${first}. ${u.checks[0]}부터 확인합니다.`,
      `${h}에서는 ${j(u.name, '이')} 많습니다. ${first}. 이 현장에는 ${j(f.name, '을')} 보내고, ${u.checks[1] || u.checks[0]}를 먼저 봅니다.`,
      `${j(u.name, '이')} 잦은 ${h} 현장. ${first}. ${f.name} 기준으로 일정을 잡고, 시기는 ${u.season}에 몰립니다.`,
    ], s, `site${i}`);
    return { place: h, job: u.name, text };
  });
  const sites = { heading: pick([`${r.kw} 현장별로 보면`, `${place} 주변, 현장마다 다른 장비`, `${r.kw}에서 자주 가는 현장 세 곳`], s, 'sth'), items: siteItems };

  const steps = pick([
    [
      { title: '전화·문자 상담', text: `${place} 주소와 작업 내용, 가능하면 사진을 보내주세요.` },
      { title: '조건 확인', text: '무게·높이·반경으로 톤수를 정합니다.' },
      { title: '배차·견적', text: `${fleet[0].name} 등 맞는 차량과 시간을 정합니다.` },
      { title: '출동·작업', text: '전문 기사가 아웃트리거를 펴고 신호에 맞춰 작업합니다.' },
      { title: '마무리', text: '고정 상태를 확인하고 철수합니다.' },
    ],
    [
      { title: '현장 사진 보내기', text: `${hs[0]} 등 ${place} 현장 위치와 올릴 물건을 알려주세요.` },
      { title: '톤수 결정', text: '설치 지점까지 거리가 멀수록 한 단계 큰 장비를 권합니다.' },
      { title: '일정 확정', text: `${fleet[0].name} 배차 일정과 작업 시간을 맞춥니다.` },
      { title: '양중 작업', text: '줄걸이와 신호수 위치를 정하고 작업합니다.' },
      { title: '확인 후 철수', text: '설치 위치를 함께 확인하고 장비를 뺍니다.' },
    ],
    [
      { title: '상담 접수', text: `${place} ${label} 문의를 전화나 문자로 받습니다.` },
      { title: '장비 선택', text: `${dm[0]} 같은 작업 종류를 듣고 차량을 고릅니다.` },
      { title: '견적 안내', text: '작업 시간과 거리를 반영해 견적을 드립니다.' },
      { title: '현장 작업', text: `${fleet[0].name} 기사가 출동해 작업합니다.` },
      { title: '마무리 점검', text: '추가 일정이 있으면 그 자리에서 잡습니다.' },
    ],
  ], s, 'steps');

  const info: [string, string][] = [
    ['작업 지역', full],
    ['권역', `${p.area} · ${r.name}`],
    ['주요 현장', hs.slice(0, 3).join(', ')],
    ['배차 장비', fleet.slice(0, 3).map((f) => f.name).join(', ')],
    ['출동', r.access.replace(/[.。]$/, '')],
    ...(CONTACT.hours ? [['상담 시간', CONTACT.hours] as [string, string]] : []),
    ['문의', CONTACT.phone],
  ];

  // ---- FAQ (뱅크에서 4개) ----
  const bank = [
    { q: `${place} ${label} 비용은 어떻게 정해지나요?`, a: `톤수, 작업 시간, ${place}까지 거리, 야간·휴일 여부로 정해집니다. 사진을 보고 안내합니다.` },
    { q: `${place}까지 출동이 되나요?`, a: `네, ${r.name} 전역으로 출동합니다. 동선은 ${sentence(r.access)} 일정이 비어 있으면 당일 배차도 상담합니다.` },
    { q: '몇 톤이 필요한지 모르겠어요.', a: `무게·높이·거리를 알려주시거나 ${place} 현장 사진을 보내주시면 맞는 톤수를 골라 드립니다.` },
    { q: '작업 전에 준비할 것이 있나요?', a: `${guide.checks.slice(0, 2).join(', ')} 정도를 미리 확인해 주세요. 아파트·상가라면 관리사무소 작업 신고도 먼저 해두면 좋습니다.` },
    { q: `${label} 말고 다른 장비가 맞을 수도 있나요?`, a: '사람이 올라가면 스카이차, 자재를 싣고 와서 올리면 카고, 무겁거나 멀면 하이드로가 맞습니다.' },
    { q: '야간이나 주말 작업도 가능한가요?', a: '행사 무대 트러스 설치 같은 야간 작업 사례가 있습니다. 일정을 듣고 안내합니다.' },
    { q: '도로에 크레인을 세워야 하는데 괜찮나요?', a: `도로·인도 점용은 관할 허가가 필요할 수 있어 ${place} 차량 위치를 먼저 확인합니다.` },
    { q: `${r.name} 말고 다른 지역도 되나요?`, a: `김포·파주·일산을 중심으로 경기북부, 서울 서부, 인천·부천을 다닙니다.` },
  ];
  const faq = rotate(bank, s, 'faq').slice(0, 4);

  const closing = {
    heading: pick([`${place} ${label} 문의`, `${place} 작업 일정 확인`, `${label} 배차 문의`], s, 'ch'),
    text: pick([
      `${place} 현장 주소와 올릴 물건, 날짜를 알려주시면 장비와 시간을 잡아 드립니다.`,
      `제원 문의, 현장 답사, 견적 모두 받습니다. ${place} 쪽 일정은 전화가 빠릅니다.`,
      `사진 한 장과 주소면 됩니다. ${place} 현장은 보통 당일에 답을 드립니다.`,
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
  const gallery = rotate(galleryAll, s, 'gal').slice(0, 5).map((g) => ({ ...g, alt: `${place} ${label} - ${g.alt}` }));
  const heroImg = pick(['/images/fleet-yard.webp', '/images/fleet-trucks.webp', '/images/fleet-line.webp'], s, 'hero');

  return {
    title, description, h1: p.kw,
    eyebrow: `${p.area} · ${r.name}`,
    lead,
    specs: [['지역', full], ['장비', fleet2], ['상담', '전화 · 문자 · 현장 사진']],
    nearby, fleetIds: t.fleet,
    heroImg,
    intro, region,
    fleetHeading: pick([`${label} 배차 장비`, `${place}에 보내는 장비`, '보유 장비'], s, 'fh'),
    fleetNote: t.note, fleet: fleet.slice(0, 4),
    guide, jobs, sites, steps, info, faq, closing, gallery,
  };
}
