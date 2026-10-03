"use client";

import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface Group {
  name: string;
  label: string;
  options: { value: string; label: string; count: number }[];
}

/** GET form that re-submits on every change, so filters apply instantly (and still work without JS). */
export function ProductFilters({
  groups,
  selected,
  q,
  sort,
}: {
  groups: Group[];
  selected: Record<string, string[]>;
  q: string;
  sort: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();
  const activeCount = Object.values(selected).flat().length + (q ? 1 : 0);

  return (
    <Form
      ref={form}
      id="filters"
      action="/products"
      scroll={false}
      onChange={(e) => {
        // text search submits on Enter; checkboxes apply immediately
        if ((e.target as unknown as HTMLInputElement).type !== "search") submit();
      }}
    >
      <input type="hidden" name="sort" value={sort} />
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-ink uppercase">
          <SlidersHorizontal className="size-4" /> Advanced search
        </h2>
        {activeCount > 0 && (
          <Link href="/products" scroll={false} className="flex items-center gap-1 text-[11px] text-brand hover:underline">
            <X className="size-3" /> Clear ({activeCount})
          </Link>
        )}
      </div>

      <label className="mt-5 flex items-center border border-neutral-300 focus-within:border-ink">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Name, code, colour…"
          className="w-full bg-transparent px-3 py-2.5 text-sm focus:outline-none"
        />
        <button className="px-3 text-muted hover:text-ink" aria-label="Search">
          <Search className="size-4" />
        </button>
      </label>

      {groups.map((g) => (
        <fieldset key={g.name} className="mt-6 border-t border-neutral-200 pt-5">
          <legend className="sr-only">{g.label}</legend>
          <p className="mb-3 text-[12px] font-semibold tracking-wider text-ink uppercase">{g.label}</p>
          <div className="space-y-2">
            {g.options.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-neutral-600 hover:text-ink">
                <input
                  type="checkbox"
                  name={g.name}
                  value={o.value}
                  defaultChecked={selected[g.name]?.includes(o.value)}
                  className="size-4 accent-brand"
                />
                <span className="flex-1">{o.label}</span>
                <span className="text-[11px] text-neutral-400">{o.count}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <noscript>
        <button className="mt-6 w-full bg-navy py-2.5 text-sm text-white">Apply</button>
      </noscript>
    </Form>
  );
}

export function SortSelect({ value, params }: { value: string; params: string }) {
  return (
    <Form action="/products" scroll={false} className="flex items-center gap-2 text-[13px]">
      {Array.from(new URLSearchParams(params)).map(([k, v], i) =>
        k === "sort" || k === "page" ? null : <input key={i} type="hidden" name={k} value={v} />,
      )}
      <label htmlFor="sort" className="text-muted">Sort by</label>
      <select
        id="sort"
        name="sort"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="border border-neutral-300 bg-white px-2 py-1.5 focus:border-ink focus:outline-none"
      >
        <option value="featured">Featured</option>
        <option value="new">Newest</option>
        <option value="popular">Most viewed</option>
        <option value="name">Name A–Z</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>
    </Form>
  );
}
