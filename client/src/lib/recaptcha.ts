'use client';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let loading: Promise<void> | null = null;

function load(siteKey?: string): Promise<void> {
  if (!siteKey) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
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
export function preloadRecaptcha(siteKey?: string) {
  load(siteKey).catch(() => {});
}

/** reCAPTCHA v3 token for an action; undefined when no site key is configured (local dev). */
export async function getRecaptchaToken(siteKey: string | undefined, action: string): Promise<string | undefined> {
  if (!siteKey) return undefined;
  await load(siteKey);
  return new Promise((resolve, reject) => {
    window.grecaptcha!.ready(() => window.grecaptcha!.execute(siteKey, { action }).then(resolve, reject));
  });
}
