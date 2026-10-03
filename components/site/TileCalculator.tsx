"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

const SQFT_PER_SQM = 10.7639;

/** Works out boxes needed from room size, tile coverage and wastage. */
export function TileCalculator({
  sqftPerBox: initialSqft = 15.5,
  piecesPerBox: initialPieces = 4,
  price = 0,
  compact = false,
}: {
  sqftPerBox?: number;
  piecesPerBox?: number;
  price?: number;
  compact?: boolean;
}) {
  const [unit, setUnit] = useState<"ft" | "m">("ft");
  const [length, setLength] = useState(12);
  const [width, setWidth] = useState(10);
  const [wastage, setWastage] = useState(10);
  const [sqftPerBox, setSqftPerBox] = useState(initialSqft);
  const [piecesPerBox, setPiecesPerBox] = useState(initialPieces);

  const areaSqft = length * width * (unit === "m" ? SQFT_PER_SQM : 1);
  const needed = areaSqft * (1 + wastage / 100);
  const boxes = sqftPerBox > 0 ? Math.ceil(needed / sqftPerBox) : 0;
  const pieces = boxes * piecesPerBox;
  const cost = boxes * price;

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
            <button key={u} onClick={() => setUnit(u)} className={`px-2.5 py-1 ${unit === u ? "bg-navy text-white" : "text-ink"}`}>
              {u === "ft" ? "Feet" : "Metres"}
            </button>
          ))}
        </div>
      </div>
      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
        {num(`Length (${unit})`, length, setLength)}
        {num(`Width (${unit})`, width, setWidth)}
        {num("Wastage %", wastage, setWastage, 1)}
        {!compact && num("Sqft per box", sqftPerBox, setSqftPerBox, 0.1)}
        {!compact && num("Pieces per box", piecesPerBox, setPiecesPerBox, 1)}
      </div>
      <dl className="mt-5 grid grid-cols-3 divide-x divide-neutral-200 border-t border-neutral-200 pt-4 text-center">
        <div>
          <dt className="text-[10px] tracking-wider text-muted uppercase">Area</dt>
          <dd className="mt-1 text-lg font-semibold text-ink">{areaSqft.toFixed(1)}<span className="text-xs font-normal"> sqft</span></dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wider text-muted uppercase">Boxes</dt>
          <dd className="mt-1 text-lg font-semibold text-brand">{boxes}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wider text-muted uppercase">Pieces</dt>
          <dd className="mt-1 text-lg font-semibold text-ink">{pieces}</dd>
        </div>
      </dl>
      {price > 0 && (
        <p className="mt-4 bg-mist px-3 py-2 text-center text-[13px] text-ink">
          Estimated cost: <b>৳ {cost.toLocaleString("en-IN")}</b>
        </p>
      )}
    </div>
  );
}
