// 한국어 조사 자동 선택 — '카고크레인을', '스카이차를', '일산으로', '파주로'

function finalConsonant(word: string): boolean | null {
  const ch = word.trim().replace(/[)\]"'』」]+$/, '').slice(-1);
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) {
    if (/[0136780]/.test(ch)) return true;
    if (/[2459]/.test(ch)) return false;
    if (/[lmnr]/i.test(ch)) return true;
    return null;
  }
  return (code - 0xac00) % 28 !== 0;
}

const PAIRS: Record<string, [string, string]> = {
  은: ['은', '는'], 는: ['은', '는'], 이: ['이', '가'], 가: ['이', '가'], 을: ['을', '를'], 를: ['을', '를'],
  과: ['과', '와'], 와: ['과', '와'], 으로: ['으로', '로'], 로: ['으로', '로'], 이나: ['이나', '나'], 나: ['이나', '나'],
};

export function josa(word: string, type: string): string {
  const pair = PAIRS[type];
  if (!pair) return type;
  const f = finalConsonant(word);
  if (f === null) return pair[1];
  if (type === '으로' || type === '로') {
    const code = word.trim().slice(-1).charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 8) return '로'; // ㄹ 받침
  }
  return f ? pair[0] : pair[1];
}

export const j = (word: string, type: string) => `${word}${josa(word, type)}`;
