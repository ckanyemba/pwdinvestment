import { Suspense } from 'react';
import { RESOURCES } from '@/components/admin/resources';
import { ResourceFormRoute } from '@/components/admin/routes';

// Record ids are only known at runtime; prerender the "new" form for each resource and serve
// the app shell for everything else.
export function generateStaticParams() {
  return RESOURCES.map((r) => ({ resource: r.key, id: 'new' }));
}

export default function ResourceEditPage() {
  return (
    <Suspense fallback={<p className="text-grey">Loading…</p>}>
      <ResourceFormRoute />
    </Suspense>
  );
}
