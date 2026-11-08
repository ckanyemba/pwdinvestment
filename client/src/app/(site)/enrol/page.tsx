import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { EnrolmentForm } from '@/components/forms/EnrolmentForm';

export const metadata: Metadata = {
  title: 'Enrol online',
  description: 'Enrol for the PMD Investment Academy Financial Markets Trading Course and Software Training.',
};

export default function EnrolPage() {
  return (
    <>
      <PageHeader title="Enrolment" crumbs={[{ label: 'Education', href: '/education' }, { label: 'Enrol' }]} />
      <div className="container-pmd max-w-4xl py-14">
        <p className="text-lg">
          Complete the form below to enrol for our <strong className="text-navy">Trading Course and Software Training</strong>. A consultant will contact you to confirm your enrolment and payment options.
        </p>
        <p className="mt-3 text-sm text-grey">
          Your ID and banking details are encrypted and only accessible to authorised PMD staff, in line with the Protection of Personal Information Act (POPIA).
        </p>
        <div className="mt-10">
          <EnrolmentForm recaptchaSiteKey={process.env.RECAPTCHA_SITE_KEY} />
        </div>
      </div>
    </>
  );
}
