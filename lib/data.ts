// 데이터 로더 — data/site-pages.json(키워드 페이지), 지역, 장비. 서버(빌드) 전용.
import pagesData from '../data/site-pages.json';
import regionsA from '../data/regions.json';
import regionsB from '../data/regions-incheon.json';
import fleetData from '../data/fleet.json';
import equipmentData from '../data/equipment.json';
import tonsData from '../data/tons.json';
import usesData from '../data/uses.json';
import { OPEN_WAVE, MERGE_VARIANTS } from './site';

export interface Page {
  no: number; kw: string; slug: string; place: string; type: string;
  level: string; area: string; parent: string; wave: number; variantOf?: string;
}
export interface Region {
  slug: string; name: string; kw: string; area: string; containedIn: string;
  traits: string; hotspots: string[]; demand: string[]; access: string;
}

export const ALL_PAGES = pagesData.pages as Page[];
export const OPEN_PAGES = ALL_PAGES.filter((p) => p.wave <= OPEN_WAVE);
const openSet = new Set(OPEN_PAGES.map((p) => p.slug));
export const isOpen = (slug: string) => openSet.has(slug);

const REGIONS = [...(regionsA.regions as any[]), ...(regionsB.regions as any[])] as Region[];
const regionByName = new Map(REGIONS.map((r) => [r.name, r]));
export const regionOf = (p: Page) => regionByName.get(p.parent)!;

export const FLEET = fleetData.fleet;
export const EQUIPMENT = equipmentData.equipment as any[];
export const TONS = tonsData.tons as any[];
export const USES = usesData.uses as any[];

export const pagePath = (p: Page) => `/${p.slug}/`;
export const pageEncodedPath = (p: Page) => `/${encodeURIComponent(p.slug)}/`;

// canonical: 스위치가 켜져 있고 대표 페이지가 열려 있으면 대표 페이지로
export const canonicalPath = (p: Page) =>
  MERGE_VARIANTS && p.variantOf && openSet.has(p.variantOf) ? `/${encodeURIComponent(p.variantOf)}/` : pageEncodedPath(p);
export const inSitemap = (p: Page) => canonicalPath(p) === pageEncodedPath(p);

export function getPage(slug: string): Page | undefined {
  let key = slug;
  try { key = decodeURIComponent(slug); } catch {}
  return OPEN_PAGES.find((p) => p.slug === key);
}

// 상위 지역별 대표 페이지: 시군구 '○○ 크레인' (없으면 그 지역 첫 오픈 페이지)
export function regionHub(parent: string): Page | undefined {
  const own = OPEN_PAGES.filter((p) => p.parent === parent);
  return own.find((p) => p.level === '시군구' && p.type === '크레인') || own[0];
}

// 오픈된 상위 지역 목록 (권역별)
export function openRegions(): { area: string; regions: { region: Region; hub: Page; count: number }[] }[] {
  const areas = new Map<string, { region: Region; hub: Page; count: number }[]>();
  for (const name of Array.from(new Set(OPEN_PAGES.map((p) => p.parent)))) {
    const region = regionByName.get(name)!;
    const hub = regionHub(name)!;
    const count = OPEN_PAGES.filter((p) => p.parent === name).length;
    if (!areas.has(region.area)) areas.set(region.area, []);
    areas.get(region.area)!.push({ region, hub, count });
  }
  const order = ['경기북부', '서울서부', '인천·부천'];
  return order.filter((a) => areas.has(a)).map((area) => ({ area, regions: areas.get(area)! }));
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
};
export const seedOf = hash;

// 관련 페이지 — 오픈된 페이지만. 같은 장소 다른 장비 / 같은 상위 지역 같은 장비 / 이웃 장소
export function related(p: Page) {
  const pool = OPEN_PAGES.filter((x) => x.slug !== p.slug);
  const rot = <T,>(arr: T[], n: number) => {
    if (!arr.length) return arr;
    const k = hash(p.slug) % arr.length;
    return [...arr.slice(k), ...arr.slice(0, k)].slice(0, n);
  };
  const samePlace = pool.filter((x) => x.place === p.place && x.parent === p.parent);
  const sameType = rot(pool.filter((x) => x.parent === p.parent && x.type === p.type && x.place !== p.place), 10);
  const otherAreas = rot(pool.filter((x) => x.parent !== p.parent && x.type === p.type && x.level === '시군구'), 6);
  return { samePlace, sameType, otherAreas };
}
