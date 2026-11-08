import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getSite, getYear } from '@/lib/api';

export default async function SiteLayout({ children }: LayoutProps<'/'>) {
  const [{ site, nav }, year] = await Promise.all([getSite(), getYear()]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-3">
        Skip to content
      </a>
      <SiteHeader site={site} nav={nav} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter site={site} nav={nav} year={year} />
    </>
  );
}
