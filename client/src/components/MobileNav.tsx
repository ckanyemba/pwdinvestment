'use client';

import Link from 'next/link';
import { useState } from 'react';

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
        className="rounded border border-navy/20 p-2 text-navy"
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
        </svg>
      </button>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="absolute inset-x-0 top-full border-t bg-white shadow-lg">
          <ul className="container-pmd divide-y py-2 font-semibold text-navy">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-3" onClick={close}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/enrol" className="block py-3 text-green" onClick={close}>
                Enrol now →
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
