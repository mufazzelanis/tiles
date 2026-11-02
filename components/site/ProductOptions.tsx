"use client";

import { Check } from "lucide-react";
import { setSelectedOption, useSelectedOption } from "@/lib/client-store";
import { trackEvent } from "@/lib/meta-pixel";
import { formatExtra, quoteFor, resolveSelection, type OptionGroup, type PricedProduct, type Selection } from "@/lib/pricing";
import { cn, formatPrice } from "@/lib/utils";
import { TileCalculator } from "./TileCalculator";

/** Current design / finish / size / colour for a product (defaults = first option of each group). */
export function useSelection(productId: string, priced: PricedProduct): Selection {
  const picked = {
    design: useSelectedOption(productId, "design"),
    finish: useSelectedOption(productId, "finish"),
    size: useSelectedOption(productId, "size"),
    color: useSelectedOption(productId, "color"),
  };
  return resolveSelection(priced, picked);
}

const TITLES: Record<Exclude<OptionGroup, "color">, string> = { design: "Design", finish: "Finish", size: "Size" };

/** Buttons for one option group; each shows its price difference. Hidden when there's nothing to choose. */
export function OptionPicker({ productId, priced, group, showSingle = false }: {
  productId: string;
  priced: PricedProduct;
  group: Exclude<OptionGroup, "color">;
  /** also render groups with a single option (as a fixed label) */
  showSingle?: boolean;
}) {
  const selection = useSelection(productId, priced);
  const list = group === "design" ? priced.options.designs : group === "finish" ? priced.options.finishes : priced.options.sizes;
  if (!list.length || (list.length === 1 && !showSingle)) return null;
  const selected = list.find((o) => o.id === selection[group]);
  const priced$ = priced.price > 0;

  return (
    <fieldset>
      <legend className="mb-2.5 text-[11px] tracking-wider text-muted uppercase">
        {TITLES[group]}: <b className="font-semibold text-ink normal-case">{selected?.name}</b>
      </legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={TITLES[group]}>
        {list.map((o) => {
          const on = o.id === selected?.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                if (!on) trackEvent("CustomizeProduct", { content_ids: [productId], content_type: "product", content_name: `${TITLES[group]}: ${o.name}` });
                setSelectedOption(productId, group, o.id);
              }}
              className={cn(
                "relative flex min-w-16 flex-col items-center border px-3.5 py-2 text-[13px] transition active:scale-95",
                on ? "border-ink bg-ink text-white" : "border-neutral-300 bg-white text-ink hover:border-ink",
              )}
            >
              <span className="font-medium">{o.name}</span>
              {priced$ && o.extra !== 0 && <span className={cn("text-[10px]", on ? "text-white/75" : "text-muted")}>{formatExtra(o.extra)}</span>}
              {on && list.length > 1 && <Check className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-leaf p-0.5 text-white" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Box price for the current selection, with a breakdown of what was added. */
export function LivePrice({ productId, priced, className }: { productId: string; priced: PricedProduct; className?: string }) {
  const q = quoteFor(priced, useSelection(productId, priced));
  const extras = q.lines.filter((l) => l.extra !== 0);
  return (
    <div className={className} aria-live="polite">
      <p className="text-2xl font-semibold text-ink">
        {formatPrice(q.unitPrice)}
        {q.unitPrice > 0 && <span className="text-sm font-normal text-muted"> / box</span>}
      </p>
      {q.unitPrice > 0 && (
        <p className="mt-1 text-[12px] text-muted">
          {q.piecesPerBox > 0 && `${q.piecesPerBox} pcs`}
          {q.piecesPerBox > 0 && q.sqftPerBox > 0 && " · "}
          {q.sqftPerBox > 0 && `${q.sqftPerBox} sqft per box`}
          {q.sqftPerBox > 0 && <> · ≈ ৳{Math.round(q.unitPrice / q.sqftPerBox).toLocaleString("en-IN")}/sqft</>}
        </p>
      )}
      {q.unitPrice > 0 && extras.length > 0 && (
        <p className="mt-0.5 text-[11px] text-neutral-400">
          Base ৳{priced.price.toLocaleString("en-IN")} {extras.map((l) => `${formatExtra(l.extra)} ${l.name}`).join(" ")}
        </p>
      )}
    </div>
  );
}

/** Tiles calculator that follows the selected size (box coverage) and price. */
export function ProductCalculator({ productId, priced }: { productId: string; priced: PricedProduct }) {
  const selection = useSelection(productId, priced);
  const q = quoteFor(priced, selection);
  // remount when the size changes so the box values reset to that size
  return <TileCalculator key={selection.size} sqftPerBox={q.sqftPerBox} piecesPerBox={q.piecesPerBox} price={q.unitPrice} orderable />;
}
