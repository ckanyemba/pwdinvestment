import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Gmail transport. Prefers OAuth2 (GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN) and falls back to an
 * app password. With neither configured, emails are logged instead of sent.
 */
function createTransport() {
  if (!env.GMAIL_USER) return null;
  if (env.GMAIL_REFRESH_TOKEN && env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: env.GMAIL_USER,
        clientId: env.GMAIL_CLIENT_ID,
        clientSecret: env.GMAIL_CLIENT_SECRET,
        refreshToken: env.GMAIL_REFRESH_TOKEN,
      },
    });
  }
  if (env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({ service: 'gmail', auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD } });
  }
  return null;
}

const transport = createTransport();

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function sendMail({ to, subject, text, html, replyTo }) {
  const message = { from: `PMD Investment Academy <${env.GMAIL_USER || 'no-reply@pmdinvestment.co.za'}>`, to, subject, text, html, replyTo };
  if (!transport) {
    if (env.NODE_ENV !== 'test') console.info('[mailer] Gmail not configured; would send:', { to, subject });
    return { skipped: true };
  }
  return transport.sendMail(message);
}

/** Fire-and-forget notification; failures are logged, never surfaced to the visitor. */
export function notify(opts) {
  sendMail({ to: env.NOTIFY_EMAILS, ...opts }).catch((err) => console.error('[mailer] send failed:', err.message));
}
