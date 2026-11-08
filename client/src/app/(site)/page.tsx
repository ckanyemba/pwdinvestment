import Image from 'next/image';
import Link from 'next/link';
import { HeroSlider } from '@/components/HeroSlider';
import { GoogleMap } from '@/components/GoogleMap';
import { getSite, getTestimonials, safe } from '@/lib/api';

export default async function HomePage() {
  const [{ site, home }, testimonials] = await Promise.all([getSite(), safe(getTestimonials, [])]);

  return (
    <>
      <HeroSlider slides={home.slides} />

      <section className="bg-green text-white">
        <div className="container-pmd flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-heading text-xl font-semibold">Looking to learn Forex trading?</p>
          <Link href="/enrol" className="btn bg-white text-green hover:bg-mist">
            Enrol now →
          </Link>
        </div>
      </section>

      {home.services.length > 0 && (
        <section className="bg-mist py-16 md:py-20">
          <div className="container-pmd grid gap-6 md:grid-cols-3">
            {home.services.map((s) => (
              <Link key={s.href} href={s.href} className="card group flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-lg">
                {s.image && (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image src={s.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-bold">{s.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed">{s.text}</p>
                  <span className="mt-4 text-sm font-bold text-green">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {home.quote && (
        <section
          className="bg-navy bg-cover bg-fixed bg-center py-20 text-center text-white"
          style={home.quoteImage ? { backgroundImage: `linear-gradient(rgba(13,26,48,.8),rgba(13,26,48,.8)),url("${home.quoteImage}")` } : undefined}
        >
          <blockquote className="container-pmd font-heading text-2xl font-semibold leading-snug md:text-3xl">
            “{home.quote}”
          </blockquote>
        </section>
      )}

      {home.industries.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container-pmd">
            <h2 className="section-title text-center">Industries</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {home.industries.map((i) => {
                const external = i.href.startsWith('http');
                return (
                  <Link
                    key={i.title}
                    href={i.href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-lg bg-slate-brand"
                  >
                    {i.image && <Image src={i.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform group-hover:scale-105" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 to-transparent" />
                    <div className="relative p-6 text-white">
                      <p className="font-heading text-xl font-bold">{i.title}</p>
                      <p className="mt-1 text-sm text-white/80">Click to find out more {external ? '↗' : '→'}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {home.stats.length > 0 && (
        <section className="bg-slate-brand py-14 text-white">
          <div className="container-pmd">
            <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
              Shaping the future. <span className="text-green">Together.</span>
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-5">
              {home.stats.map((s) => (
                <li key={s} className="border-l-2 border-green pl-4 font-semibold">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {home.whyUs.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container-pmd">
            <h2 className="section-title text-center">Why trade with us?</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {home.whyUs.map((w) => (
                <div key={w.title} className="card border-t-4 border-green text-center">
                  <h3 className="text-lg font-bold">{w.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="bg-mist py-16 md:py-20">
          <div className="container-pmd">
            <h2 className="section-title text-center">What our clients say</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {testimonials.map((t) => (
                <figure key={t._id} className="card">
                  <blockquote className="leading-relaxed text-slate-700">“{t.quote}”</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-bold text-navy">{t.name}</span>
                    {t.company && <span className="text-grey"> · {t.company}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {home.partners.length > 0 && (
        <section className="py-12" aria-label="Trading platforms and partners">
          <div className="container-pmd grid grid-cols-3 items-center gap-8 md:grid-cols-6">
            {home.partners
              .filter((p) => p.image)
              .map((p, idx) => {
                const img = <Image src={p.image!} alt={p.name} width={160} height={80} className="mx-auto h-14 w-auto object-contain grayscale transition hover:grayscale-0" />;
                return p.href ? (
                  <a key={idx} href={p.href} target="_blank" rel="noopener noreferrer" title={p.name}>
                    {img}
                  </a>
                ) : (
                  <div key={idx}>{img}</div>
                );
              })}
          </div>
        </section>
      )}

      <GoogleMap query={site.map.query} title="Find us here" className="h-[360px]" />

      {home.liveAccountUrl && (
        <section className="bg-navy py-16 text-center text-white">
          <div className="container-pmd">
            <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">Trade on the go!</h2>
            <a href={home.liveAccountUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-8">
              Open a live account →
            </a>
          </div>
        </section>
      )}
    </>
  );
}
