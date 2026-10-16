import Link from "next/link";

/** Menu link from the admin panel: site paths use client navigation, external / new-tab links are plain anchors. */
export function MenuLink({ href, newTab = false, className, children }: { href: string; newTab?: boolean; className?: string; children: React.ReactNode }) {
  if (newTab || /^(https?:|mailto:|tel:)/i.test(href))
    return (
      <a href={href} className={className} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  return <Link href={href} className={className}>{children}</Link>;
}
