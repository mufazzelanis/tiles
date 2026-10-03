"use server";

import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/db";
import { newId } from "@/lib/utils";

export interface InquiryState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
}

/** Public contact / product inquiry form. */
export async function submitInquiry(_: InquiryState, formData: FormData): Promise<InquiryState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  // Honeypot: real users never fill this hidden field
  if (get("company_website")) return { ok: true, message: "Thank you!" };

  const data = {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    subject: get("subject") || "General inquiry",
    message: get("message"),
    productId: get("productId"),
  };
  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = "Please enter your name";
  if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.email = "Please enter a valid email";
  if (data.message.length < 10) errors.message = "Message should be at least 10 characters";
  if (data.message.length > 3000) errors.message = "Message is too long";
  if (Object.keys(errors).length) return { errors };

  await mutate((db) => {
    const now = new Date().toISOString();
    db.inquiries.unshift({ id: newId(), ...data, status: "new", notes: "", createdAt: now, updatedAt: now });
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Thank you! Our team will contact you within one working day." };
}
