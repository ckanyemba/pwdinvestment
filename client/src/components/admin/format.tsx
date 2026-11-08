import type { Column } from './resources';
import { getPath } from './resources';
import { formatDate } from '@/lib/format';
import { cx } from '@/lib/format';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-amber-100 text-amber-800',
  done: 'bg-green/15 text-green-dark',
  spam: 'bg-slate-200 text-slate-600',
  Active: 'bg-green/15 text-green-dark',
  Pending: 'bg-amber-100 text-amber-800',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-slate-200 text-slate-700',
};

export function StatusBadge({ value }: { value?: string }) {
  if (!value) return null;
  return <span className={cx('inline-block rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_COLORS[value] || 'bg-slate-100')}>{value}</span>;
}

export function Cell({ row, col }: { row: Record<string, unknown>; col: Column }) {
  const v = getPath(row, col.name);
  if (v === undefined || v === null || v === '') return <span className="text-slate-300">—</span>;
  switch (col.format) {
    case 'date':
      return <>{formatDate(v as string, { dateStyle: 'medium' })}</>;
    case 'datetime':
      return <>{formatDate(v as string, { dateStyle: 'medium', timeStyle: 'short' })}</>;
    case 'bool':
      return v ? <span className="font-bold text-green">✓</span> : <span className="text-slate-300">✗</span>;
    case 'ref':
      return <>{(v as { name?: string }).name ?? '—'}</>;
    case 'money':
      return <>R {Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</>;
    case 'status':
      return <StatusBadge value={String(v)} />;
    default:
      return <>{String(v)}</>;
  }
}
