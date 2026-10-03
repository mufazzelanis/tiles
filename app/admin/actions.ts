"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomInt } from "node:crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DATA_DIR, getDb, mutate } from "@/lib/db";
import { checkPermission, requirePermission, requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { encodeSession, SESSION_COOKIE, SESSION_TTL } from "@/lib/session";
import { getResource, type FieldDef, type ResourceKey } from "@/lib/resources";
import { ALL_PERMISSIONS, can, OWNER_ROLE_ID, passwordProblems, ROLE_COLORS } from "@/lib/permissions";
import { newId, slugify } from "@/lib/utils";
import type { Database, InquiryStatus, Settings, User, UserStatus } from "@/lib/types";

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** one-time secret to show the admin (e.g. a generated password) */
  secret?: string;
  id?: string;
}

type Row = Record<string, unknown> & { id: string };

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const DENIED: FormState = { message: "You don't have permission to do that." };

function refreshSite() {
  revalidatePath("/", "layout");
}

function log(db: Database, who: string, action: string, target: string) {
  db.activity.unshift({ id: newId(), userName: who, action, target, at: new Date().toISOString() });
  db.activity = db.activity.slice(0, 200);
}

function rows(db: Database, key: ResourceKey) {
  return db[key] as unknown as Row[];
}

async function setSessionCookie(user: Pick<User, "id" | "sessionVersion">, remember = false) {
  const ttl = remember ? SESSION_TTL * 4 : SESSION_TTL;
  (await cookies()).set(SESSION_COOKIE, encodeSession({ uid: user.id, sv: user.sessionVersion ?? 0, exp: Math.floor(Date.now() / 1000) + ttl }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttl,
  });
}

/** Readable temporary password, e.g. "Tile-7342-Hub". */
function generatePassword() {
  const words = ["Tile", "Stone", "Hub", "Urban", "Marble", "Floor", "Gloss", "Brick", "Slate", "Oak"];
  const w = () => words[randomInt(words.length)];
  return `${w()}-${randomInt(1000, 9999)}-${w()}${"!@#$%"[randomInt(5)]}`;
}

/* ------------------------------------------------------------------ auth */

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  if (!email || !password) return { message: "Email and password are required." };

  const ua = (await headers()).get("user-agent") ?? "";
  const device = /mobile/i.test(ua) ? "mobile" : "desktop";
  const db = await getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email);

  if (user?.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    const mins = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
    return { message: `Too many failed attempts. Try again in ${mins} minute${mins > 1 ? "s" : ""}.` };
  }

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    if (user) {
      const locked = await mutate((d) => {
        const u = d.users.find((x) => x.id === user.id)!;
        u.failedAttempts = (u.failedAttempts ?? 0) + 1;
        const lock = u.failedAttempts >= MAX_ATTEMPTS;
        if (lock) {
          u.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
          u.failedAttempts = 0;
          log(d, u.name, "was locked out after", `${MAX_ATTEMPTS} failed sign-ins`);
        }
        return lock;
      });
      if (locked) return { message: `Too many failed attempts. Your account is locked for ${LOCK_MINUTES} minutes.` };
      const left = MAX_ATTEMPTS - ((user.failedAttempts ?? 0) + 1);
      return { message: `Invalid email or password.${left <= 2 ? ` ${left} attempt${left === 1 ? "" : "s"} left before lock-out.` : ""}` };
    }
    return { message: "Invalid email or password." };
  }

  if (user.status !== "active") return { message: "This account has been suspended. Contact your administrator." };
  if (!db.roles.some((r) => r.id === user.roleId)) return { message: "Your role no longer exists. Contact your administrator." };

  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id)!;
    u.lastLoginAt = new Date().toISOString();
    u.loginCount = (u.loginCount ?? 0) + 1;
    u.failedAttempts = 0;
    u.lockedUntil = "";
    log(d, u.name, "signed in", `on ${device}`);
  });
  await setSessionCookie(user, remember);
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ------------------------------------------------------- generic content */

function readField(f: FieldDef, formData: FormData): unknown {
  switch (f.type) {
    case "number": {
      const n = Number(formData.get(f.name) ?? 0);
      return Number.isFinite(n) ? n : 0;
    }
    case "boolean":
      return formData.get(f.name) === "on";
    case "multiselect":
    case "images":
      return formData.getAll(f.name).map(String).filter(Boolean);
    case "date": {
      const v = String(formData.get(f.name) ?? "");
      return v ? new Date(v).toISOString() : new Date().toISOString();
    }
    default:
      return String(formData.get(f.name) ?? "").trim();
  }
}

