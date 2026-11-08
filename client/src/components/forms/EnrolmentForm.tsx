'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { apiFetch, ClientApiError } from '@/lib/client-api';
import { getRecaptchaToken, preloadRecaptcha } from '@/lib/recaptcha';
import { FormStatus, Honeypot, RadioGroup, SelectField, TextField } from './fields';
import { RecaptchaNotice } from './ContactForm';

const PROVINCES = ['Gauteng', 'Limpopo', 'Mpumalanga', 'Eastern Cape', 'KwaZulu-Natal', 'North West', 'Free State', 'Western Cape', 'Northern Cape'];
const BANKS = ['Absa 632005', 'Nedbank 198765', 'Investec 580105', 'FNB 250655', 'Standard Bank 051001', 'Capitec 470010', 'Bidvest 462005', 'SA Post Bank 460005', 'TymeBank 678910', 'Discovery Bank 679000', 'African Bank 430000', 'Other'];

type Status = 'idle' | 'sending' | 'sent' | 'error';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="card">
      <legend className="font-heading -ml-1 px-1 text-lg font-bold text-navy">{title}</legend>
      <div className="mt-2 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Turns flat "a.b" form keys into nested objects. */
function nest(entries: Record<string, FormDataEntryValue>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries)) {
    const parts = key.split('.');
    let obj = out as Record<string, unknown>;
    parts.slice(0, -1).forEach((p) => (obj = (obj[p] ??= {}) as Record<string, unknown>));
    obj[parts.at(-1)!] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}

export function EnrolmentForm({ recaptchaSiteKey }: { recaptchaSiteKey?: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => preloadRecaptcha(recaptchaSiteKey), [recaptchaSiteKey]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = nest(Object.fromEntries(fd));
    data.consent = fd.get('consent') === 'on';
    if (!data.dateOfBirth) delete data.dateOfBirth;

    setStatus('sending');
    setErrors({});
    try {
      const recaptchaToken = await getRecaptchaToken(recaptchaSiteKey, 'enrol');
      await apiFetch('/enrolments', { method: 'POST', json: { ...data, recaptchaToken } });
      setStatus('sent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const e2 = err as ClientApiError;
      const map = Object.fromEntries((e2.details || []).map((d) => [d.path, d.message]));
      setErrors(map);
      setError(Object.keys(map).length ? 'Please correct the highlighted fields.' : e2.message);
      setStatus('error');
      const first = Object.keys(map)[0];
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="rounded-lg border border-green/30 bg-green/10 p-8">
        <p className="font-heading text-2xl font-bold text-navy">Thank you, your enrolment has been received.</p>
        <p className="mt-3">We&apos;ve emailed you a confirmation. A PMD consultant will contact you shortly to finalise your enrolment.</p>
        <Link href="/" className="btn btn-primary mt-6">Back to home</Link>
      </div>
    );
  }

  const err = (k: string) => errors[k];

  return (
    <form onSubmit={onSubmit} className="relative space-y-8">
      <Honeypot />

      <Section title="Consultant">
        <TextField label="Consultant name" name="consultant" error={err('consultant')} hint="If a consultant assisted you" />
        <TextField label="Financed by" name="financedBy" error={err('financedBy')} />
      </Section>

      <Section title="Customer details">
        <RadioGroup label="Gender" name="gender" options={['Male', 'Female', 'Other']} />
        <SelectField label="Title" name="title" options={['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Captain', 'General', 'Colonel', 'Hon']} error={err('title')} />
        <TextField label="First names" name="firstNames" required autoComplete="given-name" error={err('firstNames')} />
        <TextField label="Surname" name="surname" required autoComplete="family-name" error={err('surname')} />
        <TextField label="ID / passport number" name="idNumber" required inputMode="text" autoComplete="off" error={err('idNumber')} />
        <TextField label="Date of birth" name="dateOfBirth" type="date" autoComplete="bday" error={err('dateOfBirth')} />
        <RadioGroup label="Language preference" name="language" options={['English', 'Afrikaans', 'isiZulu', 'Other']} defaultValue="English" />
        <RadioGroup label="Contact time preference" name="contactTime" options={['Office Hours', 'After Hours']} defaultValue="Office Hours" />
      </Section>

      <Section title="Residential address">
        <TextField label="Unit or house number" name="address.unitNumber" error={err('address.unitNumber')} />
        <TextField label="Street name" name="address.street" autoComplete="address-line1" error={err('address.street')} />
        <TextField label="Suburb / town" name="address.town" error={err('address.town')} />
        <TextField label="City" name="address.city" autoComplete="address-level2" error={err('address.city')} />
        <SelectField label="Province" name="address.province" options={PROVINCES} error={err('address.province')} />
        <TextField label="Postal code" name="address.postalCode" inputMode="numeric" autoComplete="postal-code" error={err('address.postalCode')} />
      </Section>

      <Section title="Contact details">
        <TextField label="Mobile phone" name="phones.mobile" type="tel" required autoComplete="tel" error={err('phones.mobile')} />
        <TextField label="Email address" name="email" type="email" required autoComplete="email" error={err('email')} />
        <TextField label="Work phone" name="phones.work" type="tel" error={err('phones.work')} />
        <TextField label="Home phone" name="phones.home" type="tel" error={err('phones.home')} />
      </Section>

      <Section title="Banking details (for debit order)">
        <TextField label="Account holder name" name="bank.accountName" required error={err('bank.accountName')} />
        <SelectField label="Bank" name="bank.bankName" required options={BANKS} error={err('bank.bankName')} />
        <TextField label="Account number" name="bank.accountNumber" required inputMode="numeric" autoComplete="off" error={err('bank.accountNumber')} />
        <SelectField label="Account type" name="bank.accountType" required options={['Savings', 'Cheque', 'Current', 'Other']} error={err('bank.accountType')} />
      </Section>

      <Section title="Employment details">
        <TextField label="Employer's name" name="employment.employerName" autoComplete="organization" error={err('employment.employerName')} />
        <TextField label="Occupation" name="employment.occupation" autoComplete="organization-title" error={err('employment.occupation')} />
        <TextField label="Appointment date" name="employment.appointmentDate" type="date" error={err('employment.appointmentDate')} />
        <TextField label="Salary date" name="employment.salaryDate" placeholder="e.g. 25th" error={err('employment.salaryDate')} />
        <TextField label="Gross salary (R)" name="employment.grossSalary" inputMode="decimal" error={err('employment.grossSalary')} />
        <TextField label="Net salary (R)" name="employment.netSalary" inputMode="decimal" error={err('employment.netSalary')} />
        <RadioGroup label="Appointment type" name="employment.appointmentType" options={['Permanent', 'Contract', 'Self-employed']} defaultValue="Permanent" />
        <RadioGroup label="Salary paid" name="employment.salaryPaid" options={['Monthly', 'Weekly', 'Fortnightly']} defaultValue="Monthly" />
      </Section>

      <div className="card">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" required className="mt-1 accent-green" />
          <span>
            I confirm the information above is correct, I accept the{' '}
            <a href="/downloads/terms-and-conditions.pdf" target="_blank" className="font-semibold text-green underline">
              terms and conditions
            </a>
            , and I consent to PMD Investment Academy processing my personal information for my enrolment.
          </span>
        </label>
        {err('consent') && <p className="mt-2 text-xs font-medium text-red-600">{err('consent')}</p>}
      </div>

      <FormStatus status={status} error={error} />
      <div>
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Submitting…' : 'Submit enrolment'}
        </button>
        <RecaptchaNotice siteKey={recaptchaSiteKey} />
      </div>
    </form>
  );
}
