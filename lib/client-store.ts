"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed list stores (favorites, recently viewed) that stay
 * in sync across components and browser tabs. Server render always sees [].
 */
const EVENT = "tilora-store";
const EMPTY: string[] = [];
const cache = new Map<string, { raw: string | null; value: string[] }>();

function read(key: string): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value; // stable reference for useSyncExternalStore
  let value: string[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    value = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : EMPTY;
  } catch {}
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function useList(key: string) {
  return useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
}

const FAV_KEY = "tilora:favorites";
const RECENT_KEY = "tilora:recent";

export function useFavorites() {
  const ids = useList(FAV_KEY);
  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => {
      const cur = read(FAV_KEY);
      const added = !cur.includes(id);
      write(FAV_KEY, added ? [id, ...cur] : cur.filter((x) => x !== id));
      return added;
    },
    clear: () => write(FAV_KEY, []),
  };
}

export function useRecentlyViewed() {
  return useList(RECENT_KEY);
}

export function pushRecentlyViewed(id: string) {
  write(RECENT_KEY, [id, ...read(RECENT_KEY).filter((x) => x !== id)].slice(0, 12));
}

/** Small app-style toast for the public site. */
export function siteToast(message: string) {
  window.dispatchEvent(new CustomEvent("site-toast", { detail: message }));
}
