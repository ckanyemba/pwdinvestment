'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiFetch, ClientApiError, revalidateContent } from '@/lib/client-api';
import { cx } from '@/lib/format';
import { Prose } from '@/components/Prose';
import { getPath, setPath, type Field, type Resource } from './resources';
import { UploadButton, type UploadedFile } from './Upload';

type Doc = Record<string, unknown> & { _id?: string };

const toDateInput = (v: unknown) => (v ? String(v).slice(0, 10) : '');

function useRefOptions(fields: Field[]) {
  const refs = useMemo(() => [...new Set(fields.filter((f) => f.type === 'ref').map((f) => f.ref!))], [fields]);
  const [options, setOptions] = useState<Record<string, { _id: string; name: string }[]>>({});
  useEffect(() => {
    refs.forEach((r) =>
      apiFetch<{ data: { _id: string; name: string }[] }>(`/admin/${r}?limit=200`).then((res) => setOptions((o) => ({ ...o, [r]: res.data }))),
    );
  }, [refs]);
  return options;
}

function HtmlEditor({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="rounded border border-slate-300">
      <div className="flex gap-1 border-b bg-slate-50 p-1 text-xs">
        <button type="button" onClick={() => setPreview(false)} className={cx('rounded px-3 py-1', !preview && 'bg-white shadow-sm')}>HTML</button>
        <button type="button" onClick={() => setPreview(true)} className={cx('rounded px-3 py-1', preview && 'bg-white shadow-sm')}>Preview</button>
        <UploadButton
          label="Insert image"
          accept="image/*"
          folder="content"
          onUploaded={(f) => onChange(`${value}\n<figure><img src="${f.url}" alt="" /></figure>\n`)}
        />
      </div>
      {preview ? (
        <div className="max-h-[600px] overflow-auto p-4">
          <Prose html={value} />
        </div>
      ) : (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[420px] w-full p-3 font-mono text-xs focus:outline-none" spellCheck={false} />
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange, refOptions, error }: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  refOptions: Record<string, { _id: string; name: string }[]>;
  error?: string;
}) {
  const id = `f-${field.name}`;
  const common = { id, name: field.name, required: field.required, 'aria-invalid': !!error, className: 'input' };

  if (field.readOnly) {
    let shown: string = value == null || value === '' ? '—' : String(value);
    if (field.type === 'date' && value) shown = toDateInput(value);
    return field.type === 'textarea' ? (
      <p className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-sm">{shown}</p>
    ) : (
      <p className={cx('rounded bg-slate-50 px-3 py-2.5 text-sm', field.sensitive && 'font-mono')}>{shown}</p>
    );
  }

  switch (field.type) {
    case 'textarea':
      return <textarea {...common} rows={4} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'html':
      return <HtmlEditor id={id} value={(value as string) ?? ''} onChange={onChange} />;
    case 'checkbox':
      return (
        <input id={id} type="checkbox" className="h-5 w-5 accent-green" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      );
    case 'select':
      return (
        <select {...common} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {field.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'ref': {
      const current = value && typeof value === 'object' ? (value as { _id: string })._id : ((value as string) ?? '');
      return (
        <select {...common} value={current} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(refOptions[field.ref!] || []).map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
        </select>
      );
    }
    case 'number':
      return <input {...common} type="number" step="any" value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />;
    case 'date':
      return <input {...common} type="date" value={toDateInput(value)} onChange={(e) => onChange(e.target.value || null)} />;
    case 'image':
      return (
        <div className="space-y-2">
          {typeof value === 'string' && value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-28 w-auto rounded border object-cover" />
          )}
          <div className="flex gap-2">
            <input {...common} type="url" placeholder="https://…" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
            <UploadButton accept="image/*" folder="images" onUploaded={(f) => onChange(f.url)} />
          </div>
        </div>
      );
    case 'file': {
      const file = value as UploadedFile | null;
      return (
        <div className="flex flex-wrap items-center gap-3">
          {file?.url ? (
            <>
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-green underline">
                {file.name || 'View file'}
              </a>
              <button type="button" className="text-xs text-red-600" onClick={() => onChange(null)}>Remove</button>
            </>
          ) : (
            <span className="text-sm text-grey">No file</span>
          )}
          <UploadButton folder="documents" onUploaded={(f) => onChange(f)} label={file?.url ? 'Replace' : 'Upload'} />
        </div>
      );
    }
    default:
      return <input {...common} type={field.type} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function ResourceForm({ resource, id }: { resource: Resource; id: string }) {
  const router = useRouter();
  const isNew = id === 'new';
  const [doc, setDoc] = useState<Doc | null>(isNew ? { published: true, active: true } : null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string }>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refOptions = useRefOptions(resource.fields);

  useEffect(() => {
    if (isNew) return;
    apiFetch<Doc>(`/admin/${resource.key}/${id}`)
      .then(setDoc)
      .catch((e) => setMessage({ kind: 'error', text: e.message }));
  }, [resource.key, id, isNew]);

  if (!doc) return <p className="text-grey">{message?.text || 'Loading…'}</p>;

  const title = (getPath(doc, resource.titleField) as string) || (isNew ? `New ${resource.singular.toLowerCase()}` : resource.singular);
  const editable = resource.fields.filter((f) => !f.readOnly);
  const publicPath = !isNew && resource.publicPath?.(doc);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(undefined);
    setErrors({});
    // Send only editable fields; refs are sent as ids.
    let body: Record<string, unknown> = {};
    for (const f of editable) {
      let v = getPath(doc, f.name);
      if (f.type === 'ref' && v && typeof v === 'object') v = (v as { _id: string })._id;
      if (v !== undefined) body = setPath(body, f.name, v);
    }
    try {
      const saved = await apiFetch<Doc>(isNew ? `/admin/${resource.key}` : `/admin/${resource.key}/${id}`, {
        method: isNew ? 'POST' : 'PATCH',
        json: body,
      });
      if (resource.revalidates) await revalidateContent();
      if (isNew) router.replace(`/admin/${resource.key}/${saved._id}`);
      else {
        setDoc((d) => ({ ...d, ...saved }));
        setMessage({ kind: 'ok', text: 'Saved.' });
      }
    } catch (err) {
      const e2 = err as ClientApiError;
      setErrors(Object.fromEntries((e2.details || []).map((d) => [d.path, d.message])));
      setMessage({ kind: 'error', text: e2.message });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm(`Delete this ${resource.singular.toLowerCase()}? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/${resource.key}/${id}`, { method: 'DELETE' });
      if (resource.revalidates) await revalidateContent();
      router.push(`/admin/${resource.key}`);
    } catch (err) {
      setMessage({ kind: 'error', text: (err as Error).message });
    }
  }

  async function convertToClient() {
    try {
      const client = await apiFetch<Doc>(`/admin/enrolments/${id}/convert`, { method: 'POST' });
      router.push(`/admin/clients/${client._id}`);
    } catch (err) {
      setMessage({ kind: 'error', text: (err as Error).message });
    }
  }

  // Group fields into sections.
  const sections: { title?: string; fields: Field[] }[] = [];
  for (const f of resource.fields) {
    if (f.section || sections.length === 0) sections.push({ title: f.section, fields: [] });
    sections.at(-1)!.fields.push(f);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/admin/${resource.key}`} className="text-sm text-grey hover:text-green">← {resource.label}</Link>
          <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {publicPath && (
            <a href={publicPath} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">View on site ↗</a>
          )}
          {resource.key === 'enrolments' && !isNew && (
            <button type="button" className="btn btn-navy btn-sm" onClick={convertToClient}>Convert to client</button>
          )}
          {resource.canDelete && !isNew && (
            <button type="button" className="btn btn-ghost btn-sm text-red-600" onClick={onDelete}>Delete</button>
          )}
          {editable.length > 0 && (
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          )}
        </div>
      </div>

      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={cx('mt-4 rounded p-3 text-sm', message.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green/10 text-green-dark')}>
          {message.text}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {sections.map((s, i) => (
          <section key={i} className="card">
            {s.title && <h2 className="mb-4 text-base font-bold">{s.title}</h2>}
            <div className="grid gap-5 md:grid-cols-2">
              {s.fields.map((f) => (
                <div key={f.name} className={cx('flex flex-col gap-1.5', (f.wide || f.type === 'html') && 'md:col-span-2', f.type === 'checkbox' && 'flex-row-reverse items-center justify-end gap-3')}>
                  <label htmlFor={`f-${f.name}`} className="text-sm font-semibold text-navy">
                    {f.label}
                    {f.required && !f.readOnly && <span className="text-red-600"> *</span>}
                    {f.sensitive && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">encrypted</span>}
                  </label>
                  <FieldInput field={f} value={getPath(doc, f.name)} onChange={(v) => setDoc((d) => setPath(d!, f.name, v))} refOptions={refOptions} error={errors[f.name]} />
                  {f.help && <p className="text-xs text-grey">{f.help}</p>}
                  {errors[f.name] && <p className="text-xs font-medium text-red-600">{errors[f.name]}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </form>
  );
}
