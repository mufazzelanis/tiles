import Link from "next/link";
import Img from "@/components/Img";

export function PageHero({
  title,
  subtitle,
  image,
  crumbs = [],
}: {
  title: string;
  subtitle?: string;
  image: string;
  crumbs?: { href: string; label: string }[];
}) {
  return (
    <section className="relative flex h-[260px] items-center justify-center overflow-hidden bg-neutral-900 text-center text-white sm:h-[320px]">
      <Img src={image} alt="" fill sizes="100vw" preload className="object-cover opacity-55" />
      <div className="relative px-6">
        <nav className="mb-3 flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] text-white/70 uppercase">
          <Link href="/" className="hover:text-white">Home</Link>
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-2">
              <span>/</span>
              <Link href={c.href} className="hover:text-white">{c.label}</Link>
            </span>
          ))}
        </nav>
        <h1 className="animate-fade-up font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="animate-fade-up mx-auto mt-3 max-w-xl text-sm text-white/80 [animation-delay:100ms]">{subtitle}</p>}
      </div>
    </section>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`section-title ${className ?? ""}`}>{children}</h2>;
}
