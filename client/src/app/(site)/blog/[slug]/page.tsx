import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Prose } from '@/components/Prose';
import { getPost, getPosts, safe } from '@/lib/api';
import { formatDate } from '@/lib/format';

export async function generateStaticParams() {
  const posts = await safe(getPosts, []);
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: '__placeholder__' }];
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const post = await safe(() => getPost(slug), null);
  return post ? { title: post.title, description: post.excerpt, alternates: { canonical: `/blog/${post.slug}` } } : {};
}

async function Article({ params }: { params: PageProps<'/blog/[slug]'>['params'] }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return (
    <>
      <PageHeader title={post.title} crumbs={[{ label: 'Articles', href: '/blog' }, { label: post.title }]} image={post.coverImage} />
      <article className="container-pmd max-w-3xl py-14">
        <time className="text-sm font-semibold text-green" dateTime={post.publishedAt}>
          {formatDate(post.publishedAt)}
        </time>
        <Prose html={post.content} className="mt-6" />
      </article>
    </>
  );
}

export default function PostPage(props: PageProps<'/blog/[slug]'>) {
  return (
    <Suspense fallback={<div className="container-pmd py-24 text-center text-grey">Loading…</div>}>
      <Article params={props.params} />
    </Suspense>
  );
}
