"use client";

import { useState } from "react";
import { Check, Grid3x3, Info, Layers, Ruler } from "lucide-react";
import { Swatch } from "@/components/Swatch";
import { setSelectedOption, useSelectedOption } from "@/lib/client-store";
import { trackEvent } from "@/lib/meta-pixel";
import type { SwatchColor } from "@/lib/colors";
import {
  ATTRIBUTES, attrValue, choiceAttributes, defaultVariation, effectivePrice, onSale, pickVariation, quoteFor, sizeLabel, STOCK, taka,
  thicknessLabel, variationFor, type Attribute, type PricedProduct, type Variation,
} from "@/lib/pricing";
import { cn, formatPrice } from "@/lib/utils";
import { TileCalculator } from "./TileCalculator";

/** The variation the visitor has picked on this product page (first one by default). */
export function useVariation(productId: string, priced: PricedProduct): Variation | undefined {
  const id = useSelectedOption(productId, "variation", defaultVariation(priced)?.id ?? "");
  return variationFor(priced, id);
}

const TITLES: Record<Attribute, string> = { design: "Design", color: "Colour", size: "Size", sqft: "Sqft", thickness: "Thickness" };

const display = (priced: PricedProduct, a: Attribute, v: Variation) =>
  a === "design" ? v.design : a === "color" ? (priced.colorNames[v.colorId] ?? "") : a === "size" ? sizeLabel(v, priced.unit) : a === "sqft" ? v.sqft : thicknessLabel(v.thickness);

/**
 * Attribute buttons (design, colour, size, sqft, thickness) like a variable product.
 * - groups with a single real choice are hidden (their value is shown with the price)
 * - every value shows the price it leads to, and its stock when it isn't on the shelf
 * - a value that doesn't exist with the current choices says what will change ("→ Walnut"),
 *   and after the click a short note explains the switch
 */
