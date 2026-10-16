"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Box, Calculator, CircleCheck, Loader2, MapPin, Minus, Phone, Plus, Ruler, Send, ShieldCheck, Truck, X } from "lucide-react";
import Img from "@/components/Img";
import { Swatch, TilePreview } from "@/components/Swatch";
import { submitInquiry, type InquiryState } from "@/app/actions";
import { openQuote, useSelectedColor, type QuotePreset } from "@/lib/client-store";
import { cn, formatPrice } from "@/lib/utils";
import { newEventId, trackEvent } from "@/lib/meta-pixel";
import { ColorPicker, type PickerColor } from "./ColorPicker";

export interface QuoteProduct {
  id: string;
  name: string;
  code: string;
  size: string;
  finish: string;
  price: number;
  sqftPerBox: number;
  piecesPerBox: number;
  image: string;
}

const SQFT_PER_SQM = 10.7639;

/** WhatsApp link that mentions the colour currently picked on the page. */
export function WhatsAppButton({ phone, product, colors, className, children }: {
  phone: string;
  product: Pick<QuoteProduct, "id" | "name" | "code">;
  colors: { id: string; name: string }[];
  className?: string;
  children: React.ReactNode;
}) {
  const colorId = useSelectedColor(product.id, colors[0]?.id ?? "");
  const color = colors.find((c) => c.id === colorId);
  const text = `Hi, I'm interested in ${product.name} (${product.code})${color ? ` in ${color.name}` : ""}.`;
  return (
    <a href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

/** Button that opens the order popup (works anywhere on a product page). */
export function QuoteButton({ className, children, preset }: { className?: string; children: React.ReactNode; preset?: QuotePreset }) {
  return (
    <button type="button" onClick={() => openQuote(preset)} className={className}>
      {children}
    </button>
  );
}

/**
 * "Request a quote" popup — the customer picks a colour, quantity and leaves
 * their details in one place. Opened by any `openQuote()` call.
 */
export function QuoteDialog({ product, colors, phone }: { product: QuoteProduct; colors: (PickerColor & { photo: string })[]; phone: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<QuotePreset>({});
  // a new form after a finished request; an unfinished one keeps what was typed
  const [session, setSession] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<QuotePreset>).detail ?? {};
      setPreset(detail);
      if (done || detail.boxes) {
        setSession((s) => s + 1);
        setDone(false);
      }
      setOpen(true);
      trackEvent("InitiateCheckout", {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        num_items: detail.boxes ?? 1,
        value: product.price ? product.price * (detail.boxes ?? 1) : undefined,
        currency: product.price ? "BDT" : undefined,
      });
    };
    window.addEventListener("open-quote", onOpen);
    return () => window.removeEventListener("open-quote", onOpen);
  }, [done, product]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.body.style.overflow = "hidden";
    }
    if (!open && d.open) d.close();
    if (!open) document.body.style.overflow = "";
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === ref.current && setOpen(false)}
      className="m-0 mt-auto h-[94dvh] max-h-none w-full max-w-none overflow-hidden bg-white p-0 shadow-2xl backdrop:bg-black/55 backdrop:backdrop-blur-[3px] open:animate-fade-up sm:m-auto sm:h-[min(780px,92dvh)] sm:w-[min(980px,94vw)]"
      aria-label={`Request a quote for ${product.name}`}
    >
      {open && (
        <QuoteForm key={session} product={product} colors={colors} phone={phone} preset={preset} onClose={() => setOpen(false)} onDone={() => setDone(true)} />
      )}
    </dialog>
  );
}

