"use client";

import { useState } from "react";
import Img from "@/components/Img";
import { useSelectedColor, useSelectedOption } from "@/lib/client-store";
import { cn } from "@/lib/utils";

/**
 * Product photos with hover zoom. Picking a variation (design / colour / size) with its own
 * photos swaps the gallery to them; otherwise a colour photo is shown when there is one.
 */
export function Gallery({ images: mainImages, alt, productId = "", colorPhotos = [], variationPhotos = [], defaultVariationId = "" }: {
  images: string[];
  alt: string;
  productId?: string;
  colorPhotos?: { colorId: string; photo: string; name: string }[];
  variationPhotos?: { variationId: string; images: string[] }[];
  defaultVariationId?: string;
}) {
  const selectedColor = useSelectedColor(productId, colorPhotos[0]?.colorId ?? "");
  const colorPhoto = colorPhotos.find((c) => c.colorId === selectedColor)?.photo ?? "";
  // a variation with its own photos replaces the main gallery while it's selected
  const selectedVariation = useSelectedOption(productId, "variation", defaultVariationId || (variationPhotos[0]?.variationId ?? ""));
  const variationImages = variationPhotos.find((v) => v.variationId === selectedVariation)?.images ?? [];
  const images = variationImages.length ? variationImages : mainImages;
  // colour photos that aren't already in the gallery become extra thumbnails
  const all = [...images, ...colorPhotos.map((c) => c.photo).filter((p) => p && !images.includes(p))];

  // follow the colour choice until the visitor clicks a thumbnail themselves
  const choice = `${selectedVariation}|${selectedColor}`;
  const [picked, setPicked] = useState<{ src: string; forColor: string } | null>(null);
  const manual = picked && picked.forColor === choice && all.includes(picked.src) ? picked.src : null;
  const src = manual ?? ((variationImages.length ? variationImages[0] : colorPhoto) || all[0] || "");
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const label = colorPhotos.find((c) => c.photo === src)?.name;

  return (
    <div>
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden bg-mist"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <Img
          key={src}
          src={src}
          alt={label ? `${alt} in ${label}` : alt}
          fill
          preload
          sizes="(max-width:1024px) 100vw, 50vw"
          className="animate-fade-up object-cover transition-transform duration-200"
          style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
        {label && (
          <span className="pointer-events-none absolute bottom-3 left-3 bg-white/90 px-2.5 py-1 text-[11px] font-medium tracking-wide text-ink">{label}</span>
        )}
      </div>
      {all.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {all.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setPicked({ src: img, forColor: choice })}
              className={cn("relative aspect-square overflow-hidden border-2 transition", img === src ? "border-brand" : "border-transparent opacity-70 hover:opacity-100")}
              aria-label={`Show image ${i + 1}`}
            >
              <Img src={img} alt="" fill sizes="100px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
