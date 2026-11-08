import { cx } from '@/lib/format';

/**
 * Renders CMS HTML. Content is sanitised by the API on save (sanitize-html) and the seeded legacy
 * content was cleaned during migration, so it is safe to inject here.
 */
export function Prose({ html, className }: { html: string; className?: string }) {
  return <div className={cx('prose-pmd', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