function QuoteForm({ product, colors, phone, preset, onClose, onDone }: {
  product: QuoteProduct;
  colors: (PickerColor & { photo: string })[];
  phone: string;
  preset: QuotePreset;
  onClose: () => void;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(async (prev, fd) => {
    // the server sends the same Lead through the Conversions API with this id (de-duplication)
    const eventId = newEventId();
    fd.set("fbEventId", eventId);
    const r = await submitInquiry(prev, fd);
    if (r.ok) {
      const n = Number(fd.get("boxes")) || 0;
      trackEvent(
        "Lead",
        {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          num_items: n,
          value: product.price ? product.price * n : undefined,
          currency: product.price ? "BDT" : undefined,
          color: colors.find((c) => c.id === fd.get("colorId"))?.name,
        },
        { id: eventId, relay: false },
      );
      onDone();
    }
    return r;
  }, {});
  const colorId = useSelectedColor(product.id, colors[0]?.id ?? "");
  const color = colors.find((c) => c.id === colorId) ?? colors[0];

  const [mode, setMode] = useState<"boxes" | "room">(preset.area && !preset.boxes ? "room" : "boxes");
  const [boxesInput, setBoxesInput] = useState(preset.boxes ?? 10);
  const [length, setLength] = useState(12);
  const [width, setWidth] = useState(10);
  const [unit, setUnit] = useState<"ft" | "m">("ft");
  const [wastage, setWastage] = useState(10);

  const roomSqft = length * width * (unit === "m" ? SQFT_PER_SQM : 1);
  const roomBoxes = product.sqftPerBox > 0 ? Math.ceil((roomSqft * (1 + wastage / 100)) / product.sqftPerBox) : 0;
  const boxes = mode === "room" ? roomBoxes : boxesInput;
  const area = mode === "room" ? roomSqft : (preset.area ?? boxes * product.sqftPerBox);
  const total = boxes * product.price;
  const photo = color?.photo || product.image;
  const err = state.errors ?? {};

  if (state.ok) {
    const wa = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
      `Hi, I just requested a quote (${state.reference}) for ${product.name}${color ? ` in ${color.name}` : ""} — ${boxes} boxes.`,
    )}`;
    return (
      <div className="flex h-full flex-col items-center justify-center overflow-y-auto p-8 text-center sm:p-12">
        <span className="grid size-16 place-items-center rounded-full bg-leaf/15 text-leaf"><CircleCheck className="size-8" /></span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink">Request received</h2>
        {state.reference && (
          <p className="mt-2 text-sm text-muted">
            Your reference: <b className="font-mono text-base tracking-wider text-brand">{state.reference}</b>
          </p>
        )}
        <p className="mt-3 max-w-md text-[15px] text-neutral-600">{state.message}</p>
        <div className="mt-6 flex w-full max-w-sm items-center gap-3 border border-neutral-200 p-3 text-left">
          {color ? <Swatch color={color} className="size-10 shadow-inner" /> : <Box className="size-8 text-muted" />}
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold text-ink">{product.name}</p>
            <p className="text-muted">{color?.name ?? "Any colour"} · {boxes} boxes{product.price > 0 && ` · ≈ ${formatPrice(total)}`}</p>
          </div>
        </div>
        <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 bg-[#25D366] px-4 py-3 text-[12px] font-medium tracking-wider text-white uppercase">
            WhatsApp us
          </a>
          <button onClick={onClose} className="flex-1 border border-ink px-4 py-3 text-[12px] tracking-wider text-ink uppercase transition hover:bg-ink hover:text-white">
            Done
          </button>
        </div>
      </div>
    );
  }

  const input = "w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none aria-invalid:border-red-500";
  const step = (n: number, title: string, aside?: React.ReactNode) => (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="grid size-6 place-items-center rounded-full bg-navy text-[11px] font-semibold text-white">{n}</span>
      <h3 className="flex-1 text-[13px] font-semibold tracking-wider text-ink uppercase">{title}</h3>
      {aside}
    </div>
  );

  return (
    <form action={action} className="grid h-full grid-rows-[minmax(0,1fr)] md:grid-cols-[340px_1fr]">
      <input type="hidden" name="kind" value="quote" />
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="colorId" value={color?.id ?? ""} />
      <input type="hidden" name="boxes" value={boxes} />
      <input type="hidden" name="area" value={area.toFixed(1)} />
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* summary */}
      <aside className="relative hidden flex-col overflow-y-auto bg-mist md:flex">
        <div className="relative aspect-square shrink-0">
          {photo ? (
            <Img key={photo} src={photo} alt={product.name} fill sizes="340px" className="animate-fade-up object-cover" />
          ) : (
            color && <TilePreview color={color} className="absolute inset-0" />
          )}
          {color && (
            <span className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 py-1 pr-3 pl-1 text-[12px] font-medium text-ink shadow">
              <Swatch color={color} className="size-6" /> {color.name}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="font-display text-lg font-semibold text-ink">{product.name}</p>
          <p className="text-[12px] text-muted">{product.code} · {product.size} · {product.finish}</p>
          <dl className="mt-4 space-y-2 border-t border-neutral-300/60 pt-4 text-[13px]">
            <Row label="Colour" value={color?.name ?? "—"} />
            <Row label="Boxes" value={String(boxes)} />
            <Row label="Covers" value={`${(boxes * product.sqftPerBox).toFixed(1)} sqft · ${boxes * product.piecesPerBox} pcs`} />
            {product.price > 0 && <Row label="Price / box" value={formatPrice(product.price)} />}
          </dl>
          <div className="mt-auto pt-5">
            <p className="text-[11px] tracking-wider text-muted uppercase">Estimated total</p>
            <p className="font-display text-2xl font-semibold text-ink">{product.price > 0 ? formatPrice(total) : "Price on request"}</p>
            <p className="mt-1 text-[11px] text-muted">Final price is confirmed by our sales team.</p>
          </div>
        </div>
      </aside>

      {/* steps */}
      <div className="flex min-h-0 flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-7">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-brand uppercase">Request a quote</p>
            <h2 className="font-display text-xl font-semibold text-ink">{product.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="-mr-2 rounded-full p-2 text-muted transition hover:bg-mist hover:text-ink" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-7">
          {colors.length > 0 && (
            <section>
              {step(1, "Choose your colour")}
              <ColorPicker productId={product.id} colors={colors} size="lg" label="Selected" />
            </section>
          )}

          <section>
            {step(colors.length ? 2 : 1, "How much do you need?",
              <div className="flex border border-neutral-300 text-[11px]">
                {([["boxes", "Boxes", Box], ["room", "Room size", Ruler]] as const).map(([m, l, Icon]) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={cn("flex items-center gap-1 px-2.5 py-1.5 transition", mode === m ? "bg-navy text-white" : "text-ink hover:bg-mist")}>
                    <Icon className="size-3.5" /> {l}
                  </button>
                ))}
              </div>,
            )}
            {mode === "boxes" ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center border border-neutral-300">
                  <button type="button" onClick={() => setBoxesInput((b) => Math.max(1, b - 1))} className="grid size-11 place-items-center text-ink hover:bg-mist" aria-label="Fewer boxes"><Minus className="size-4" /></button>
                  <input
                    type="number"
                    min={1}
                    value={boxesInput || ""}
                    onChange={(e) => setBoxesInput(Math.max(0, Math.round(Number(e.target.value))))}
                    aria-invalid={!!err.boxes}
                    className="h-11 w-20 border-x border-neutral-300 text-center text-lg font-semibold text-ink focus:outline-none"
                    aria-label="Number of boxes"
                  />
                  <button type="button" onClick={() => setBoxesInput((b) => b + 1)} className="grid size-11 place-items-center text-ink hover:bg-mist" aria-label="More boxes"><Plus className="size-4" /></button>
                </div>
                <p className="text-[13px] text-muted">
                  = <b className="text-ink">{(boxes * product.sqftPerBox).toFixed(1)} sqft</b> · {boxes * product.piecesPerBox} pieces
                </p>
                <button type="button" onClick={() => setMode("room")} className="flex items-center gap-1 text-[12px] font-medium text-brand hover:underline">
                  <Calculator className="size-3.5" /> Not sure? Calculate from room size
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <NumField label={`Length (${unit})`} value={length} onChange={setLength} />
                  <NumField label={`Width (${unit})`} value={width} onChange={setWidth} />
                  <NumField label="Wastage %" value={wastage} onChange={setWastage} step={1} />
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium tracking-wide text-muted uppercase">Unit</span>
                    <select value={unit} onChange={(e) => setUnit(e.target.value as "ft" | "m")} className={input}>
                      <option value="ft">Feet</option>
                      <option value="m">Metres</option>
                    </select>
                  </label>
                </div>
                <p className="mt-3 bg-mist px-3 py-2 text-[13px] text-ink">
                  {roomSqft.toFixed(1)} sqft + {wastage}% → <b className="text-brand">{roomBoxes} boxes</b> ({roomBoxes * product.piecesPerBox} pieces)
                </p>
              </div>
            )}
            {err.boxes && <p className="mt-1.5 text-[12px] text-red-600">{err.boxes}</p>}
          </section>

          <section>
            {step(colors.length ? 3 : 2, "Your details")}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name *" error={err.name}>
                <input name="name" autoComplete="name" aria-invalid={!!err.name} className={input} />
              </Field>
              <Field label="Phone *" error={err.phone}>
                <input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX" aria-invalid={!!err.phone} className={input} />
              </Field>
              <Field label="Email (optional)" error={err.email}>
                <input name="email" type="email" autoComplete="email" aria-invalid={!!err.email} className={input} />
              </Field>
              <Field label="Delivery area">
                <span className="relative block">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                  <input name="location" autoComplete="address-level2" placeholder="e.g. Mirpur, Dhaka" className={cn(input, "pl-9")} />
                </span>
              </Field>
              <Field label="Anything else? (optional)" error={err.message} full>
                <textarea name="message" rows={2} placeholder="Delivery date, project type, other sizes…" className={input} />
              </Field>
            </div>
          </section>
        </div>

        <footer className="border-t border-neutral-200 bg-white px-5 py-4 sm:px-7">
          {/* compact summary on phones (the side panel is hidden there) */}
          <div className="mb-3 flex items-center gap-3 md:hidden">
            {color && <Swatch color={color} className="size-8" />}
            <p className="flex-1 text-[13px] text-ink">
              <b>{boxes} boxes</b>{color && ` · ${color.name}`}
            </p>
            {product.price > 0 && <p className="text-[15px] font-semibold text-ink">≈ {formatPrice(total)}</p>}
          </div>
          {state.message && !state.ok && <p className="mb-2 text-[12px] text-red-600">{state.message}</p>}
          <button disabled={pending} className="flex w-full items-center justify-center gap-2 bg-navy px-6 py-3.5 text-[12px] tracking-wider text-white uppercase transition hover:bg-navy-deep disabled:opacity-60">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {pending ? "Sending…" : "Send quote request"}
          </button>
          <p className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted">
            <span className="flex items-center gap-1"><ShieldCheck className="size-3.5" /> No payment now</span>
            <span className="flex items-center gap-1"><Phone className="size-3.5" /> We call to confirm</span>
            <span className="flex items-center gap-1"><Truck className="size-3.5" /> Nationwide delivery</span>
          </p>
        </footer>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function Field({ label, error, full, children }: { label: string; error?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1 block text-[12px] font-medium text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
    </label>
  );
}

function NumField({ label, value, onChange, step = 0.5 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium tracking-wide text-muted uppercase">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
      />
    </label>
  );
}