export async function saveResource(_: FormState, formData: FormData): Promise<FormState> {
  const def = getResource(String(formData.get("__resource") ?? ""));
  if (!def) return { message: "Unknown content type." };
  const key = def.key;
  const id = String(formData.get("__id") ?? "") || null;
  const { user, allowed } = await checkPermission(key, id ? "edit" : "create");
  if (!allowed) return DENIED;

  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const f of def.fields) {
    const value = readField(f, formData);
    data[f.name] = value;
    const empty = value === "" || (Array.isArray(value) && value.length === 0);
    if (f.required && empty) errors[f.name] = `${f.label} is required`;
  }
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  const savedId = await mutate((db) => {
    const list = rows(db, key);
    const slugField = def.fields.find((f) => f.type === "slug");
    if (slugField) {
      const base = slugify(String(data.slug || data[slugField.from ?? def.titleField] || "item")) || "item";
      let slug = base;
      let n = 2;
      while (list.some((r) => r.slug === slug && r.id !== id)) slug = `${base}-${n++}`;
      data.slug = slug;
    }
    const now = new Date().toISOString();
    if (id) {
      const row = list.find((r) => r.id === id);
      if (!row) throw new Error("Not found");
      Object.assign(row, data, { updatedAt: now });
      log(db, user.name, "updated", `${def.singular}: ${data[def.titleField]}`);
      return id;
    }
    const row: Row = { id: newId(), ...data, createdAt: now, updatedAt: now };
    if (key === "products") row.views = 0;
    list.unshift(row);
    log(db, user.name, "created", `${def.singular}: ${data[def.titleField]}`);
    return row.id;
  });

  refreshSite();
  redirect(`/admin/${key}?saved=${id ? "updated" : "created"}&id=${savedId}`);
}

export async function deleteResources(key: ResourceKey, ids: string[]) {
  const user = await requirePermission(key, "delete");
  const def = getResource(key);
  if (!def || !ids.length) return;
  await mutate((db) => {
    (db[key] as unknown as Row[]) = rows(db, key).filter((r) => !ids.includes(r.id));
    log(db, user.name, "deleted", `${ids.length} ${def.label.toLowerCase()}`);
  });
  refreshSite();
}

export async function setPublished(key: ResourceKey, ids: string[], active: boolean) {
  const user = await requirePermission(key, "edit");
  const def = getResource(key);
  if (!def) return;
  await mutate((db) => {
    for (const r of rows(db, key)) if (ids.includes(r.id)) r.active = active;
    log(db, user.name, active ? "published" : "unpublished", `${ids.length} ${def.label.toLowerCase()}`);
  });
  refreshSite();
}

export async function toggleField(key: ResourceKey, id: string, field: string) {
  await requirePermission(key, "edit");
  const def = getResource(key);
  if (!def?.fields.some((f) => f.name === field && f.type === "boolean")) return;
  await mutate((db) => {
    const row = rows(db, key).find((r) => r.id === id);
    if (row) row[field] = !row[field];
  });
  refreshSite();
}

export async function duplicateResource(key: ResourceKey, id: string) {
  const user = await requirePermission(key, "create");
  const def = getResource(key);
  if (!def) return;
  await mutate((db) => {
    const list = rows(db, key);
    const src = list.find((r) => r.id === id);
    if (!src) return;
    const now = new Date().toISOString();
    const copy: Row = { ...structuredClone(src), id: newId(), active: false, createdAt: now, updatedAt: now };
    copy[def.titleField] = `${src[def.titleField]} (copy)`;
    if ("slug" in copy) copy.slug = `${src.slug}-copy-${copy.id.slice(-4)}`;
    if ("views" in copy) copy.views = 0;
    list.unshift(copy);
    log(db, user.name, "duplicated", `${def.singular}: ${src[def.titleField]}`);
  });
  refreshSite();
}

/** Persist a drag-and-drop order for collections that have an `order` field. */
export async function reorderResource(key: ResourceKey, ids: string[]) {
  const user = await requirePermission(key, "edit");
  const def = getResource(key);
  if (!def?.fields.some((f) => f.name === "order")) return;
  await mutate((db) => {
    const list = rows(db, key);
    ids.forEach((id, i) => {
      const row = list.find((r) => r.id === id);
      if (row) row.order = i + 1;
    });
    log(db, user.name, "reordered", def.label);
  });
  refreshSite();
}

