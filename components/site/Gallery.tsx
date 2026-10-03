"use client";

import { useState } from "react";
import Img from "@/components/Img";
import { cn } from "@/lib/utils";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const src = images[active] ?? "";

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
          alt={alt}
          fill
          preload
          sizes="(max-width:1024px) 100vw, 50vw"
          className="animate-fade-up object-cover transition-transform duration-200"
          style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              className={cn("relative aspect-square overflow-hidden border-2 transition", i === active ? "border-brand" : "border-transparent opacity-70 hover:opacity-100")}
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
