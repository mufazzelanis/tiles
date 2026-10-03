"use client";

import { useActionState } from "react";
import { CircleCheck, Loader2, Send } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/actions";
import { cn } from "@/lib/utils";

export function InquiryForm({
  productId = "",
  defaultSubject = "",
  defaultMessage = "",
  compact = false,
}: {
  productId?: string;
  defaultSubject?: string;
  defaultMessage?: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, {});

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 border border-leaf/40 bg-leaf/10 p-5 text-sm text-ink">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-leaf" />
        <p>{state.message}</p>
      </div>
    );
  }

  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink">{label}</span>
      <input
        name={name}
        aria-invalid={!!state.errors?.[name]}
        className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none aria-invalid:border-red-500"
        {...props}
      />
      {state.errors?.[name] && <span className="mt-1 block text-[12px] text-red-600">{state.errors[name]}</span>}
    </label>
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        {field("name", "Full name *", { autoComplete: "name" })}
        {field("phone", "Phone", { type: "tel", autoComplete: "tel" })}
      </div>
      {field("email", "Email *", { type: "email", autoComplete: "email" })}
      {field("subject", "Subject", { defaultValue: defaultSubject })}
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-ink">Message *</span>
        <textarea
          name="message"
          defaultValue={defaultMessage}
          rows={compact ? 3 : 5}
          aria-invalid={!!state.errors?.message}
          className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none aria-invalid:border-red-500"
        />
        {state.errors?.message && <span className="mt-1 block text-[12px] text-red-600">{state.errors.message}</span>}
      </label>
      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 bg-navy px-6 py-3 text-[12px] tracking-wider text-white uppercase transition hover:bg-navy-deep disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
