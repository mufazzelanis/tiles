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

/* ------------------------------------------- selected colour per product */

const COLOR_EVENT = "tilora-color";
const selectedColors = new Map<string, string>();
const subscribeColor = (cb: () => void) => {
  window.addEventListener(COLOR_EVENT, cb);
  return () => window.removeEventListener(COLOR_EVENT, cb);
};

/**
 * What a visitor picked on a product page, per option group ("color", "design",
 * "finish", "size") — shared by the pickers, price, gallery, calculator and quote popup.
 */
export function useSelectedOption(productId: string, group: string, fallback = "") {
  const key = `${productId}:${group}`;
  return useSyncExternalStore(subscribeColor, () => selectedColors.get(key) ?? fallback, () => fallback);
}

export function setSelectedOption(productId: string, group: string, id: string) {
  selectedColors.set(`${productId}:${group}`, id);
  window.dispatchEvent(new Event(COLOR_EVENT));
}

export const useSelectedColor = (productId: string, fallback = "") => useSelectedOption(productId, "color", fallback);
export const setSelectedColor = (productId: string, colorId: string) => setSelectedOption(productId, "color", colorId);

/* ------------------------------------------------------------ quote popup */

export interface QuotePreset {
  /** number of tile pieces */
  pieces?: number;
  area?: number;
}

/** Open the order / quote popup from any button on the page. */
export function openQuote(preset: QuotePreset = {}) {
  window.dispatchEvent(new CustomEvent<QuotePreset>("open-quote", { detail: preset }));
}

/** Small app-style toast for the public site. */
export function siteToast(message: string) {
  window.dispatchEvent(new CustomEvent("site-toast", { detail: message }));
}
