"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/** Lightweight YouTube embed: loads the iframe only after the user clicks play. */
export function VideoEmbed({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black shadow-xl">
      {play ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setPlay(true)} className="group absolute inset-0" aria-label={`Play video: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="size-full object-cover opacity-80 transition group-hover:opacity-95" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-20 place-items-center rounded-full border-4 border-white/90 bg-red-600/90 text-white shadow-2xl transition group-hover:scale-110">
              <Play className="ml-1 size-8 fill-current" />
            </span>
          </span>
          <span className="absolute top-4 left-5 text-left font-display text-lg font-semibold text-white drop-shadow">{title}</span>
        </button>
      )}
    </div>
  );
}
