import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { getPosts, safe } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Articles', description: 'Insights on trading, investing and protecting yourself from scams.' };

export default async function BlogPage() {
  const posts = await safe(getPosts, []);
  return (
    <>
      <PageHeader title="Articles" crumbs={[{ label: 'Articles' }]} />
      <div className="container-pmd py-14">
        {posts.length === 0 ? (
          <p className="text-grey">No articles yet.</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p._id} className="card flex flex-col">
                <time className="text-xs font-semibold uppercase tracking-wide text-green" dateTime={p.publishedAt}>
                  {formatDate(p.publishedAt)}
                </time>
                <h2 className="mt-2 text-xl font-bold">
                  <Link href={`/blog/${p.slug}`} className="hover:text-green">
                    {p.title}
                  </Link>
                </h2>
                {p.excerpt && <p className="mt-3 flex-1 text-sm leading-relaxed">{p.excerpt}</p>}
                <Link href={`/blog/${p.slug}`} className="mt-4 text-sm font-bold text-green">
                  Read article →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
