import Image from 'next/image';
import Link from 'next/link';
import type { NavItem, SiteInfo } from '@/lib/types';
import { telHref } from '@/lib/format';
import { MobileNav } from './MobileNav';

export function buildNav(nav: NavItem[]) {
  // Pages flagged with navOrder in the CMS, plus native routes.
  const fromCms = nav.filter((n) => !['about', 'contact'].includes(n.slug)).map((n) => ({ href: `/${n.slug}`, label: n.navLabel || n.title }));
  return [...fromCms, { href: '/events', label: 'Events' }, { href: '/about', label: 'About' }, { href: '/contact', label: 'Contact' }];
}

export function SiteHeader({ site, nav }: { site: SiteInfo; nav: NavItem[] }) {
  const links = buildNav(nav);
  return (
    <header className="sticky top-0 z-40 bg-white/95 shadow-sm backdrop-blur">
      <div className="hidden bg-navy text-sm text-white/85 md:block">
        <div className="container-pmd flex items-center justify-between py-2">
          <p className="truncate">{site.tagline}</p>
          <div className="flex shrink-0 gap-5">
            <a href={telHref(site.phone)} className="hover:text-white">
              {site.phone}
            </a>
            <a href={`mailto:${site.emails.general}`} className="hover:text-white">
              {site.emails.general}
            </a>
          </div>
        </div>
      </div>
      <div className="container-pmd flex items-center justify-between gap-6 py-3">
        <Link href="/" className="shrink-0" aria-label={`${site.name} home`}>
          <Image src="/logo.png" alt={site.name} width={220} height={78} priority className="h-12 w-auto md:h-14" />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 text-[15px] font-semibold text-navy">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="whitespace-nowrap rounded px-2.5 py-2 hover:bg-mist hover:text-green">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/enrol" className="btn btn-primary hidden sm:inline-flex">
            Enrol now
          </Link>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
