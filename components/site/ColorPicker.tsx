"use client";

import { Check } from "lucide-react";
import { Swatch } from "@/components/Swatch";
import { setSelectedColor, useSelectedColor } from "@/lib/client-store";
import type { SwatchColor } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/meta-pixel";

export type PickerColor = SwatchColor & { description?: string };

/** Swatch buttons for choosing a tile colour. Shares its choice with the gallery and quote popup. */
export function ColorPicker({ productId, colors, size = "md", label = "Colour" }: {
  productId: string;
  colors: PickerColor[];
  size?: "md" | "lg";
  label?: string;
}) {
  const selectedId = useSelectedColor(productId, colors[0]?.id ?? "");
  const selected = colors.find((c) => c.id === selectedId) ?? colors[0];
  if (!colors.length) return null;
  const dim = size === "lg" ? "size-12" : "size-10";

  return (
    <fieldset>
      <legend className="mb-2.5 text-[11px] tracking-wider text-muted uppercase">
        {label}: <b className="font-semibold text-ink normal-case">{selected?.name}</b>
        {selected?.code && <span className="ml-1.5 text-neutral-400 normal-case">{selected.code}</span>}
        {colors.length > 1 && <span className="ml-1.5 text-neutral-400 normal-case">· {colors.length} colours</span>}
      </legend>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={label}>
        {colors.map((c) => {
          const on = c.id === selected?.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={c.name}
              title={c.name}
              onClick={() => {
                if (c.id !== selected?.id) trackEvent("CustomizeProduct", { content_ids: [productId], content_type: "product", color: c.name });
                setSelectedColor(productId, c.id);
              }}
              className={cn(
                "group relative rounded-full p-0.5 ring-offset-2 transition active:scale-95",
                on ? "ring-2 ring-ink" : "ring-1 ring-neutral-300 hover:ring-neutral-500",
              )}
            >
              <Swatch color={c} className={cn(dim, "block shadow-inner")} />
              {on && (
                <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-ink text-white">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selected?.description && <p className="mt-2 text-[12px] text-muted">{selected.description}</p>}
    </fieldset>
  );
}
