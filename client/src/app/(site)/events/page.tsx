import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Prose } from '@/components/Prose';
import { getEvents, safe } from '@/lib/api';
import { formatDate, formatDateRange } from '@/lib/format';
import type { EventItem } from '@/lib/types';

export const metadata: Metadata = { title: 'Trainings & Events', description: 'Upcoming PMD Investment Academy trainings, conferences and events.' };

function EventCard({ e }: { e: EventItem }) {
  const venue = e.venue && [e.venue.name, e.venue.address, e.venue.city].filter(Boolean).join(', ');
  return (
    <li className="card flex gap-5">
      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded bg-navy text-white">
        <span className="text-2xl font-bold leading-none">{formatDate(e.startDate, { day: 'numeric' })}</span>
        <span className="mt-1 text-xs uppercase">{formatDate(e.startDate, { month: 'short', year: 'numeric' })}</span>
      </div>
      <div>
        <h3 className="text-lg font-bold">{e.title}</h3>
        <p className="mt-1 text-sm font-semibold text-green">{formatDateRange(e.startDate, e.endDate)}</p>
        {venue && <p className="mt-1 text-sm text-grey">{venue}</p>}
        {e.description && <Prose html={e.description} className="mt-3 text-sm" />}
      </div>
    </li>
  );
}

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([safe(() => getEvents('upcoming'), []), safe(() => getEvents('past'), [])]);
  return (
    <>
      <PageHeader title="Trainings & Events" crumbs={[{ label: 'Events' }]} />
      <div className="container-pmd space-y-14 py-14">
        <section>
          <h2 className="section-title">Upcoming</h2>
          {upcoming.length ? (
            <ul className="mt-6 grid gap-5 md:grid-cols-2">{upcoming.map((e) => <EventCard key={e._id} e={e} />)}</ul>
          ) : (
            <div className="card mt-6">
              <p>New training dates are announced regularly.</p>
              <p className="mt-2 text-sm">
                <Link href="/contact" className="font-semibold text-green">Contact us</Link> to book a place on our next Financial Markets Trading Course or a corporate training session.
              </p>
            </div>
          )}
        </section>
        {past.length > 0 && (
          <section>
            <h2 className="section-title">Past events</h2>
            <ul className="mt-6 grid gap-5 opacity-80 md:grid-cols-2">{past.map((e) => <EventCard key={e._id} e={e} />)}</ul>
          </section>
        )}
      </div>
    </>
  );
}
