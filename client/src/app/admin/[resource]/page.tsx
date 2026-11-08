import { Suspense } from 'react';
import { RESOURCES } from '@/components/admin/resources';
import { ResourceListRoute } from '@/components/admin/routes';

export function generateStaticParams() {
  return RESOURCES.map((r) => ({ resource: r.key }));
}

export default function ResourceListPage() {
  return (
    <Suspense fallback={<p className="text-grey">Loading…</p>}>
      <ResourceListRoute />
    </Suspense>
  );
}
