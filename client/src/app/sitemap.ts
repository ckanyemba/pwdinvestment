import type { MetadataRoute } from 'next';
import { getPages, getPosts, safe } from '@/lib/api';

const SITE_URL = (process.env.SITE_URL || 'https://pmdinvestment.co.za').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts] = await Promise.all([safe(getPages, []), safe(getPosts, [])]);
  const fixed = ['', '/contact', '/enrol', '/events', '/blog', '/downloads'].map((p) => ({ url: `${SITE_URL}${p}` }));
  return [
    ...fixed,
    ...pages.map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: p.updatedAt })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
