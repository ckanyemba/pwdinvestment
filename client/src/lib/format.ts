const tz = 'Africa/Johannesburg';

export function formatDate(value?: string | Date | null, opts: Intl.DateTimeFormatOptions = { dateStyle: 'long' }) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-ZA', { timeZone: tz, ...opts }).format(new Date(value));
}

export function formatDateRange(start: string, end?: string | null) {
  const s = formatDate(start);
  const e = end ? formatDate(end) : '';
  return e && e !== s ? `${s} – ${e}` : s;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, '').replace(/^0/, '+27')}`;
}

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
