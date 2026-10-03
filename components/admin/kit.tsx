"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, MoreHorizontal, Wand2, X } from "lucide-react";
import { passwordProblems, passwordScore } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

/* --------------------------------------------------------------- drawer */

/** Right-hand slide-over panel (full screen on phones). */
export function Drawer({ open, onClose, title, subtitle, children, footer }: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-[80]", open ? "visible" : "invisible")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>
        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">{open && children}</div>
        {footer && <footer className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">{footer}</footer>}
      </aside>
    </div>
  );
}

/* ---------------------------------------------------------- action menu */

export interface MenuItem {
  label: string;
  icon: typeof Copy;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
  divider?: boolean;
}

/** "⋯" button with a dropdown of row actions. */
export function ActionMenu({ items, label = "Actions" }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const visible = items.filter((i) => !i.hidden);
  if (!visible.length) return null;
  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn("rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700", open && "bg-slate-100 text-slate-700")}
        aria-label={label}
        aria-expanded={open}
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <div className="animate-pop absolute top-full right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {visible.map(({ label: l, icon: Icon, onClick, danger, divider }) => (
            <div key={l}>
              {divider && <div className="my-1 h-px bg-slate-100" />}
              <button
                onClick={() => (setOpen(false), onClick())}
                className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition", danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50")}
              >
                <Icon className={cn("size-4", danger ? "text-rose-500" : "text-slate-400")} /> {l}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------- password field */

const STRENGTH = [
  { label: "Too weak", color: "bg-rose-500" },
  { label: "Weak", color: "bg-rose-400" },
  { label: "Fair", color: "bg-amber-400" },
  { label: "Good", color: "bg-emerald-500" },
  { label: "Strong", color: "bg-emerald-600" },
];

export function randomPassword() {
  const words = ["Tile", "Stone", "Hub", "Urban", "Marble", "Floor", "Gloss", "Brick", "Slate", "Oak"];
  const r = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  return `${words[r(words.length)]}-${1000 + r(9000)}-${words[r(words.length)]}${"!@#$%"[r(5)]}`;
}

/** Password input with show/hide, strength meter and optional generator. */
export function PasswordField({ name, label, error, generator, placeholder, autoComplete = "new-password" }: {
  name: string;
  label: string;
  error?: string;
  generator?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const score = passwordScore(value);
  const problems = value ? passwordProblems(value) : [];
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={`pw-${name}`} className="text-sm font-medium text-slate-700">{label}</label>
        {generator && (
          <button type="button" onClick={() => (setValue(randomPassword()), setShow(true))} className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline">
            <Wand2 className="size-3.5" /> Generate strong password
          </button>
        )}
      </div>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={`pw-${name}`}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          className="input pr-10 pl-9 font-mono"
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-700" aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {value && (
        <div className="mt-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full transition", i < score ? STRENGTH[score].color : "bg-slate-200")} />
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            <b className="font-medium text-slate-700">{STRENGTH[score].label}</b>
            {problems.length > 0 && <> · needs {problems.join(", ")}</>}
          </p>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------- secret dialog */

/** Shows freshly generated credentials once, with copy buttons. */
export function CredentialsDialog({ data, onClose }: { data: { title: string; email: string; password: string } | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (data && !d.open) d.showModal();
    if (!data && d.open) d.close();
  }, [data]);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/admin/login` : "/admin/login";
  const all = data ? `Sign in to the admin panel\n${loginUrl}\nEmail: ${data.email}\nPassword: ${data.password}\n(You'll be asked to choose your own password.)` : "";

  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-[min(440px,94vw)] rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm">
      {data && (
        <div className="p-6">
          <span className="grid size-11 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <KeyRound className="size-5" />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">{data.title}</h3>
          <p className="mt-1 text-sm text-slate-500">Share these details securely. The password won&apos;t be shown again.</p>
          <dl className="mt-5 space-y-2">
            {[
              ["Email", data.email],
              ["Temporary password", data.password],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <dt className="text-[11px] tracking-wide text-slate-500 uppercase">{k}</dt>
                  <dd className="truncate font-mono text-sm text-slate-900">{v}</dd>
                </div>
                <button onClick={() => copy(k, v)} className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700" aria-label={`Copy ${k}`}>
                  {copied === k ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                </button>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => copy("all", all)}>
              {copied === "all" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />} Copy invite message
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </dialog>
  );
}

/** Initials avatar with a stable colour per person. */
export function Avatar({ name, size = 36, ring }: { name: string; size?: number; ring?: string }) {
  const palette = ["#9a1219", "#c2410c", "#b45309", "#15803d", "#0f766e", "#1d4ed8", "#6d28d9", "#be185d"];
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: palette[hash % palette.length], boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px ${ring}` : undefined }}
    >
      {initials}
    </span>
  );
}
