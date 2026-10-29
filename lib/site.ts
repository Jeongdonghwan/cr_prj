// 사이트 설정 — 연락처·사업자 정보·도메인은 이 파일만 고치면 전 페이지에 반영된다.
// TODO(사업주 정보 수령 후): SITE_URL, PHONE, 사업자 정보 확정. 현재 값은 기존 사이트(01052572449.m7114.kr) 표기를 임시로 사용.

export const SITE_URL = process.env.SITE_URL || 'https://xn--om2b13y1oao00a7id.kr'; // 파워크레인.kr (퓨니코드). 배포: bash scripts/deploy.sh <단계> <URL>
export const BRAND = '파워크레인';
export const SITE_NAME = '파워크레인 | 크레인 임대·작업';

export const CONTACT = {
  phone: '010-5257-2449', // TODO: 문의 받을 번호 확정 (현재 사이트 번호 임시)
  sms: '010-5257-2449',
  kakao: '', // 카카오톡 채널 URL (없으면 버튼 숨김)
  hours: '', // 예: '매일 06:00~22:00' (비우면 표시 안 함)
};

export const BUSINESS = {
  name: '파워크레인',
  ceo: '', // TODO
  bizNumber: '', // TODO 사업자등록번호
  address: '경기도 파주시 심학산로 234', // 기존 사이트 표기
  email: '',
};

// 순차 오픈: 이 단계 이하의 페이지만 빌드·사이트맵·내부링크에 포함된다.
//   OPEN_WAVE=1 npm run build  (post-launch 7일 오픈: 1 = 10/28 시군구 468 / 2 = 10/30 1,688 / 3 = 11/1 2,532 / 4 = 11/3 전체 3,376 — scripts/drip/rebatch.py)
export const OPEN_WAVE = Number(process.env.OPEN_WAVE || 1);

// 표기만 다른 키워드 페이지(고양/고양시, 강화/강화군 …)를 대표 페이지로 canonical 묶음 + 사이트맵 제외.
// 기본 false = 모든 키워드 페이지를 각자 색인 요청. 중복 판정이 우려되면 true.
export const MERGE_VARIANTS = true;

export const tel = `tel:${CONTACT.phone.replace(/[^0-9]/g, '')}`;
export const smsHref = `sms:${CONTACT.sms.replace(/[^0-9]/g, '')}`;
export const absUrl = (path: string) => `${SITE_URL}${path}`;

// og·트위터 카드: public/og/<key>.jpg (scripts/make_og.py 로 생성)
export const shareMeta = (key: string, alt: string, o: { title?: string; description?: string; url?: string } = {}) => {
  const images = [{ url: `${SITE_URL}/og/${encodeURIComponent(key)}.jpg`, width: 1200, height: 630, alt }];
  return {
    openGraph: { type: 'website' as const, siteName: SITE_NAME, locale: 'ko_KR', ...o, images },
    twitter: { card: 'summary_large_image' as const, title: o.title, description: o.description, images },
  };
};

// 서치어드바이저(네이버)·서치콘솔(구글) HTML 태그 소유확인 — content 값만
export const NAVER_VERIFY = '4c4bdd26f3b73a7be8bfc3668f9c66bcbf1da143';
export const GOOGLE_VERIFY = '';
