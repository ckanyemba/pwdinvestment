'use client';

import { useEffect, useState } from 'react';
import { apiFetch, revalidateContent } from '@/lib/client-api';
import { cx } from '@/lib/format';

const KEYS = [
  { key: 'site', label: 'Site details', help: 'Name, tagline, address, phone, emails, social links, contacts and map location.' },
  { key: 'home', label: 'Home page', help: 'Hero slides, service cards, quote, industries, stats, “why us” items, partner logos and the live-account link.' },
] as const;
type Key = (typeof KEYS)[number]['key'];

function JsonSettings({ settingsKey }: { settingsKey: Key }) {
  const [text, setText] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string }>();
  const current = KEYS.find((k) => k.key === settingsKey)!;

  useEffect(() => {
    apiFetch(`/admin/settings/${settingsKey}`).then(
      (v) => setText(JSON.stringify(v, null, 2)),
      (e) => setStatus({ kind: 'error', text: e.message }),
    );
  }, [settingsKey]);

  async function save() {
    let value: unknown;
    try {
      value = JSON.parse(text ?? '');
    } catch (e) {
      return setStatus({ kind: 'error', text: `Invalid JSON: ${(e as Error).message}` });
    }
    try {
      await apiFetch(`/admin/settings/${settingsKey}`, { method: 'PUT', json: value });
      await revalidateContent();
      setStatus({ kind: 'ok', text: 'Saved. The website will update within a few seconds.' });
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message });
    }
  }

  return (
    <div className="card mt-4">
      <p className="text-sm text-grey">{current.help} Edit carefully: this is structured data (JSON).</p>
      <textarea
        value={text ?? 'Loading…'}
        disabled={text === null}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        aria-label={`${current.label} JSON`}
        className="input mt-4 min-h-[520px] font-mono text-xs"
      />
      {status && (
        <p role="status" className={cx('mt-3 rounded p-3 text-sm', status.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green/10 text-green-dark')}>
          {status.text}
        </p>
      )}
      <button type="button" className="btn btn-primary mt-4" onClick={save} disabled={text === null}>
        Save {current.label.toLowerCase()}
      </button>
    </div>
  );
}

export function SettingsEditor() {
  const [active, setActive] = useState<Key>('site');
  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold">Site settings</h1>
      <div className="mt-6 flex gap-2" role="tablist">
        {KEYS.map((k) => (
          <button key={k.key} role="tab" aria-selected={active === k.key} type="button" onClick={() => setActive(k.key)} className={cx('btn btn-sm', active === k.key ? 'btn-navy' : 'btn-ghost')}>
            {k.label}
          </button>
        ))}
      </div>
      {/* keyed so switching tabs starts with fresh state */}
      <JsonSettings key={active} settingsKey={active} />
    </div>
  );
}
