'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ClientApiError } from '@/lib/client-api';
import { getRecaptchaToken, preloadRecaptcha } from '@/lib/recaptcha';
import { FormStatus, Honeypot, TextArea, TextField } from './fields';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function ContactForm({ recaptchaSiteKey }: { recaptchaSiteKey?: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  useEffect(() => preloadRecaptcha(recaptchaSiteKey), [recaptchaSiteKey]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setStatus('sending');
    setFieldErrors({});
    try {
      const recaptchaToken = await getRecaptchaToken(recaptchaSiteKey, 'contact');
      await apiFetch('/contact', { method: 'POST', json: { ...data, recaptchaToken } });
      form.reset();
      setStatus('sent');
    } catch (err) {
      const e2 = err as ClientApiError;
      setFieldErrors(Object.fromEntries((e2.details || []).map((d) => [d.path, d.message])));
      setError(e2.message);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="rounded-lg border border-green/30 bg-green/10 p-6">
        <p className="font-heading text-lg font-semibold text-navy">Thank you for your message.</p>
        <p className="mt-1 text-sm">We&apos;ll get back to you as soon as possible.</p>
        <button type="button" className="mt-4 text-sm font-semibold text-green underline" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative grid gap-4 sm:grid-cols-2" noValidate={false}>
      <Honeypot />
      <TextField label="Your name" name="name" required minLength={2} maxLength={120} autoComplete="name" error={fieldErrors.name} />
      <TextField label="Your email" name="email" type="email" required autoComplete="email" error={fieldErrors.email} />
      <TextField label="Phone" name="phone" type="tel" autoComplete="tel" error={fieldErrors.phone} />
      <TextField label="Subject" name="subject" maxLength={200} error={fieldErrors.subject} />
      <TextArea label="Your message" name="message" required minLength={5} maxLength={5000} className="sm:col-span-2" error={fieldErrors.message} />
      <div className="sm:col-span-2">
        <FormStatus status={status} error={error} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <RecaptchaNotice siteKey={recaptchaSiteKey} />
      </div>
    </form>
  );
}

export function RecaptchaNotice({ siteKey }: { siteKey?: string }) {
  if (!siteKey) return null;
  return (
    <p className="mt-3 text-xs text-slate-500">
      This site is protected by reCAPTCHA and the Google{' '}
      <a href="https://policies.google.com/privacy" className="underline">Privacy Policy</a> and{' '}
      <a href="https://policies.google.com/terms" className="underline">Terms of Service</a> apply.
    </p>
  );
}