/* -------------------------------------------------------------- inquiries */

export async function updateInquiry(id: string, patch: { status?: InquiryStatus; notes?: string }) {
  const user = await requirePermission("inquiries", "edit");
  await mutate((db) => {
    const inq = db.inquiries.find((i) => i.id === id);
    if (!inq) return;
    if (patch.status) inq.status = patch.status;
    if (patch.notes !== undefined) inq.notes = patch.notes;
    inq.updatedAt = new Date().toISOString();
    log(db, user.name, "updated", `Inquiry from ${inq.name}`);
  });
  revalidatePath("/admin", "layout");
}

export async function deleteInquiries(ids: string[]) {
  const user = await requirePermission("inquiries", "delete");
  await mutate((db) => {
    db.inquiries = db.inquiries.filter((i) => !ids.includes(i.id));
    log(db, user.name, "deleted", `${ids.length} inquiries`);
  });
  revalidatePath("/admin", "layout");
}

/* --------------------------------------------------------------- settings */

export async function saveSettings(_: FormState, formData: FormData): Promise<FormState> {
  const { user, allowed } = await checkPermission("settings", "edit");
  if (!allowed) return DENIED;
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  await mutate((db) => {
    const s = db.settings;
    const keys: (keyof Omit<Settings, "socials">)[] = [
      "siteName", "tagline", "phone", "email", "corporateOffice", "factory", "videoId",
      "homeIntroTitle", "homeIntroText", "whyTitle", "whyText", "aboutText", "seoDescription",
    ];
    for (const k of keys) s[k] = get(k);
    for (const k of Object.keys(s.socials) as (keyof Settings["socials"])[]) s.socials[k] = get(`socials.${k}`);
    log(db, user.name, "updated", "Site settings");
  });
  refreshSite();
  return { ok: true, message: "Settings saved." };
}

/* ------------------------------------------------------------------ users */

const ownerCount = (db: Database, exceptId?: string) =>
  db.users.filter((u) => u.roleId === OWNER_ROLE_ID && u.status === "active" && u.id !== exceptId).length;

/** Create or update a user from the admin drawer. */
export async function saveUser(_: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "") || null;
  const { user: me, allowed } = await checkPermission("users", id ? "edit" : "create");
  if (!allowed) return DENIED;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const roleId = String(formData.get("roleId") ?? "");
  const status = (formData.get("status") === "suspended" ? "suspended" : "active") as UserStatus;
  const mustChange = formData.get("mustChangePassword") === "on";
  let password = String(formData.get("password") ?? "");

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter the person's name";
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email";
  if (!id && !password) password = generatePassword();
  if (password) {
    const problems = passwordProblems(password);
    if (problems.length) errors.password = `Needs ${problems.join(", ")}`;
  }

  const db0 = await getDb();
  const role = db0.roles.find((r) => r.id === roleId);
  if (!role) errors.roleId = "Choose a role";
  else if (role.id === OWNER_ROLE_ID && me.role.id !== OWNER_ROLE_ID) errors.roleId = "Only a Super Admin can grant Super Admin";
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  const result = await mutate((db) => {
    if (db.users.some((u) => u.email.toLowerCase() === email && u.id !== id)) return "exists" as const;
    const now = new Date().toISOString();
    if (id) {
      const u = db.users.find((x) => x.id === id);
      if (!u) return "missing" as const;
      if (u.id === me.id && (status === "suspended" || roleId !== u.roleId)) return "self" as const;
      if (u.roleId === OWNER_ROLE_ID && (roleId !== OWNER_ROLE_ID || status === "suspended") && ownerCount(db, u.id) === 0) return "last-owner" as const;
      if (u.roleId === OWNER_ROLE_ID && me.role.id !== OWNER_ROLE_ID) return "owner-protected" as const;
      const signOut = status === "suspended" || !!password;
      Object.assign(u, { name, email, phone, roleId, status, mustChangePassword: mustChange, updatedAt: now });
      if (password) u.passwordHash = hashPassword(password);
      if (signOut) u.sessionVersion = (u.sessionVersion ?? 0) + 1;
      log(db, me.name, "updated", `User: ${email}`);
      return u.id;
    }
    const u: User = {
      id: newId(), name, email, phone, roleId, status, passwordHash: hashPassword(password),
      sessionVersion: 1, mustChangePassword: mustChange, failedAttempts: 0, lockedUntil: "",
      loginCount: 0, lastLoginAt: "", createdBy: me.name, createdAt: now, updatedAt: now,
    };
    db.users.push(u);
    log(db, me.name, "invited", `${name} as ${role!.name}`);
    return u.id;
  });

  const messages: Record<string, FormState> = {
    exists: { errors: { email: "Another user already uses this email" } },
    missing: { message: "That user no longer exists." },
    self: { message: "You can't suspend yourself or change your own role." },
    "last-owner": { message: "There must always be at least one active Super Admin." },
    "owner-protected": { message: "Only a Super Admin can change another Super Admin." },
  };
  if (result in messages) return messages[result];
  revalidatePath("/admin", "layout");
  return {
    ok: true,
    id: result,
    message: id ? `${name} was updated.` : `${name} can now sign in.`,
    secret: password ? password : undefined,
  };
}

