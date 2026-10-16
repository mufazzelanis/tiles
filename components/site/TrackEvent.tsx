"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type EventData } from "@/lib/meta-pixel";

/** Fires a Meta event once when a page mounts (and again if `trackKey` changes). */
export function TrackEvent({ name, data, trackKey = "" }: { name: string; data?: EventData; trackKey?: string }) {
  const sent = useRef<string | null>(null);
  useEffect(() => {
    const key = `${name}:${trackKey}`;
    if (sent.current === key) return; // dev-mode double effects
    sent.current = key;
    trackEvent(name, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data is a fresh object each render; trackKey decides
  }, [name, trackKey]);
  return null;
}
