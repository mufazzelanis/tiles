"use client";

import { useState } from "react";
import { Calculator, ShoppingBag } from "lucide-react";
import { openQuote } from "@/lib/client-store";
import { cn } from "@/lib/utils";

const SQFT_PER_SQM = 10.7639;
/** Common tile sizes in inches → sqft per piece. */
const TILE_SIZES: [string, number][] = [["12x12", 1], ["16x16", 16 * 16 / 144], ["12x24", 2], ["24x24", 4], ["24x48", 8], ["32x32", 32 * 32 / 144]];

/** Works out how many pieces cover a room, and what they cost at the price per piece. */
export function TileCalculator({
  pieceArea: initialArea = 1,
  sizeLabel = "",
  price = 0,
  compact = false,
  orderable = false,
  fixed = false,
}: {
  /** sqft one piece covers (pre-filled from the product) */
  pieceArea?: number;
  /** the product's size, shown instead of the size chips */
  sizeLabel?: string;
  /** price per piece */
  price?: number;
  compact?: boolean;
  /** show an "Order these pieces" button that opens the quote popup */
  orderable?: boolean;
  /** tile size and price come from the product and can't be edited */
  fixed?: boolean;
}) {
  const [unit, setUnit] = useState<"ft" | "m">("ft");
  const [length, setLength] = useState(12);
  const [width, setWidth] = useState(10);
  const [wastage, setWastage] = useState(10);
  const [area, setArea] = useState(Math.round(initialArea * 10000) / 10000 || 1);

  const areaSqft = length * width * (unit === "m" ? SQFT_PER_SQM : 1);
  const needed = areaSqft * (1 + wastage / 100);
  const pieces = area > 0 ? Math.ceil(needed / area) : 0;
  const cost = pieces * price;

  const num = (label: string, value: number, set: (n: number) => void, step = 0.5) => (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium tracking-wide text-muted uppercase">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => set(Math.max(0, Number(e.target.value)))}
        className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
      />
    </label>
  );

  return (
    <div className="border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-ink uppercase">
          <Calculator className="size-4" /> Tiles calculator
        </h3>
        <div className="flex border border-neutral-300 text-[11px]">
          {(["ft", "m"] as const).map((u) => (
            <button key={u} type="button" onClick={() => setUnit(u)} className={`px-2.5 py-1 ${unit === u ? "bg-navy text-white" : "text-ink"}`}>
              {u === "ft" ? "Feet" : "Metres"}
            </button>
          ))}
        </div>
      </div>
      <div className={`grid gap-3 ${compact ? "grid-cols-2" : fixed ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
        {num(`Room length (${unit})`, length, setLength)}
        {num(`Room width (${unit})`, width, setWidth)}
        {num("Wastage %", wastage, setWastage, 1)}
        {!fixed && num("Sqft per piece", area, setArea, 0.01)}
      </div>
      {fixed ? (
        // the tile comes from the product — customers can't change it by mistake
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-neutral-200 bg-mist/50 px-3 py-2 text-[12px]">
          <span className="text-muted">
            Tile{sizeLabel && <> <b className="text-ink">{sizeLabel}</b></>} · <b className="text-ink">{area.toLocaleString("en-IN", { maximumFractionDigits: 2 })} sqft</b> per piece
          </span>
          {price > 0 && <b className="text-ink">৳{price.toLocaleString("en-IN")} / piece</b>}
        </div>
      ) : sizeLabel ? (
        <p className="mt-2 text-[11px] text-muted">Tile size: <b className="text-ink">{sizeLabel}</b></p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted">Tile size (inch):</span>
          {TILE_SIZES.map(([label, sqft]) => (
            <button
              key={label}
              type="button"
              onClick={() => setArea(Math.round(sqft * 10000) / 10000)}
              className={cn("border px-2 py-0.5 text-[11px] transition", Math.abs(area - sqft) < 0.001 ? "border-navy bg-navy text-white" : "border-neutral-300 text-ink hover:border-ink")}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <dl className="mt-5 grid grid-cols-3 divide-x divide-neutral-200 border-t border-neutral-200 pt-4 text-center">
        <div>
          <dt className="text-[10px] tracking-wider text-muted uppercase">Area</dt>
          <dd className="mt-1 text-lg font-semibold text-ink">{areaSqft.toFixed(1)}<span className="text-xs font-normal"> sqft</span></dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wider text-muted uppercase">With wastage</dt>
          <dd className="mt-1 text-lg font-semibold text-ink">{needed.toFixed(1)}<span className="text-xs font-normal"> sqft</span></dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wider text-muted uppercase">Pieces</dt>
          <dd className="mt-1 text-lg font-semibold text-brand">{pieces.toLocaleString("en-IN")}</dd>
        </div>
      </dl>
      {price > 0 && (
        <p className="mt-4 bg-mist px-3 py-2 text-center text-[13px] text-ink">
          {pieces.toLocaleString("en-IN")} pcs × ৳{price.toLocaleString("en-IN")} = <b>৳ {cost.toLocaleString("en-IN")}</b>
        </p>
      )}
      {orderable && pieces > 0 && (
        <button
          type="button"
          onClick={() => openQuote({ pieces, area: Math.round(areaSqft * 10) / 10 })}
          className="mt-3 flex w-full items-center justify-center gap-2 bg-navy px-4 py-3 text-[12px] tracking-wider text-white uppercase transition hover:bg-navy-deep"
        >
          <ShoppingBag className="size-4" /> Order these {pieces.toLocaleString("en-IN")} pieces
        </button>
      )}
    </div>
  );
}
