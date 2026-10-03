"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Img from "@/components/Img";
import { cn } from "@/lib/utils";
import { SERIES } from "@/lib/chart-colors";

/*
 * Dashboard charts. Palette: single-hue brand maroon for magnitude; the
 * 3-slot categorical set (maroon / gold / green) was run through the dataviz
 * validator — gold sits below 3:1 on white, so every segment ships with a
 * visible label + count (the "relief rule").
 */

const GRID = "#eef0f3";
const AXIS_TEXT = "#94a3b8";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

const niceMax = (v: number) => {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / (pow / 2)) * (pow / 2);
};
const fmtDay = (iso: string, long = false) =>
  new Date(iso).toLocaleDateString("en-GB", long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" });

export function Delta({ current, previous, suffix = "vs previous period" }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0 && current === 0) {
    return <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Minus className="size-3" /> No change {suffix}</span>;
  }
  const pct = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const up = pct > 0;
  const Icon = pct === 0 ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", pct === 0 ? "bg-slate-100 text-slate-600" : up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
        <Icon className="size-3" /> {Math.abs(pct)}%
      </span>
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------ trend (area) */

export function TrendChart({ series, label = "inquiries" }: { series: { date: string; value: number }[]; label?: string }) {
  const RANGES = [7, 30, 90] as const;
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [hover, setHover] = useState<number | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();

  const data = series.slice(-range);
  const prev = series.slice(-range * 2, -range);
  const total = data.reduce((s, d) => s + d.value, 0);
  const prevTotal = prev.reduce((s, d) => s + d.value, 0);
  const peak = data.reduce((m, d) => (d.value > m.value ? d : m), data[0] ?? { date: "", value: 0 });

  const H = 290, PL = 30, PR = 12, PT = 12, PB = 26;
  const W = Math.max(width, 200);
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const x = (i: number) => PL + (data.length > 1 ? (i / (data.length - 1)) * (W - PL - PR) : 0);
  const y = (v: number) => PT + (1 - v / max) * (H - PT - PB);

  const { line, area } = useMemo(() => {
    if (!data.length) return { line: "", area: "" };
    // monotone-ish smoothing with short horizontal control handles
    const pts = data.map((d, i) => [x(i), y(d.value)] as const);
    let l = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const dx = (x1 - x0) / 2.5;
      l += ` C${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`;
    }
    return { line: l, area: `${l} L${pts.at(-1)![0]},${y(0)} L${pts[0][0]},${y(0)} Z` };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, W, max]);

  const ticks = [0, max / 2, max];
  const activeDays = data.filter((d) => d.value > 0).length;
  const byWeekday = data.reduce<number[]>((acc, d) => ((acc[new Date(d.date).getDay()] += d.value), acc), [0, 0, 0, 0, 0, 0, 0]);
  // only name a busiest weekday when one clearly leads (ties would be misleading)
  const top = Math.max(...byWeekday);
  const busiest = top > 0 && byWeekday.filter((v) => v === top).length === 1 ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][byWeekday.indexOf(top)] : "—";
  const labelIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  const h = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{total}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Delta current={total} previous={prevTotal} suffix={`vs previous ${range} days`} />
            {peak?.value > 0 && <span className="text-xs text-slate-500">Peak: <b className="font-medium text-slate-700">{peak.value}</b> on {fmtDay(peak.date)}</span>}
          </div>
        </div>
        <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs" role="tablist" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => (setRange(r), setHover(null))}
              className={cn("rounded-md px-3 py-1.5 font-medium transition", range === r ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100")}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
        {width > 0 && (
          <svg width={W} height={H} className="block touch-none" role="img" aria-label={`${label} per day, last ${range} days: ${total} total`}
            onPointerMove={(e) => {
              const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              const rel = (e.clientX - rect.left - PL) / (W - PL - PR);
              setHover(Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1)))));
            }}
          >
            <defs>
              <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={SERIES.maroon} stopOpacity="0.18" />
                <stop offset="100%" stopColor={SERIES.maroon} stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke={GRID} strokeDasharray={t === 0 ? undefined : "3 4"} />
                <text x={PL - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill={AXIS_TEXT}>{Math.round(t)}</text>
              </g>
            ))}
            {labelIdx.map((i, k) =>
              data[i] ? (
                <text key={k} x={x(i)} y={H - 6} fontSize="11" fill={AXIS_TEXT} textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}>
                  {k === 2 ? "Today" : fmtDay(data[i].date)}
                </text>
              ) : null,
            )}
            <path d={area} fill="url(#trend-fill)" />
            <path d={line} fill="none" stroke={SERIES.maroon} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && h && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={PT} y2={y(0)} stroke="#cbd5e1" />
                <circle cx={x(hover)} cy={y(h.value)} r="5" fill={SERIES.maroon} stroke="#fff" strokeWidth="2" />
              </g>
            )}
          </svg>
        )}
        {hover !== null && h && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-lg bg-slate-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
            style={{ left: Math.min(Math.max(x(hover) - 60, 0), W - 130) }}
          >
            <p className="text-slate-300">{fmtDay(h.date, true)}</p>
            <p className="mt-0.5 font-semibold">{h.value} {h.value === 1 ? label.replace(/s$/, "") : label}</p>
          </div>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 text-center">
        <div className="px-3 py-3">
          <dt className="text-[11px] tracking-wide text-slate-500 uppercase">Avg per day</dt>
          <dd className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums">{(total / Math.max(1, data.length)).toFixed(1)}</dd>
        </div>
        <div className="px-3 py-3">
          <dt className="text-[11px] tracking-wide text-slate-500 uppercase">Busiest day</dt>
          <dd className="mt-0.5 text-lg font-semibold text-slate-900">{busiest}</dd>
        </div>
        <div className="px-3 py-3">
          <dt className="text-[11px] tracking-wide text-slate-500 uppercase">Active days</dt>
          <dd className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums">
            {activeDays}<span className="text-xs font-normal text-slate-400"> / {data.length}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ------------------------------------------------- part-to-whole (stacked) */

export function StatusBar({ segments }: { segments: { key: string; label: string; value: number; color: string; href?: string }[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-slate-100" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
        {total > 0 &&
          segments.filter((s) => s.value > 0).map((s) => (
            <div
              key={s.key}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              className="h-full transition-opacity first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color, opacity: hover && hover !== s.key ? 0.35 : 1 }}
            />
          ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {segments.map((s) => {
          const body = (
            <>
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="flex-1 text-sm text-slate-600">{s.label}</span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">{s.value}</span>
              <span className="w-10 text-right text-xs text-slate-400 tabular-nums">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </>
          );
          return (
            <li key={s.key} onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)} className={cn("rounded-md transition", hover === s.key && "bg-slate-50")}>
              {s.href ? <Link href={s.href} className="flex items-center gap-2.5 px-1 py-0.5">{body}</Link> : <div className="flex items-center gap-2.5 px-1 py-0.5">{body}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------- ranked bar list */

export function BarList({ items, unit }: { items: { key: string; label: string; value: number; href?: string; image?: string; sub?: string }[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-1">
      {items.map((it) => {
        const content = (
          <>
            {it.image !== undefined && (
              <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
                <Img src={it.image} alt="" fill sizes="36px" className="object-cover" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-slate-700 group-hover:text-slate-900">{it.label}</span>
                <span className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
                  {it.value.toLocaleString()}
                  {unit && <span className="ml-0.5 text-xs font-normal text-slate-400">{unit}</span>}
                </span>
              </span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full transition-all duration-700 group-hover:opacity-80" style={{ width: `${(it.value / max) * 100}%`, background: SERIES.maroon }} />
              </span>
              {it.sub && <span className="mt-1 block truncate text-[11px] text-slate-400">{it.sub}</span>}
            </span>
          </>
        );
        return (
          <li key={it.key}>
            {it.href ? (
              <Link href={it.href} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50">{content}</Link>
            ) : (
              <div className="group flex items-center gap-3 rounded-lg px-2 py-2">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------------------------------------------------- tile helpers */

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const W = 120, H = 36;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * W},${H - 3 - (v / max) * (H - 6)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-9 w-28", className)} aria-hidden preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={SERIES.maroon} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ScoreRing({ score, children }: { score: number; children?: ReactNode }) {
  const R = 42, C = 2 * Math.PI * R;
  const color = score >= 80 ? "#0ca30c" : score >= 50 ? "#c98a1b" : "#d03b3b";
  return (
    <div className="relative grid size-28 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" strokeWidth="9" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} className="transition-[stroke-dashoffset] duration-1000" />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-semibold text-slate-900 tabular-nums">{score}%</p>
        {children}
      </div>
    </div>
  );
}
