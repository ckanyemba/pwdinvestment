import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { GoogleMap } from '@/components/GoogleMap';
import { ContactForm } from '@/components/forms/ContactForm';
import { getSite } from '@/lib/api';
import { telHref } from '@/lib/format';

export const metadata: Metadata = { title: 'Contact us', description: 'Visit, call or email PMD Investment Academy in Marshalltown, Johannesburg.' };

export default async function ContactPage() {
  const { site } = await getSite();
  return (
    <>
      <PageHeader title="Contact us" crumbs={[{ label: 'Contact' }]} />
      <div className="container-pmd grid gap-12 py-14 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="feedback">
          <h2 id="feedback" className="section-title">Send us a message</h2>
          <p className="mt-2 text-sm text-grey">We usually respond within one business day.</p>
          <div className="mt-8">
            <ContactForm recaptchaSiteKey={process.env.RECAPTCHA_SITE_KEY} />
          </div>
        </section>
        <aside className="space-y-6">
          <div className="card bg-navy text-white ring-0">
            <h2 className="text-lg font-bold text-white">Johannesburg head office</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-white/85">
              {site.address.map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
            </address>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex gap-2"><dt className="text-white/60">Tel</dt><dd><a href={telHref(site.phone)} className="hover:text-green">{site.phone}</a></dd></div>
              {site.fax && <div className="flex gap-2"><dt className="text-white/60">Fax</dt><dd>{site.fax}</dd></div>}
              <div className="flex gap-2"><dt className="text-white/60">Email</dt><dd><a href={`mailto:${site.emails.general}`} className="hover:text-green">{site.emails.general}</a></dd></div>
            </dl>
          </div>
          {site.contacts.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold">Your contacts</h2>
              <ul className="mt-4 space-y-4">
                {site.contacts.map((c) => (
                  <li key={c.email + c.name}>
                    <p className="font-semibold text-navy">{c.name}</p>
                    <p className="text-sm text-grey">{c.role}</p>
                    <a href={`mailto:${c.email}`} className="text-sm font-semibold text-green">{c.email}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
      <GoogleMap query={site.map.query} title="PMD Investment Academy on Google Maps" />
    </>
  );
}
