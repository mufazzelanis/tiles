"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { mutate } from "@/lib/db";
import { contextFrom, sendServerEvent } from "@/lib/tracking";
import { getSiteLayout } from "@/lib/queries";
import { newId } from "@/lib/utils";

export interface InquiryState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** short order reference shown to the customer after a quote request */
  reference?: string;
}

/**
 * Public contact form, product inquiry form and the "Request a quote" order popup.
 * `kind=quote` is an order request: phone is required, email and message are optional.
 */
export async function submitInquiry(_: InquiryState, formData: FormData): Promise<InquiryState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => Math.max(0, Number(get(k)) || 0);
  // Honeypot: real users never fill this hidden field
  if (get("company_website")) return { ok: true, message: "Thank you!" };

  const quote = get("kind") === "quote";
  const data = {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    subject: get("subject") || (quote ? "Quote request" : "General inquiry"),
    message: get("message"),
    productId: get("productId"),
    boxes: Math.min(1_000_000, Math.round(num("boxes"))),
    area: Math.min(10_000_000, Math.round(num("area") * 10) / 10),
    location: get("location").slice(0, 200),
  };

  const errors: Record<string, string> = {};
  const extra: { label: string; value: string }[] = [];
  let successMessage = "Thank you! Our team will contact you within one working day.";
  if (data.name.length < 2) errors.name = "Please enter your name";
  if (quote) {
    if (data.phone.replace(/\D/g, "").length < 6) errors.phone = "Please enter a phone number we can call";
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) errors.email = "Please enter a valid email";
    if (!data.boxes) errors.boxes = "How many boxes do you need?";
  } else {
    // the contact form is built in Admin → Header & Footer → Contact form
    const form = (await getSiteLayout()).contactForm;
    successMessage = form.successMessage || successMessage;
    const builtIn = data as unknown as Record<string, string>;
    for (const f of form.fields) {
      if (!f.enabled) {
        if (f.builtIn && f.key in builtIn && f.key !== "name") builtIn[f.key] = "";
        continue;
      }
      const value = f.builtIn ? (f.key === "colorId" ? get("colorId") : String(builtIn[f.key] ?? "")) : formData.getAll(f.key).map((v) => String(v).trim()).filter(Boolean).join(", ").slice(0, 1000);
      if (!value) {
        if (f.required && !errors[f.key]) errors[f.key] = `${f.label} is required`;
        continue;
      }
      if (f.type === "email" && !/^\S+@\S+\.\S+$/.test(value)) errors[f.key] = "Please enter a valid email";
      else if (f.type === "tel" && value.replace(/\D/g, "").length < 6) errors[f.key] = "Please enter a valid phone number";
      else if (f.type === "number" && !Number.isFinite(Number(value))) errors[f.key] = "Please enter a number";
      else if ((f.type === "select" || f.type === "radio") && f.options.length && !f.options.includes(value)) errors[f.key] = "Please choose an option";
      else if (!f.builtIn) extra.push({ label: f.label, value });
    }
    if (!data.email && !data.phone && !errors.email && !errors.phone) {
      const contact = form.fields.find((f) => f.enabled && (f.key === "phone" || f.key === "email"));
      if (contact) errors[contact.key] = "Please leave a phone number or email so we can reply";
    }
    if (!form.fields.some((f) => f.key === "colorId" && f.enabled)) formData.delete("colorId");
  }
  if (data.message.length > 3000) errors.message = "Message is too long";
  if (Object.keys(errors).length) return { errors, message: "Please check the highlighted fields." };

  const { reference, product, color } = await mutate((db) => {
    const now = new Date().toISOString();
    const product = db.products.find((p) => p.id === data.productId && p.active);
    // snapshot the chosen colour so the inquiry still reads correctly if the colour is renamed or deleted later
    const color = db.colors.find((c) => c.id === get("colorId") && c.active);
    const id = newId();
    const subject = quote && product
      ? `Quote: ${product.name}${color ? ` — ${color.name}` : ""} × ${data.boxes} box${data.boxes === 1 ? "" : "es"}`
      : data.subject;
    db.inquiries.unshift({
      id,
      ...data,
      subject,
      productId: product?.id ?? "",
      extra,
      colorId: color?.id ?? "",
      colorName: color?.name ?? "",
      colorHex: color?.hex ?? "",
      status: "new",
      notes: "",
      createdAt: now,
      updatedAt: now,
    });
    return { reference: `Q-${id.slice(-6).toUpperCase()}`, product, color };
  });

  // Conversions API: same event_id as the browser Pixel, plus hashed contact details for matching
  const ctx = contextFrom(await headers(), await cookies());
  after(() =>
    sendServerEvent(
      {
        name: quote ? "Lead" : "Contact",
        id: get("fbEventId").slice(0, 64),
        customer: { email: data.email, phone: data.phone, name: data.name, city: data.location },
        customData: {
          ...(product ? { content_ids: [product.id], content_name: product.name, content_type: "product" } : {}),
          ...(quote ? { num_items: data.boxes } : { method: "form" }),
          ...(quote && product?.price ? { value: product.price * data.boxes, currency: "BDT" } : {}),
          ...(color ? { color: color.name } : {}),
        },
      },
      ctx,
    ),
  );
  revalidatePath("/admin", "layout");
  return quote
    ? { ok: true, reference, message: "Your request is in! Our sales team will call you to confirm price and delivery — usually within a few working hours." }
    : { ok: true, message: successMessage };
}
