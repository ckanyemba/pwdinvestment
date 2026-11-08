'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/client-api';
import type { Paginated } from '@/lib/types';
import { Cell } from './format';
import type { Resource } from './resources';

type Row = Record<string, unknown> & { _id: string };

export function ResourceList({ resource }: { resource: Resource }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Row> | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (debounced) params.set('q', debounced);
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    let cancelled = false;
    apiFetch<Paginated<Row>>(`/admin/${resource.key}?${params}`)
      .then((r) => !cancelled && (setResult(r), setError(undefined)))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [resource.key, debounced, filters, page]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{resource.label}</h1>
        {resource.canCreate && (
          <Link href={`/admin/${resource.key}/new`} className="btn btn-primary">
            + New {resource.singular.toLowerCase()}
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => (setQ(e.target.value), setPage(1))}
          placeholder={`Search ${resource.label.toLowerCase()}…`}
          aria-label="Search"
          className="input max-w-xs"
        />
        {resource.filters?.map((f) => (
          <select
            key={f.name}
            aria-label={f.label}
            className="input w-auto"
            value={filters[f.name] || ''}
            onChange={(e) => (setFilters((s) => ({ ...s, [f.name]: e.target.value })), setPage(1))}
          >
            <option value="">{f.label}: all</option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {f.label}: {o === 'true' ? 'yes' : o === 'false' ? 'no' : o}
              </option>
            ))}
          </select>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {resource.columns.map((c) => (
                <th key={c.name} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {!result && (
              <tr>
                <td colSpan={resource.columns.length} className="px-4 py-10 text-center text-grey">Loading…</td>
              </tr>
            )}
            {result?.data.length === 0 && (
              <tr>
                <td colSpan={resource.columns.length} className="px-4 py-10 text-center text-grey">No {resource.label.toLowerCase()} found.</td>
              </tr>
            )}
            {result?.data.map((row) => (
              <tr
                key={row._id}
                className="cursor-pointer hover:bg-mist"
                onClick={() => router.push(`/admin/${resource.key}/${row._id}`)}
              >
                {resource.columns.map((c, i) => (
                  <td key={c.name} className="whitespace-nowrap px-4 py-3">
                    {i === 0 ? (
                      <Link href={`/admin/${resource.key}/${row._id}`} className="font-semibold text-navy hover:text-green" onClick={(e) => e.stopPropagation()}>
                        <Cell row={row} col={c} />
                      </Link>
                    ) : (
                      <Cell row={row} col={c} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result && result.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-grey">
            {result.total} records · page {result.page} of {result.pages}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Previous
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={page >= result.pages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
