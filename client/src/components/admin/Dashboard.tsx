'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/client-api';
import { formatDate } from '@/lib/format';
import { StatusBadge } from './format';
import { useAdmin } from './AdminShell';

type Stats = {
  newEnrolments: number;
  newMessages: number;
  clients: number;
  activeClients: number;
  employees: number;
  upcomingAppointments: number;
  recentEnrolments: { _id: string; firstNames: string; surname: string; email: string; status: string; createdAt: string }[];
};

export function Dashboard() {
  const { user } = useAdmin();
  const [stats, setStats] = useState<Stats>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    apiFetch<Stats>('/admin/stats').then(setStats, (e) => setError(e.message));
  }, []);

  const tiles = stats
    ? [
        { label: 'New enrolments', value: stats.newEnrolments, href: '/admin/enrolments' },
        { label: 'New messages', value: stats.newMessages, href: '/admin/messages' },
        { label: 'Upcoming appointments', value: stats.upcomingAppointments, href: '/admin/appointments' },
        { label: 'Active clients', value: `${stats.activeClients} / ${stats.clients}`, href: '/admin/clients' },
        { label: 'Employees', value: stats.employees, href: '/admin/employees' },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome{user.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
      {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card hover:ring-green">
            <p className="text-xs font-semibold uppercase tracking-wide text-grey">{t.label}</p>
            <p className="font-heading mt-2 text-3xl font-bold text-navy">{t.value}</p>
          </Link>
        ))}
      </div>
      {stats && (
        <section className="card mt-8">
          <h2 className="text-lg font-bold">Latest enrolments</h2>
          {stats.recentEnrolments.length === 0 ? (
            <p className="mt-3 text-sm text-grey">No enrolments yet.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {stats.recentEnrolments.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <Link href={`/admin/enrolments/${e._id}`} className="font-semibold text-navy hover:text-green">
                    {e.firstNames} {e.surname}
                  </Link>
                  <span className="hidden text-grey sm:inline">{e.email}</span>
                  <span className="text-grey">{formatDate(e.createdAt, { dateStyle: 'medium' })}</span>
                  <StatusBadge value={e.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