async function guardTarget(targetId: string, action: "edit" | "delete") {
  const me = await requirePermission("users", action);
  const db = await getDb();
  const target = db.users.find((u) => u.id === targetId);
  if (!target) return { me, error: "That user no longer exists." };
  if (target.id === me.id) return { me, error: "You can't do that to your own account here — use My account." };
  if (target.roleId === OWNER_ROLE_ID && me.role.id !== OWNER_ROLE_ID) return { me, error: "Only a Super Admin can manage another Super Admin." };
  return { me, target, error: null };
}

export async function setUserStatus(id: string, status: UserStatus): Promise<FormState> {
  const { me, target, error } = await guardTarget(id, "edit");
  if (error || !target) return { message: error ?? "Not found" };
  const res = await mutate((db) => {
    const u = db.users.find((x) => x.id === id)!;
    if (status === "suspended" && u.roleId === OWNER_ROLE_ID && ownerCount(db, u.id) === 0) return false;
    u.status = status;
    u.sessionVersion = (u.sessionVersion ?? 0) + (status === "suspended" ? 1 : 0);
    u.lockedUntil = "";
    u.failedAttempts = 0;
    u.updatedAt = new Date().toISOString();
    log(db, me.name, status === "suspended" ? "suspended" : "re-activated", u.email);
    return true;
  });
  if (!res) return { message: "There must always be at least one active Super Admin." };
  revalidatePath("/admin/users");
  return { ok: true, message: status === "suspended" ? `${target.name} is suspended and signed out.` : `${target.name} is active again.` };
}

export async function resetUserPassword(id: string): Promise<FormState> {
  const { me, target, error } = await guardTarget(id, "edit");
  if (error || !target) return { message: error ?? "Not found" };
  const password = generatePassword();
  await mutate((db) => {
    const u = db.users.find((x) => x.id === id)!;
    u.passwordHash = hashPassword(password);
    u.mustChangePassword = true;
    u.sessionVersion = (u.sessionVersion ?? 0) + 1;
    u.lockedUntil = "";
    u.failedAttempts = 0;
    u.updatedAt = new Date().toISOString();
    log(db, me.name, "reset the password of", u.email);
  });
  revalidatePath("/admin/users");
  return { ok: true, message: `New password for ${target.name}`, secret: password };
}

export async function forceSignOut(id: string): Promise<FormState> {
  const { me, target, error } = await guardTarget(id, "edit");
  if (error || !target) return { message: error ?? "Not found" };
  await mutate((db) => {
    const u = db.users.find((x) => x.id === id)!;
    u.sessionVersion = (u.sessionVersion ?? 0) + 1;
    log(db, me.name, "signed out every session of", u.email);
  });
  return { ok: true, message: `${target.name} was signed out of all devices.` };
}

export async function deleteUser(id: string): Promise<FormState> {
  const { me, target, error } = await guardTarget(id, "delete");
  if (error || !target) return { message: error ?? "Not found" };
  const res = await mutate((db) => {
    if (target.roleId === OWNER_ROLE_ID && ownerCount(db, id) === 0) return false;
    db.users = db.users.filter((u) => u.id !== id);
    log(db, me.name, "removed user", target.email);
    return true;
  });
  if (!res) return { message: "There must always be at least one active Super Admin." };
  revalidatePath("/admin/users");
  return { ok: true, message: `${target.name} was removed.` };
}

/* ------------------------------------------------------------------ roles */

