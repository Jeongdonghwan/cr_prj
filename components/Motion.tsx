'use client';
// 화면 효과 — 스크롤 등장(data-reveal), 숫자 카운트(data-count), 헤더 축소, 가로 스크롤 버튼(data-scroll).
// 움직임 줄이기 설정이면 바로 최종 상태로 둔다.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Motion() {
  // 링크로 페이지를 옮기면 새 요소에 효과를 다시 건다(없으면 새로고침 전까지 내용이 투명하게 남음)
  const pathname = usePathname();
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    root.classList.add('js');

    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], [data-count], .reveal-group'));
    const countUp = (el: HTMLElement) => {
      const to = Number(el.dataset.count);
      const dec = (el.dataset.count || '').includes('.') ? 1 : 0;
      if (reduce) { el.textContent = to.toFixed(dec); return; }
      const t0 = performance.now(), dur = 1200;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = (to * (1 - Math.pow(1 - k, 3))).toFixed(dec);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.add('in');
        if (el.dataset.count) countUp(el);
        io.unobserve(el);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    els.forEach((el) => (reduce ? (el.classList.add('in'), el.dataset.count && countUp(el)) : io.observe(el)));

    const onScroll = () => root.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const onClick = (ev: MouseEvent) => {
      const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-scroll]');
      if (!btn) return;
      const track = document.getElementById(btn.dataset.target || '');
      if (track) track.scrollBy({ left: Number(btn.dataset.scroll) * track.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
    };
    document.addEventListener('click', onClick);
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); document.removeEventListener('click', onClick); };
  }, [pathname]);
  return null;
}
