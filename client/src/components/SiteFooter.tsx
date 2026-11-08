import Link from 'next/link';
import type { NavItem, SiteInfo } from '@/lib/types';
import { telHref } from '@/lib/format';
import { buildNav } from './SiteHeader';

export function SiteFooter({ site, nav, year }: { site: SiteInfo; nav: NavItem[]; year: number }) {
  return (
    <footer className="bg-navy-dark text-white/80">
      <div className="container-pmd grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-heading text-xl font-bold text-white">{site.name}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed">{site.tagline}</p>
          <div className="mt-5 flex gap-4 text-sm">
            {site.social.facebook && <a href={site.social.facebook} className="hover:text-green" target="_blank" rel="noopener noreferrer">Facebook</a>}
            {site.social.twitter && <a href={site.social.twitter} className="hover:text-green" target="_blank" rel="noopener noreferrer">X / Twitter</a>}
            {site.social.linkedin && <a href={site.social.linkedin} className="hover:text-green" target="_blank" rel="noopener noreferrer">LinkedIn</a>}
          </div>
        </div>
        <div>
          <p className="font-heading font-semibold text-white">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {buildNav(nav).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-green">{l.label}</Link>
              </li>
            ))}
            <li><Link href="/blog" className="hover:text-green">Articles</Link></li>
            <li><Link href="/downloads" className="hover:text-green">Forms &amp; downloads</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-heading font-semibold text-white">Visit us</p>
          <address className="mt-3 text-sm not-italic leading-relaxed">
            {site.address.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </address>
          <p className="mt-3 text-sm">
            Tel: <a href={telHref(site.phone)} className="hover:text-green">{site.phone}</a>
            <br />
            <a href={`mailto:${site.emails.general}`} className="hover:text-green">{site.emails.general}</a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-pmd flex flex-col gap-2 py-5 text-xs sm:flex-row sm:justify-between">
          <p>© {year} {site.name}. All rights reserved.</p>
          <p>
            <Link href="/disclaimer" className="hover:text-green">Risk disclaimer</Link> · Trading financial instruments carries a high level of risk.
          </p>
        </div>
      </div>
    </footer>
  );
}
