import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-pmd py-24 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-green">404</p>
      <h1 className="mt-2 text-4xl font-bold">Page not found</h1>
      <p className="mx-auto mt-4 max-w-md">The page you&apos;re looking for may have moved when we updated our website.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn btn-primary">Go home</Link>
        <Link href="/contact" className="btn btn-ghost">Contact us</Link>
      </div>
    </div>
  );
}
