'use client';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
let loading: Promise<void> | null = null;

function load(): Promise<void> {
  if (!SITE_KEY) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error('Could not load reCAPTCHA'));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Warm up the script when a form mounts. */
export function preloadRecaptcha() {
  load().catch(() => {});
}

/** reCAPTCHA v3 token for an action; undefined when no site key is configured (local dev). */
export async function getRecaptchaToken(action: string): Promise<string | undefined> {
  if (!SITE_KEY) return undefined;
  await load();
  return new Promise((resolve, reject) => {
    window.grecaptcha!.ready(() => window.grecaptcha!.execute(SITE_KEY, { action }).then(resolve, reject));
  });
}
