'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// Shown when a page's content can't be loaded (usually the API is unreachable) instead of an
// uncaught Server Components error.
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-pmd py-24 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-green">Temporarily unavailable</p>
      <h1 className="mt-2 text-4xl font-bold">We couldn&apos;t load this page</h1>
      <p className="mx-auto mt-4 max-w-md">Please try again in a moment. If the problem continues, get in touch with us.</p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" onClick={() => retry()} className="btn btn-primary">
          Try again
        </button>
        <Link href="/contact" className="btn btn-ghost">
          Contact us
        </Link>
      </div>
    </div>
  );
}
