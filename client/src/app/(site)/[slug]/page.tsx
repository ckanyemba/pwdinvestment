import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Prose } from '@/components/Prose';
import { getPage, getPages, safe } from '@/lib/api';

// Generic CMS page (Forex, Share Market, Education, Disclaimer, …).
export async function generateStaticParams() {
  const pages = await safe(getPages, []);
  // Cache Components requires at least one param; the placeholder resolves to notFound().
  return pages.length ? pages.map((p) => ({ slug: p.slug })) : [{ slug: '__placeholder__' }];
}

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const page = await safe(() => getPage(slug), null);
  if (!page) return {};
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.excerpt,
    alternates: { canonical: `/${page.slug}` },
  };
}

async function CmsPage({ params }: { params: PageProps<'/[slug]'>['params'] }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <>
      <PageHeader title={page.title} crumbs={[{ label: page.title }]} image={page.heroImage} />
      <div className="container-pmd grid gap-12 py-14 lg:grid-cols-[1fr_300px]">
        <article>
          <Prose html={page.content} />
        </article>
        <aside className="space-y-6">
          <div className="card bg-navy text-white ring-0">
            <p className="font-heading text-lg font-bold text-white">Ready to start trading?</p>
            <p className="mt-2 text-sm text-white/80">Join our Financial Markets Trading Course and learn from experienced traders.</p>
            <Link href="/enrol" className="btn btn-primary mt-4 w-full">
              Enrol now
            </Link>
          </div>
          <div className="card">
            <p className="font-heading font-bold text-navy">Need help?</p>
            <p className="mt-2 text-sm">Speak to one of our consultants.</p>
            <Link href="/contact" className="btn btn-ghost mt-4 w-full">
              Contact us
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function Page(props: PageProps<'/[slug]'>) {
  return (
    <Suspense fallback={<div className="container-pmd py-24 text-center text-grey">Loading…</div>}>
      <CmsPage params={props.params} />
    </Suspense>
  );
}
