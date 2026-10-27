// 사이트 설정 — 연락처·사업자 정보·도메인은 이 파일만 고치면 전 페이지에 반영된다.
// TODO(사업주 정보 수령 후): SITE_URL, PHONE, 사업자 정보 확정. 현재 값은 기존 사이트(01052572449.m7114.kr) 표기를 임시로 사용.

export const SITE_URL = process.env.SITE_URL || 'https://powercrane.example'; // 배포: SITE_URL=https://도메인 (scripts/deploy.sh)
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
//   OPEN_WAVE=1 npm run build  (1 = 시군구 468 / 2 = +생활권 1,086 / 3 = +동 크레인·카고·미니 2,271 / 4 = 전체 3,376)
export const OPEN_WAVE = Number(process.env.OPEN_WAVE || 1);

// 표기만 다른 키워드 페이지(고양/고양시, 강화/강화군 …)를 대표 페이지로 canonical 묶음 + 사이트맵 제외.
// 기본 false = 모든 키워드 페이지를 각자 색인 요청. 중복 판정이 우려되면 true.
export const MERGE_VARIANTS = true;

export const tel = `tel:${CONTACT.phone.replace(/[^0-9]/g, '')}`;
export const smsHref = `sms:${CONTACT.sms.replace(/[^0-9]/g, '')}`;
export const absUrl = (path: string) => `${SITE_URL}${path}`;
