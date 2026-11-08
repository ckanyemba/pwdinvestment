import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = { title: 'Forms & downloads', description: 'Enrolment, booking and debit order forms for PMD Investment Academy.' };

const FILES = [
  { file: 'enrollment-form.pdf', title: 'Enrolment form', text: 'Prefer paper? Print, complete and return to our office. Or enrol online.' },
  { file: 'terms-and-conditions.pdf', title: 'Terms and conditions', text: 'The terms that apply to our courses and services.' },
  { file: 'assessment-sheet.pdf', title: 'Assessment sheet', text: 'Course assessment form for learners.' },
  { file: 'booking-form.pdf', title: 'Booking form', text: 'Book a place on a training or conference.' },
  { file: 'debit-order-form.pdf', title: 'Debit order form', text: 'Authorise monthly course payments.' },
  { file: 'bee-certificate.pdf', title: 'B-BBEE certificate', text: 'Our broad-based black economic empowerment certificate.' },
];

export default function DownloadsPage() {
  return (
    <>
      <PageHeader title="Forms & downloads" crumbs={[{ label: 'Downloads' }]} />
      <div className="container-pmd py-14">
        <p className="max-w-2xl">
          You can now <Link href="/enrol" className="font-semibold text-green">enrol online</Link>. The PDF forms below are still available if you prefer to complete them by hand.
        </p>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FILES.map((f) => (
            <li key={f.file} className="card flex flex-col">
              <h2 className="text-lg font-bold">{f.title}</h2>
              <p className="mt-2 flex-1 text-sm">{f.text}</p>
              <a href={`/downloads/${f.file}`} className="btn btn-ghost mt-4" download>
                Download PDF
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
