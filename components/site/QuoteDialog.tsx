"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Calculator,
  Check,
  CircleCheck,
  Copy,
  Grid3x3,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  Minus,
  PackageCheck,
  Phone,
  PhoneCall,
  Plus,
  Ruler,
  ShieldCheck,
  Truck,
  User,
  X,
} from "lucide-react";
import Img from "@/components/Img";
import { Swatch, TilePreview } from "@/components/Swatch";
import { submitInquiry, type InquiryState } from "@/app/actions";
import { openQuote, type QuotePreset } from "@/lib/client-store";
import { cn, formatPrice } from "@/lib/utils";
import { newEventId, trackEvent } from "@/lib/meta-pixel";
import type { PickerColor } from "./ColorPicker";
import { useVariation, VariationPicker } from "./ProductOptions";
import { choiceAttributes, priceRange, quoteFor, type PricedProduct } from "@/lib/pricing";

export interface QuoteProduct {
  id: string;
  name: string;
  code: string;
  size: string;
  finish: string;
  price: number;
  image: string;
}

const SQFT_PER_SQM = 10.7639;
/** one-tap quantities */
const QUICK_PIECES = [50, 100, 200, 500];
const n = (v: number) => v.toLocaleString("en-IN");

/** WhatsApp link that mentions the variation (design, colour, size…) currently picked on the page. */
export function WhatsAppButton({ phone, product, priced, className, children }: {
  phone: string;
  product: Pick<QuoteProduct, "id" | "name" | "code">;
  priced: PricedProduct;
  className?: string;
  children: React.ReactNode;
}) {
  const q = quoteFor(priced, useVariation(product.id, priced)?.id ?? "");
  const text = `Hi, I'm interested in ${product.name} (${product.code})${q.lines.length ? ` — ${q.lines.map((l) => l.value).join(", ")}` : ""}.`;
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
 * Order popup — the customer picks the options, the quantity and leaves their details in one place.
 * A bottom sheet on phones, a two-column dialog with an order summary on larger screens.
 * Opened by any `openQuote()` call.
 */
export function QuoteDialog({ product, colors, priced, phone }: {
  product: QuoteProduct;
  colors: (PickerColor & { photo: string })[];
  priced: PricedProduct;
  phone: string;
}) {
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
      if (done || detail.pieces) {
        setSession((s) => s + 1);
        setDone(false);
      }
      setOpen(true);
      const min = priceRange(priced).min;
      trackEvent("InitiateCheckout", {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        num_items: detail.pieces ?? 1,
        value: min ? min * (detail.pieces ?? 1) : undefined,
        currency: min ? "BDT" : undefined,
      });
    };
    window.addEventListener("open-quote", onOpen);
    return () => window.removeEventListener("open-quote", onOpen);
  }, [done, product, priced]);

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
      className={cn(
        "m-0 mt-auto h-[94dvh] max-h-none w-full max-w-none overflow-hidden rounded-t-[22px] bg-white p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[3px] open:animate-sheet",
        "sm:m-auto sm:h-[min(800px,92dvh)] sm:w-[min(1020px,94vw)] sm:rounded-2xl sm:open:animate-fade-up",
      )}
      aria-label={`Order ${product.name}`}
    >
      {open && (
        <QuoteForm key={session} product={product} colors={colors} priced={priced} phone={phone} preset={preset} onClose={() => setOpen(false)} onDone={() => setDone(true)} />
      )}
    </dialog>
  );
}

