'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { HomeContent } from '@/lib/types';
import { cx } from '@/lib/format';

export function HeroSlider({ slides }: { slides: HomeContent['slides'] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  if (!slides.length) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="relative h-[480px] overflow-hidden bg-navy md:h-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.title}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${slides.length}`}
          aria-hidden={i !== index}
          className={cx('absolute inset-0 transition-opacity duration-1000', i === index ? 'opacity-100' : 'pointer-events-none opacity-0')}
        >
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority={i === 0 ? 'high' : 'low'} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/90 via-navy-dark/60 to-transparent" />
          <div className="container-pmd relative flex h-full flex-col justify-center text-white">
            <p className="font-heading max-w-2xl text-4xl font-bold leading-tight md:text-6xl">{s.title}</p>
            <p className="mt-5 max-w-xl text-lg text-white/85 md:text-xl">{s.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={s.cta.href} className="btn btn-primary" tabIndex={i === index ? 0 : -1}>
                {s.cta.label} →
              </Link>
              <Link href="/contact" className="btn btn-outline-light" tabIndex={i === index ? 0 : -1}>
                Contact us
              </Link>
            </div>
          </div>
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}: ${s.title}`}
            aria-current={i === index}
            className={cx('h-2.5 rounded-full transition-all', i === index ? 'w-8 bg-green' : 'w-2.5 bg-white/60 hover:bg-white')}
          />
        ))}
      </div>
    </section>
  );
}
