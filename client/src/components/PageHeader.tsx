import Link from 'next/link';

export function PageHeader({ title, crumbs = [], image }: { title: string; crumbs?: { label: string; href?: string }[]; image?: string | null }) {
  return (
    <header
      className="relative bg-navy text-white"
      style={image ? { backgroundImage: `linear-gradient(rgba(20,36,64,.82),rgba(20,36,64,.82)),url("${image}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      <div className="container-pmd py-14 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-white/70">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex gap-2">
                <span aria-hidden>/</span>
                {c.href ? (
                  <Link href={c.href} className="hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span>{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="font-heading text-3xl font-bold text-white md:text-5xl">{title}</h1>
      </div>
    </header>
  );
}