function QuoteForm({ product, colors, priced, phone, preset, onClose, onDone }: {
  product: QuoteProduct;
  colors: (PickerColor & { photo: string })[];
  priced: PricedProduct;
  phone: string;
  preset: QuotePreset;
  onClose: () => void;
  onDone: () => void;
}) {
  // price per piece, tile size and photo follow the variation picked on the page
  const variation = useVariation(product.id, priced);
  const q = quoteFor(priced, variation?.id ?? "");
  const unit = q.unitPrice;
  const hasChoices = choiceAttributes(priced).length > 0;
  /** sqft one piece covers (0 = unknown) */
  const sqft = q.pieceArea;
  const [state, action, pending] = useActionState<InquiryState, FormData>(async (prev, fd) => {
    // the server sends the same Lead through the Conversions API with this id (de-duplication)
    const eventId = newEventId();
    fd.set("fbEventId", eventId);
    const r = await submitInquiry(prev, fd);
    if (r.ok) {
      const count = Number(fd.get("pieces")) || 0;
      trackEvent(
        "Lead",
        {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          num_items: count,
          value: unit ? unit * count : undefined,
          currency: unit ? "BDT" : undefined,
          color: colors.find((c) => c.id === variation?.colorId)?.name,
          content_category: q.label || undefined,
        },
        { id: eventId, relay: false },
      );
      onDone();
    }
    return r;
  }, {});
  const color = colors.find((c) => c.id === variation?.colorId);

  const [mode, setMode] = useState<"pieces" | "room">(preset.area && !preset.pieces ? "room" : "pieces");
  const [piecesInput, setPiecesInput] = useState(preset.pieces ?? 100);
  const [length, setLength] = useState(12);
  const [width, setWidth] = useState(10);
  const [measure, setMeasure] = useState<"ft" | "m">("ft");
  const [wastage, setWastage] = useState(2);
  // controlled, so nothing typed is lost when the server asks to fix a field
  const [contact, setContact] = useState({ name: "", phone: "", email: "", location: "", message: "" });
  // an error disappears as soon as the customer edits that field
  const [edited, setEdited] = useState<{ of: InquiryState; keys: string[] }>({ of: {}, keys: [] });
  const set = (k: keyof typeof contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContact((c) => ({ ...c, [k]: e.target.value }));
    setEdited((d) => (d.of === state ? { of: state, keys: [...d.keys, k] } : { of: state, keys: [k] }));
  };

  const roomSqft = length * width * (measure === "m" ? SQFT_PER_SQM : 1);
  const roomPieces = sqft > 0 ? Math.ceil((roomSqft * (1 + wastage / 100)) / sqft) : 0;
  const pieces = mode === "room" ? roomPieces : piecesInput;
  const area = mode === "room" ? roomSqft : (preset.area ?? pieces * sqft);
  const total = pieces * unit;
  const photo = variation?.images[0] || color?.photo || product.image;
  const err = Object.fromEntries(Object.entries(state.errors ?? {}).filter(([k]) => !(edited.of === state && edited.keys.includes(k))));
  const showFormError = !!state.message && !state.ok && Object.keys(err).length > 0;

  // progress shown at the top of the form
  const steps = [
    ...(hasChoices ? [{ id: "q-options", label: "Options", done: !!variation }] : []),
    { id: "q-qty", label: "Quantity", done: pieces > 0 },
    { id: "q-details", label: "Your details", done: contact.name.trim().length > 1 && contact.phone.replace(/\D/g, "").length >= 6 },
  ];
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (state.ok) return <Success state={state} product={product} color={color} photo={photo} pieces={pieces} unit={unit} total={total} lines={q.lines} phone={phone} onClose={onClose} />;

  const input =
    "w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-[15px] text-ink transition placeholder:text-neutral-400 focus:border-navy focus:ring-4 focus:ring-navy/10 focus:outline-none aria-invalid:border-red-500 aria-invalid:ring-red-500/10 sm:py-2.5 sm:text-sm";
  const heading = (i: number, title: string, aside?: React.ReactNode) => (
    <div className="mb-4 flex items-center gap-3">
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold", steps[i - 1]?.done ? "bg-leaf text-white" : "bg-navy text-white")}>
        {steps[i - 1]?.done ? <Check className="size-4" strokeWidth={3} /> : i}
      </span>
      <h3 className="flex-1 text-[14px] font-semibold text-ink">{title}</h3>
      {aside}
    </div>
  );

  return (
    <form action={action} noValidate className="grid h-full grid-rows-[minmax(0,1fr)] md:grid-cols-[360px_1fr]">
      <input type="hidden" name="kind" value="quote" />
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="variationId" value={variation?.id ?? ""} />
      <input type="hidden" name="pieces" value={pieces} />
      <input type="hidden" name="area" value={area.toFixed(1)} />
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* order summary (larger screens) */}
      <aside className="relative hidden flex-col overflow-y-auto bg-mist md:flex">
        <div className="relative aspect-[4/3.4] shrink-0 overflow-hidden">
          {photo ? (
            <Img key={photo} src={photo} alt={product.name} fill sizes="360px" className="animate-fade-up object-cover" />
          ) : (
            color && <TilePreview color={color} className="absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-[10px] tracking-[0.25em] text-white/80 uppercase">{product.code}</p>
            <p className="font-display text-xl leading-tight font-semibold">{product.name}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy/5">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">Order summary</p>
            <dl className="space-y-2 text-[13px]">
              {color && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Colour</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-ink"><Swatch color={color} className="size-4" /> {color.name}</dd>
                </div>
              )}
              {q.lines.filter((l) => !(color && /colou?r/i.test(l.label))).map((l) => (
                <Row key={l.label} label={l.label} value={l.value} />
              ))}
              {unit > 0 && <Row label="Price / piece" value={formatPrice(unit)} />}
              <Row label="Quantity" value={`${n(pieces)} pcs`} />
              {sqft > 0 && <Row label="Covers" value={`≈ ${(pieces * sqft).toFixed(1)} sqft`} />}
            </dl>
            <div className="my-4 border-t border-dashed border-neutral-300" />
            <div className="flex items-end justify-between gap-3">
              <span className="text-[12px] text-muted">Estimated total</span>
              <span key={total} className="animate-fade-up font-display text-2xl leading-none font-semibold text-navy">{unit > 0 ? formatPrice(total) : "On request"}</span>
            </div>
          </div>
          <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted">No payment now. Our sales team confirms the final price, stock and delivery date by phone.</p>

          <ul className="mt-auto space-y-2.5 pt-5 text-[12px] text-ink">
            {[
              [ShieldCheck, "100% genuine products"],
              [PackageCheck, "Ready stock, carefully packed"],
              [Truck, "Delivery anywhere in Bangladesh"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <li key={text as string} className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-full bg-white text-navy ring-1 ring-navy/10"><I className="size-3.5" /></span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <div className="flex min-h-0 flex-col">
        {/* header */}
        <header className="border-b border-neutral-200 px-4 pt-2 pb-3 sm:px-7 sm:pt-5">
          <span aria-hidden className="mx-auto mb-2 block h-1 w-10 rounded-full bg-neutral-300 sm:hidden" />
          <div className="flex items-center gap-3">
            {/* phones: product thumbnail (the summary panel is hidden there) */}
            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-mist ring-1 ring-navy/10 md:hidden">
              {photo ? <Img src={photo} alt="" fill sizes="48px" className="object-cover" /> : color && <TilePreview color={color} className="absolute inset-0" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-[0.22em] text-brand uppercase sm:text-[11px]">Place your order</p>
              <h2 className="truncate font-display text-lg leading-tight font-semibold text-ink sm:text-xl">{product.name}</h2>
              {unit > 0 && <p className="text-[12px] text-muted md:hidden">{formatPrice(unit)} / piece</p>}
            </div>
            <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full bg-mist text-ink transition hover:bg-neutral-200" aria-label="Close">
              <X className="size-4.5" />
            </button>
          </div>

          {/* progress */}
          <ol className="mt-3 flex items-center gap-1.5">
            {steps.map((s, i) => (
              <li key={s.id} className="flex flex-1 items-center gap-1.5">
                <button type="button" onClick={() => go(s.id)} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                  <span className={cn("h-1 rounded-full transition-colors duration-500", s.done ? "bg-leaf" : "bg-neutral-200")} />
                  <span className={cn("truncate text-[10.5px] font-medium", s.done ? "text-ink" : "text-muted")}>
                    {i + 1}. {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </header>

        <div className="flex-1 space-y-8 overflow-y-auto overscroll-contain px-4 py-6 sm:px-7">
          {hasChoices && (
            <section id="q-options" className="scroll-mt-4">
              {heading(1, "Choose your options")}
              <VariationPicker productId={product.id} priced={priced} swatches={colors} size="lg" />
            </section>
          )}

          <section id="q-qty" className="scroll-mt-4">
            {heading(hasChoices ? 2 : 1, "How many pieces?",
              <div className="flex rounded-full bg-mist p-1 text-[11px] ring-1 ring-navy/5">
                {([["pieces", "Pieces", Grid3x3], ["room", "Room size", Ruler]] as const).map(([m, l, Icon]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition", mode === m ? "bg-white text-navy shadow-sm" : "text-muted hover:text-ink")}
                  >
                    <Icon className="size-3.5" /> {l}
                  </button>
                ))}
              </div>,
            )}

            {mode === "pieces" ? (
              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center overflow-hidden rounded-xl border border-neutral-300">
                    <button type="button" onClick={() => setPiecesInput((b) => Math.max(1, b - 10))} className="grid size-12 place-items-center text-ink transition hover:bg-mist active:bg-neutral-200" aria-label="10 fewer pieces">
                      <Minus className="size-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={piecesInput || ""}
                      onChange={(e) => setPiecesInput(Math.max(0, Math.round(Number(e.target.value))))}
                      aria-invalid={!!err.pieces}
                      className="h-12 w-20 border-x border-neutral-300 text-center text-xl font-semibold text-ink focus:outline-none"
                      aria-label="Number of pieces"
                    />
                    <button type="button" onClick={() => setPiecesInput((b) => b + 10)} className="grid size-12 place-items-center text-ink transition hover:bg-mist active:bg-neutral-200" aria-label="10 more pieces">
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <div className="min-w-0 text-[12px] leading-snug text-muted">
                    <p>pieces</p>
                    {sqft > 0 && <p>≈ <b className="text-ink">{(pieces * sqft).toFixed(1)}</b> sqft</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_PIECES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPiecesInput(v)}
                      className={cn("rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition", piecesInput === v ? "border-navy bg-navy text-white" : "border-neutral-300 text-ink hover:border-navy")}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {unit > 0 && (
                  <p className="mt-3 flex items-center justify-between rounded-xl bg-mist px-3.5 py-2.5 text-[13px] text-ink">
                    <span>{n(pieces)} × {formatPrice(unit)}</span>
                    <b className="text-navy">{formatPrice(total)}</b>
                  </p>
                )}
                {sqft > 0 && (
                  <button type="button" onClick={() => setMode("room")} className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-brand hover:underline">
                    <Calculator className="size-3.5" /> Not sure? Work it out from your room size
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="mb-3 flex justify-end">
                  <div className="flex rounded-lg border border-neutral-300 text-[11px]">
                    {(["ft", "m"] as const).map((u) => (
                      <button key={u} type="button" onClick={() => setMeasure(u)} className={cn("px-3 py-1 transition first:rounded-l-lg last:rounded-r-lg", measure === u ? "bg-navy text-white" : "text-ink")}>
                        {u === "ft" ? "Feet" : "Metres"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <NumField label={`Length (${measure})`} value={length} onChange={setLength} />
                  <NumField label={`Width (${measure})`} value={width} onChange={setWidth} />
                  <NumField label="Wastage %" value={wastage} onChange={setWastage} step={1} />
                </div>
                {sqft > 0 ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-navy px-4 py-3 text-white">
                    <span className="text-[12px] text-white/75">{roomSqft.toFixed(1)} sqft + {wastage}%</span>
                    <span className="text-right">
                      <b className="font-display text-xl">{n(roomPieces)}</b> <span className="text-[12px]">pieces</span>
                      {unit > 0 && <span className="block text-[11px] text-white/75">≈ {formatPrice(total)}</span>}
                    </span>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-mist px-3.5 py-2.5 text-[12px] text-muted">Tile size isn&apos;t set for this design — please enter pieces instead.</p>
                )}
              </div>
            )}
            {err.pieces && <p className="mt-1.5 text-[12px] text-red-600">{err.pieces}</p>}
          </section>

          <section id="q-details" className="scroll-mt-4">
            {heading(hasChoices ? 3 : 2, "Your details")}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Full name" required error={err.name} icon={User}>
                <input name="name" value={contact.name} onChange={set("name")} autoComplete="name" placeholder="Your name" aria-invalid={!!err.name} className={cn(input, "pl-10")} />
              </Field>
              <Field label="Mobile number" required error={err.phone} icon={Phone}>
                <input name="phone" value={contact.phone} onChange={set("phone")} type="tel" autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX" aria-invalid={!!err.phone} className={cn(input, "pl-10")} />
              </Field>
              <Field label="Delivery area" icon={MapPin}>
                <input name="location" value={contact.location} onChange={set("location")} autoComplete="address-level2" placeholder="e.g. Mirpur, Dhaka" className={cn(input, "pl-10")} />
              </Field>
              <Field label="Email" hint="optional" error={err.email} icon={Mail}>
                <input name="email" value={contact.email} onChange={set("email")} type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!err.email} className={cn(input, "pl-10")} />
              </Field>
              <Field label="Note for our team" hint="optional" error={err.message} icon={MessageSquareText} full>
                <textarea name="message" value={contact.message} onChange={set("message")} rows={2} placeholder="Delivery date, project type, other sizes…" className={cn(input, "resize-none pl-10")} />
              </Field>
            </div>
          </section>
        </div>

        {/* sticky footer: total + send */}
        <footer className="border-t border-neutral-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] sm:px-7 sm:py-4">
          {showFormError && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{state.message}</p>}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 md:hidden">
              <p className="text-[11px] text-muted">{n(pieces)} pcs{color && ` · ${color.name}`}</p>
              <p className="truncate font-display text-lg leading-tight font-semibold text-navy">{unit > 0 ? formatPrice(total) : "Price on request"}</p>
            </div>
            <button
              disabled={pending}
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3.5 text-[13px] font-semibold tracking-wide text-white shadow-lg shadow-navy/25 transition hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60 md:w-full"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Sending…" : "Confirm order request"}
              {!pending && <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />}
            </button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-x-3 text-[11px] text-muted">
            <span className="flex items-center gap-1"><ShieldCheck className="size-3.5 text-leaf" /> No payment now</span>
            <span className="flex items-center gap-1"><PhoneCall className="size-3.5 text-leaf" /> We call to confirm</span>
          </p>
        </footer>
      </div>
    </form>
  );
}

/** Thank-you screen with the order reference and what happens next. */
function Success({ state, product, color, photo, pieces, unit, total, lines, phone, onClose }: {
  state: InquiryState;
  product: QuoteProduct;
  color?: PickerColor & { photo: string };
  photo: string;
  pieces: number;
  unit: number;
  total: number;
  lines: { label: string; value: string }[];
  phone: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const options = lines.map((l) => l.value).join(", ");
  const wa = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi, I just placed an order request (${state.reference}) for ${product.name}${options ? ` — ${options}` : ""} — ${n(pieces)} pieces.`,
  )}`;
  const copy = () => {
    if (!state.reference) return;
    navigator.clipboard?.writeText(state.reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  };

  return (
    <div className="relative h-full overflow-y-auto">
      <button type="button" onClick={onClose} className="absolute top-4 right-4 z-[1] grid size-9 place-items-center rounded-full bg-mist text-ink transition hover:bg-neutral-200" aria-label="Close">
        <X className="size-4.5" />
      </button>
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
        <span className="relative grid size-20 place-items-center">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-leaf/25 [animation-iteration-count:2]" />
          <span className="animate-pop relative grid size-20 place-items-center rounded-full bg-leaf text-white shadow-lg shadow-leaf/40">
            <CircleCheck className="size-10" strokeWidth={1.8} />
          </span>
        </span>
        <h2 className="mt-6 font-display text-2xl font-semibold text-ink sm:text-[28px]">Thank you! Order received</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{state.message}</p>

        {state.reference && (
          <button type="button" onClick={copy} className="mt-5 flex items-center gap-3 rounded-xl border-2 border-dashed border-navy/25 bg-mist px-5 py-3 transition hover:border-navy/50" aria-label="Copy order reference">
            <span className="text-left">
              <span className="block text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">Order reference</span>
              <span className="block font-mono text-xl font-bold tracking-wider text-navy">{state.reference}</span>
            </span>
            <span className={cn("grid size-8 place-items-center rounded-lg transition", copied ? "bg-leaf text-white" : "bg-white text-ink")}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </span>
          </button>
        )}

        {/* the order */}
        <div className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-neutral-200">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-mist">
            {photo ? <Img src={photo} alt="" fill sizes="56px" className="object-cover" /> : color ? <Swatch color={color} className="absolute inset-0" round={false} /> : <Grid3x3 className="m-auto mt-4 size-6 text-muted" />}
          </span>
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="truncate font-semibold text-ink">{product.name}</p>
            <p className="truncate text-muted">{options || "Standard"}</p>
            <p className="text-muted">{n(pieces)} pieces</p>
          </div>
          {unit > 0 && <p className="shrink-0 font-display text-base font-semibold text-navy">{formatPrice(total)}</p>}
        </div>

        {/* what happens next */}
        <ol className="mt-6 w-full space-y-0 text-left">
          {[
            ["We call you", "A sales advisor calls to confirm the design and quantity."],
            ["Final price & delivery date", "You get the confirmed price, stock and delivery schedule."],
            ["Delivered to your site", "Carefully packed and delivered anywhere in Bangladesh."],
          ].map(([title, text], i, all) => (
            <li key={title} className="relative flex gap-3 pb-4 last:pb-0">
              {i < all.length - 1 && <span aria-hidden className="absolute top-7 bottom-0 left-[13px] w-px bg-neutral-200" />}
              <span className={cn("relative grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold", i === 0 ? "bg-navy text-white" : "bg-mist text-navy ring-1 ring-navy/10")}>{i + 1}</span>
              <span className="pt-0.5">
                <span className="block text-[13px] font-semibold text-ink">{title}</span>
                <span className="block text-[12px] leading-snug text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-7 grid w-full grid-cols-2 gap-2.5">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-[13px] font-semibold text-white shadow-md shadow-[#25D366]/30 transition active:scale-[0.98]">
            <WhatsAppIcon /> WhatsApp
          </a>
          <button type="button" onClick={onClose} className="rounded-xl border border-ink px-4 py-3.5 text-[13px] font-semibold text-ink transition hover:bg-ink hover:text-white active:scale-[0.98]">
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4.5 fill-current">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zm8.3-18.1C18.1 1.5 15.1.3 12 .3 5.5.3.3 5.5.3 12c0 2.1.5 4.1 1.6 5.9L.2 23.7l6-1.6c1.7.9 3.7 1.4 5.7 1.4 6.5 0 11.7-5.3 11.7-11.7 0-3.1-1.2-6.1-3.3-8.1z" />
    </svg>
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

function Field({ label, hint, required, error, full, icon: Icon, children }: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  full?: boolean;
  icon?: typeof User;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1.5 flex items-center gap-1 text-[12px] font-medium text-ink">
        {label}
        {required && <span className="text-brand">*</span>}
        {hint && <span className="font-normal text-muted">({hint})</span>}
      </span>
      <span className="relative block">
        {Icon && <Icon className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted sm:top-3" />}
        {children}
      </span>
      {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
    </label>
  );
}

function NumField({ label, value, onChange, step = 0.5 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate text-[10.5px] font-medium tracking-wide text-muted uppercase">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        inputMode="decimal"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full min-w-0 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-base text-ink focus:border-navy focus:ring-4 focus:ring-navy/10 focus:outline-none sm:text-sm"
      />
    </label>
  );
}