export function VariationPicker({ productId, priced, swatches = [], size = "md" }: {
  productId: string;
  priced: PricedProduct;
  swatches?: SwatchColor[];
  size?: "md" | "lg";
}) {
  const current = useVariation(productId, priced);
  const [note, setNote] = useState("");
  if (!current) return null;
  const swatchById = new Map(swatches.map((s) => [s.id, s]));
  const show = (a: Attribute, v: Variation) => display(priced, a, v);

  // only groups where the customer really chooses between two or more values
  const groups = choiceAttributes(priced)
    .map((a) => ({ a, values: [...new Map(priced.variations.map((v) => [attrValue(v, a), v])).entries()].filter(([value]) => value) }))
    .filter((g) => g.values.length > 1);
  if (!groups.length) return null;
  return (
    <div className="space-y-6">
      {groups.map(({ a, values }) => {
        const others = ATTRIBUTES.filter((x) => x !== a);
        const targets = values.map(([value]) => {
          const on = attrValue(current, a) === value;
          const id = on ? current.id : pickVariation(priced, current.id, a, value);
          return variationFor(priced, id)!;
        });
        const uniformPrice = new Set(targets.map(effectivePrice)).size <= 1;
        return (
          <fieldset key={a}>
            <legend className="mb-3 flex items-baseline gap-2 text-[12px] tracking-wider text-muted uppercase">
              {TITLES[a]}
              <b className="text-[14px] font-semibold tracking-normal text-ink normal-case">{show(a, current)}</b>
            </legend>
            <div className={cn("flex flex-wrap", a === "color" ? "gap-x-4 gap-y-3" : "gap-2.5")} role="radiogroup" aria-label={TITLES[a]}>
              {values.map(([value, sample], i) => {
                const on = attrValue(current, a) === value;
                const target = targets[i];
                // does this value exist together with everything else currently picked?
                const exact = priced.variations.some((v) => attrValue(v, a) === value && others.every((o) => attrValue(v, o) === attrValue(current, o)));
                // what else changes when this value is picked
                const changes = exact || on ? [] : others.filter((o) => attrValue(target, o) !== attrValue(current, o) && show(o, target)).map((o) => show(o, target));
                const label = show(a, sample);
                const price = effectivePrice(target);
                const choose = () => {
                  if (on) return;
                  trackEvent("CustomizeProduct", { content_ids: [productId], content_type: "product", content_name: `${TITLES[a]}: ${label}` });
                  setSelectedOption(productId, "variation", target.id);
                  const switched = others.filter((o) => attrValue(target, o) !== attrValue(current, o) && show(o, target));
                  setNote(switched.length ? `${label} comes in ${switched.map((o) => `${TITLES[o].toLowerCase()} ${show(o, target)}`).join(", ")} — we've switched it for you.` : "");
                };

                if (a === "color") {
                  const sw = swatchById.get(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={label}
                      onClick={choose}
                      className={cn("group flex w-16 flex-col items-center gap-1.5 text-center transition active:scale-95", !exact && !on && "opacity-55")}
                    >
                      <span className={cn("relative rounded-full p-0.5 ring-offset-2 transition", on ? "ring-2 ring-ink" : "ring-1 ring-neutral-300 group-hover:ring-neutral-500")}>
                        {sw ? <Swatch color={sw} className={cn(size === "lg" ? "size-12" : "size-11", "block shadow-inner")} /> : <span className="grid size-11 place-items-center rounded-full bg-mist text-[10px]">{label.slice(0, 2)}</span>}
                        {on && (
                          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-ink text-white">
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                        )}
                      </span>
                      <span className={cn("line-clamp-2 text-[11px] leading-tight", on ? "font-semibold text-ink" : "text-muted")}>{label}</span>
                      {!uniformPrice && price > 0 && <span className="text-[10px] text-brand">{taka(price)}</span>}
                      {target.stock === "out" && <span className="text-[9px] tracking-wide text-rose-600 uppercase">Out of stock</span>}
                    </button>
                  );
                }
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={choose}
                    title={changes.length ? `Switches to ${changes.join(", ")}` : undefined}
                    className={cn(
                      "relative flex min-w-24 flex-col items-center border px-4 py-2.5 text-[14px] transition active:scale-95",
                      on ? "border-ink bg-ink text-white shadow-md" : "border-neutral-300 bg-white text-ink hover:border-ink",
                      !exact && !on && "border-dashed text-ink/70",
                    )}
                  >
                    <span className="font-semibold">{label}</span>
                    {price > 0 && (
                      <span className={cn("text-[12px]", on ? "text-white/85" : "text-brand")}>
                        {taka(price)}
                        {onSale(target) && <s className="ml-1 opacity-60">{taka(target.price)}</s>}
                      </span>
                    )}
                    {changes.length > 0 && <span className="mt-0.5 text-[10px] text-muted">→ {changes.join(", ")}</span>}
                    {target.stock === "out" && <span className={cn("text-[9px] tracking-wide uppercase", on ? "text-white/70" : "text-rose-600")}>Out of stock</span>}
                    {on && <Check className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-leaf p-0.5 text-white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
      {note && (
        <p className="animate-fade-up flex items-start gap-2 border border-leaf/40 bg-leaf/10 px-3 py-2 text-[13px] text-ink" role="status">
          <Info className="mt-0.5 size-4 shrink-0 text-leaf" /> {note}
        </p>
      )}
    </div>
  );
}

/** Price per piece of the picked variation, with its key facts as easy-to-read pills. */
export function LivePrice({ productId, priced, className }: { productId: string; priced: PricedProduct; className?: string }) {
  const v = useVariation(productId, priced);
  const q = quoteFor(priced, v?.id ?? "");
  const facts = v
    ? [
        { icon: Grid3x3, label: "Sqft", value: v.sqft },
        { icon: Ruler, label: "Size", value: sizeLabel(v, priced.unit) },
        { icon: Layers, label: "Thickness", value: thicknessLabel(v.thickness) },
      ].filter((f) => f.value)
    : [];
  return (
    <div className={className} aria-live="polite">
      <p className="flex flex-wrap items-baseline gap-x-2 text-3xl font-semibold text-ink">
        <span>
          {formatPrice(q.unitPrice)}
          {q.unitPrice > 0 && <span className="text-base font-normal text-muted"> / piece</span>}
        </span>
        {q.regularPrice > 0 && (
          <>
            <s className="text-lg font-normal text-muted">{taka(q.regularPrice)}</s>
            <span className="bg-brand px-2 py-0.5 text-[12px] font-semibold tracking-wide text-white uppercase">Save {Math.round((1 - q.unitPrice / q.regularPrice) * 100)}%</span>
          </>
        )}
      </p>
      {v && <StockBadge stock={v.stock} />}
      {facts.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {facts.map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-center gap-2 border border-neutral-200 bg-mist/60 px-3 py-1.5 text-[13px]">
              <Icon className="size-4 text-brand" />
              <span className="text-muted">{label}</span>
              <b className="font-semibold text-ink">{value}</b>
            </li>
          ))}
        </ul>
      )}
      {v?.sku && <p className="mt-2 text-[12px] text-muted">SKU {v.sku}</p>}
    </div>
  );
}

const STOCK_STYLE = { in: "text-leaf", low: "text-amber-600", out: "text-rose-600", preorder: "text-sky-700" } as const;

function StockBadge({ stock }: { stock: Variation["stock"] }) {
  const s = STOCK.find((x) => x.value === stock)!;
  const note = stock === "out" ? " — ask us for availability" : stock === "preorder" ? " — order now, delivered on arrival" : stock === "low" ? " — order soon" : "";
  return (
    <p className={cn("mt-1.5 flex items-center gap-1.5 text-[12px] font-medium", STOCK_STYLE[stock])}>
      <span className="size-1.5 rounded-full bg-current" /> {s.label}
      <span className="font-normal text-muted">{note}</span>
    </p>
  );
}

/** Tiles calculator that follows the picked variation (tile size and price per piece). */
export function ProductCalculator({ productId, priced }: { productId: string; priced: PricedProduct }) {
  const v = useVariation(productId, priced);
  const q = quoteFor(priced, v?.id ?? "");
  // remount when the variation changes so the tile size resets to it
  const size = [v ? sizeLabel(v, priced.unit) : "", v?.sqft].filter(Boolean).join(" · ");
  // locked to the product's tile when its size is known; otherwise the customer can enter it
  return <TileCalculator key={v?.id ?? "none"} pieceArea={q.pieceArea || 1} sizeLabel={q.pieceArea ? size : ""} price={q.unitPrice} fixed={q.pieceArea > 0} orderable />;
}
