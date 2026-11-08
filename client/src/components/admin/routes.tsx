'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RESOURCE_MAP } from './resources';
import { ResourceForm } from './ResourceForm';
import { ResourceList } from './ResourceList';

function Unknown() {
  return (
    <div className="card max-w-md">
      <p className="font-semibold">Unknown section.</p>
      <Link href="/admin" className="mt-2 inline-block text-sm text-green">Back to dashboard</Link>
    </div>
  );
}

export function ResourceListRoute() {
  const { resource } = useParams<{ resource: string }>();
  const r = RESOURCE_MAP[resource];
  return r ? <ResourceList key={r.key} resource={r} /> : <Unknown />;
}

export function ResourceFormRoute() {
  const { resource, id } = useParams<{ resource: string; id: string }>();
  const r = RESOURCE_MAP[resource];
  if (!r || (id === 'new' && !r.canCreate)) return <Unknown />;
  return <ResourceForm key={`${r.key}-${id}`} resource={r} id={id} />;
}
