"use client";

import { useActionState } from "react";
import { CircleCheck, Loader2, Send } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/actions";
import { cn } from "@/lib/utils";
import { newEventId, trackEvent } from "@/lib/meta-pixel";
import { Swatch } from "@/components/Swatch";
import type { SwatchColor } from "@/lib/colors";
import { defaultLayout, type ContactFormConfig, type FormField } from "@/lib/site-layout";

const inputCls = "w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none aria-invalid:border-red-500";

/** Contact form whose fields, labels and messages come from Admin → Header & Footer → Contact form. */
export function InquiryForm({
  config = defaultLayout().contactForm,
  productId = "",
  defaults = {},
  compact = false,
  colors = [],
}: {
  config?: ContactFormConfig;
  productId?: string;
  /** prefilled values by field key (e.g. subject from the URL) */
  defaults?: Record<string, string>;
  compact?: boolean;
  colors?: SwatchColor[];
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(async (prev, fd) => {
    // the server sends the same event through the Conversions API with this id (de-duplication)
    const eventId = newEventId();
    fd.set("fbEventId", eventId);
    const r = await submitInquiry(prev, fd);
    if (r.ok) trackEvent("Contact", { content_ids: productId ? [productId] : undefined, method: "form" }, { id: eventId, relay: false });
    return r;
  }, {});

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 border border-leaf/40 bg-leaf/10 p-5 text-sm text-ink">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-leaf" />
        <p>{state.message}</p>
      </div>
    );
  }

  const fields = config.fields.filter((f) => f.enabled && (f.type !== "color" || colors.length > 0));

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="productId" value={productId} />
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {config.intro && <p className="text-[13px] text-muted">{config.intro}</p>}
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        {fields.map((f) => (
          <div key={f.id} className={cn(f.width === "full" || compact ? "sm:col-span-2" : "")}>
            <FieldControl field={f} error={state.errors?.[f.key]} colors={colors} defaultValue={defaults[f.key] ?? ""} />
          </div>
        ))}
      </div>
      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 bg-navy px-6 py-3 text-[12px] tracking-wider text-white uppercase transition hover:bg-navy-deep disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {pending ? "Sending…" : config.submitLabel || "Send inquiry"}
      </button>
    </form>
  );
}

function FieldControl({ field: f, error, colors, defaultValue }: { field: FormField; error?: string; colors: SwatchColor[]; defaultValue: string }) {
  const label = (
    <>
      {f.label}
      {f.required ? " *" : f.type === "color" ? <span className="font-normal text-muted"> (optional)</span> : null}
    </>
  );
  const common = { name: f.key, "aria-invalid": !!error, placeholder: f.placeholder || undefined, defaultValue, className: inputCls };
  const auto: Partial<Record<string, string>> = { name: "name", email: "email", phone: "tel" };

  let control: React.ReactNode;
  switch (f.type) {
    case "textarea":
      control = <textarea {...common} rows={5} />;
      break;
    case "select":
      control = (
        <select {...common}>
          <option value="">{f.placeholder || "Choose…"}</option>
          {f.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
      break;
    case "radio":
    case "checkbox":
      return (
        <fieldset>
          <legend className="mb-1.5 block text-[12px] font-medium text-ink">{label}</legend>
          <div className="flex flex-wrap gap-2">
            {f.options.map((o) => (
              <label key={o} className="cursor-pointer">
                <input type={f.type} name={f.key} value={o} defaultChecked={defaultValue === o} className="peer sr-only" />
                <span className="inline-block border border-neutral-300 bg-white px-3 py-1.5 text-[13px] text-ink transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 hover:border-neutral-500">
                  {o}
                </span>
              </label>
            ))}
          </div>
          <Note help={f.help} error={error} />
        </fieldset>
      );
    case "color":
      return (
        <fieldset>
          <legend className="mb-1.5 block text-[12px] font-medium text-ink">{label}</legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <label key={c.id} className="cursor-pointer" title={c.name}>
                <input type="radio" name="colorId" value={c.id} defaultChecked={c.id === defaultValue || c.slug === defaultValue} className="peer sr-only" />
                <span className="flex items-center gap-1.5 border border-neutral-300 bg-white py-1 pr-2.5 pl-1 text-[12px] text-ink transition peer-checked:border-ink peer-checked:ring-1 peer-checked:ring-ink peer-focus-visible:ring-2 hover:border-neutral-500">
                  <Swatch color={c} className="size-5" /> {c.name}
                </span>
              </label>
            ))}
            {!f.required && (
              <label className="cursor-pointer">
                <input type="radio" name="colorId" value="" defaultChecked={!defaultValue} className="peer sr-only" />
                <span className="flex h-full items-center border border-dashed border-neutral-300 px-2.5 py-1 text-[12px] text-muted transition peer-checked:border-ink peer-checked:text-ink">Not sure yet</span>
              </label>
            )}
          </div>
          <Note help={f.help} error={error} />
        </fieldset>
      );
    default:
      control = <input {...common} type={f.type} autoComplete={auto[f.key]} inputMode={f.type === "tel" ? "tel" : undefined} />;
  }

  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink">{label}</span>
      {control}
      <Note help={f.help} error={error} />
    </label>
  );
}

function Note({ help, error }: { help: string; error?: string }) {
  if (error) return <span className="mt-1 block text-[12px] text-red-600">{error}</span>;
  return help ? <span className="mt-1 block text-[11px] text-muted">{help}</span> : null;
}
