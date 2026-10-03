import type { Settings } from "@/lib/types";
import { cn } from "@/lib/utils";

const PATHS: Record<keyof Settings["socials"], string> = {
  facebook: "M14 8.5V6.6c0-.8.5-1 .9-1h2.4V2h-3.3C10.3 2 9.6 4.7 9.6 6.4v2.1H7.5V12h2.1v10H14V12h2.9l.4-3.5H14z",
  instagram:
    "M12 7.3A4.7 4.7 0 1 0 16.7 12 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm6-7.9a1.1 1.1 0 1 1-1.1-1.1A1.1 1.1 0 0 1 18 7.1zM21.9 8.2a5.4 5.4 0 0 0-1.5-3.8 5.5 5.5 0 0 0-3.8-1.5C15.1 2.8 8.9 2.8 7.4 2.9a5.5 5.5 0 0 0-3.8 1.5 5.4 5.4 0 0 0-1.5 3.8c-.1 1.5-.1 6.1 0 7.6a5.4 5.4 0 0 0 1.5 3.8 5.5 5.5 0 0 0 3.8 1.5c1.5.1 7.7.1 9.2 0a5.4 5.4 0 0 0 3.8-1.5 5.5 5.5 0 0 0 1.5-3.8c.1-1.5.1-6.1 0-7.6zM19.8 18a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.2.1-5.3-.4A3 3 0 0 1 5.8 18c-.5-1.2-.4-4-.4-5.3s-.1-4.2.4-5.3a3 3 0 0 1 1.7-1.7c1.2-.5 4-.4 5.3-.4s4.2-.1 5.3.4a3 3 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3z",
  youtube:
    "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z",
  linkedin:
    "M6.9 21H3.2V9h3.7zM5 7.4a2.1 2.1 0 1 1 2.2-2.1A2.1 2.1 0 0 1 5 7.4zM21 21h-3.7v-5.8c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1V21H9.4V9h3.5v1.6a3.9 3.9 0 0 1 3.5-1.9c3.7 0 4.4 2.4 4.4 5.6z",
  pinterest:
    "M12.3 2C6.8 2 4 5.9 4 9.2c0 2 .8 3.7 2.4 4.4.3.1.5 0 .6-.3l.2-.9c.1-.3 0-.4-.2-.7a3.4 3.4 0 0 1-.8-2.3 5.6 5.6 0 0 1 5.9-5.7c3.2 0 5 2 5 4.6 0 3.5-1.5 6.4-3.8 6.4a1.9 1.9 0 0 1-1.9-2.3c.4-1.5 1.1-3.2 1.1-4.3a1.6 1.6 0 0 0-1.6-1.8c-1.3 0-2.3 1.3-2.3 3.1a4.6 4.6 0 0 0 .4 1.9l-1.5 6.5a13 13 0 0 0 0 4.5.2.2 0 0 0 .3.1 12.3 12.3 0 0 0 2.2-4l.8-3.3a3.5 3.5 0 0 0 3 1.5c3.9 0 6.6-3.6 6.6-8.4C20.4 5.5 17.1 2 12.3 2z",
};

export function SocialIcons({
  socials,
  className,
  itemClassName,
}: {
  socials: Settings["socials"];
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {(Object.keys(PATHS) as (keyof Settings["socials"])[])
        .filter((k) => socials[k])
        .map((k) => (
          <li key={k}>
            <a
              href={socials[k]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={k}
              className={cn(
                "grid size-7 place-items-center rounded-full border border-white/70 text-white transition hover:bg-white hover:text-navy",
                itemClassName,
              )}
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
                <path d={PATHS[k]} />
              </svg>
            </a>
          </li>
        ))}
    </ul>
  );
}