export async function saveRole(_: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "") || null;
  const { user: me, allowed } = await checkPermission("roles", id ? "edit" : "create");
  if (!allowed) return DENIED;
  if (id === OWNER_ROLE_ID) return { message: "The Super Admin role is locked." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const color = String(formData.get("color") ?? ROLE_COLORS[0]);
  const permissions = formData.getAll("permissions").map(String).filter((p) => ALL_PERMISSIONS.includes(p));
  // "create/edit/delete" imply "view"
  for (const p of [...permissions]) {
    const view = `${p.split(".")[0]}.view`;
    if (!permissions.includes(view)) permissions.push(view);
  }
  if (name.length < 2) return { errors: { name: "Give the role a name" } };

  const result = await mutate((db) => {
    if (db.roles.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.id !== id)) return "exists" as const;
    const now = new Date().toISOString();
    if (id) {
      const r = db.roles.find((x) => x.id === id);
      if (!r) return "missing" as const;
      // don't let someone lock themselves out of role management
      if (me.role.id === id && !can(permissions, "roles", "edit")) return "self-lock" as const;
      Object.assign(r, { name, description, color, permissions, updatedAt: now });
      log(db, me.name, "updated role", name);
      return r.id;
    }
    const r = { id: `role-${newId()}`, name, description, color, permissions, system: false, createdAt: now, updatedAt: now };
    db.roles.push(r);
    log(db, me.name, "created role", name);
    return r.id;
  });
  if (result === "exists") return { errors: { name: "A role with this name already exists" } };
  if (result === "missing") return { message: "That role no longer exists." };
  if (result === "self-lock") return { message: "You can't remove role-management from your own role." };
  revalidatePath("/admin", "layout");
  return { ok: true, id: result, message: `Role “${name}” saved.` };
}

export async function deleteRole(id: string): Promise<FormState> {
  const me = await requirePermission("roles", "delete");
  if (id === OWNER_ROLE_ID) return { message: "The Super Admin role can't be deleted." };
  const res = await mutate((db) => {
    const inUse = db.users.filter((u) => u.roleId === id).length;
    if (inUse) return inUse;
    const role = db.roles.find((r) => r.id === id);
    db.roles = db.roles.filter((r) => r.id !== id);
    if (role) log(db, me.name, "deleted role", role.name);
    return 0;
  });
  if (res) return { message: `Move the ${res} user${res > 1 ? "s" : ""} with this role to another role first.` };
  revalidatePath("/admin/roles");
  return { ok: true, message: "Role deleted." };
}

/* ---------------------------------------------------------------- account */

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const me = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (name.length < 2) return { errors: { name: "Please enter your name" } };
  await mutate((db) => {
    const u = db.users.find((x) => x.id === me.id);
    if (u) Object.assign(u, { name, phone, updatedAt: new Date().toISOString() });
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const me = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? next);
  const problems = passwordProblems(next);
  if (problems.length) return { errors: { next: `Needs ${problems.join(", ")}` } };
  if (confirm !== next) return { errors: { confirm: "Passwords don't match" } };
  if (current === next) return { errors: { next: "Choose a different password from the current one" } };

  const updated = await mutate((db) => {
    const u = db.users.find((x) => x.id === me.id);
    if (!u || !verifyPassword(current, u.passwordHash)) return null;
    u.passwordHash = hashPassword(next);
    u.mustChangePassword = false;
    u.sessionVersion = (u.sessionVersion ?? 0) + 1; // other devices are signed out
    u.updatedAt = new Date().toISOString();
    log(db, u.name, "changed their password", "");
    return { id: u.id, sessionVersion: u.sessionVersion };
  });
  if (!updated) return { errors: { current: "Current password is incorrect" } };
  await setSessionCookie(updated); // keep this device signed in
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Password updated. Other devices have been signed out." };
}

export async function signOutEverywhere(): Promise<FormState> {
  const me = await requireUser();
  const updated = await mutate((db) => {
    const u = db.users.find((x) => x.id === me.id)!;
    u.sessionVersion = (u.sessionVersion ?? 0) + 1;
    log(db, u.name, "signed out", "all other devices");
    return { id: u.id, sessionVersion: u.sessionVersion };
  });
  await setSessionCookie(updated);
  return { ok: true, message: "All other devices have been signed out." };
}

/* ------------------------------------------------------------------ media */

export async function deleteMedia(name: string) {
  const user = await requirePermission("media", "delete");
  const safe = path.basename(name);
  await fs.rm(path.join(DATA_DIR, "uploads", safe), { force: true });
  await mutate((db) => log(db, user.name, "deleted", `File: ${safe}`));
  revalidatePath("/admin/media");
}
