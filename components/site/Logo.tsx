import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand marks generated from the Urban Distribution Hub logo (see public/brand):
 * - "seal":  the full round logo with tagline (hero header, footer, about)
 * - "light": white house mark + name, for dark backgrounds
 * - "dark":  maroon house mark + name, for light backgrounds
 */
export function Logo({
  name,
  variant = "light",
  size = 40,
  className,
  showName = true,
  priority,
  src,
}: {
  name: string;
  variant?: "seal" | "light" | "dark";
  size?: number;
  className?: string;
  showName?: boolean;
  priority?: boolean;
  /** custom logo uploaded in the admin panel (replaces the built-in file) */
  src?: string;
}) {
  if (variant === "seal") {
    return (
      <Image
        src={src || "/brand/udh-logo.png"}
        unoptimized={!!src && !src.startsWith("/")}
        alt={name}
        width={size}
        height={size}
        preload={priority}
        className={cn("rounded-full", className)}
      />
    );
  }

  const [first, ...rest] = name.split(" ");
  const light = variant === "light";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={(light && src) || (light ? "/brand/udh-mark-white.png" : "/brand/udh-mark.png")}
        unoptimized={!!src && light && !src.startsWith("/")}
        alt={showName ? "" : name}
        width={Math.round(size * 1.07)}
        height={size}
        style={{ height: size, width: "auto" }}
      />
      {showName && (
        <span className={cn("flex flex-col leading-none", light ? "text-white" : "text-navy")}>
          <span className="font-display text-[15px] font-semibold tracking-wide uppercase">{first}</span>
          <span className={cn("mt-0.5 text-[9px] font-medium tracking-[0.22em] uppercase", light ? "text-white/75" : "text-navy/75")}>{rest.join(" ")}</span>
        </span>
      )}
    </span>
  );
}
