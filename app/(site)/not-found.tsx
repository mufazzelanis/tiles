import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
      <p className="font-display text-7xl font-semibold text-neutral-200">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">This page could not be found</h1>
      <p className="mt-2 text-sm text-muted">The tile or page you are looking for may have been moved or removed.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="bg-navy px-6 py-3 text-[12px] tracking-wider text-white uppercase hover:bg-navy-deep">Home</Link>
        <Link href="/products" className="border border-ink px-6 py-3 text-[12px] tracking-wider text-ink uppercase hover:bg-ink hover:text-white">Browse products</Link>
      </div>
    </div>
  );
}
