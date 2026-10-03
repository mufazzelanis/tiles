/**
 * Role-based access control: modules × actions.
 * A role holds a list of "module.action" strings, or ["*"] for full access.
 * Client-safe (plain data + pure functions).
 */

export const ACTIONS = ["view", "create", "edit", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

export const ACTION_LABEL: Record<Action, string> = { view: "View", create: "Create", edit: "Edit", delete: "Delete" };

export interface ModuleDef {
  key: string;
  label: string;
  group: "Catalogue" | "Website" | "Business" | "System";
  actions: readonly Action[];
  hint?: string;
}

export const MODULES: ModuleDef[] = [
  { key: "products", label: "Products", group: "Catalogue", actions: ACTIONS },
  { key: "categories", label: "Categories", group: "Catalogue", actions: ACTIONS },
  { key: "catalogues", label: "Catalogues", group: "Catalogue", actions: ACTIONS },
  { key: "slides", label: "Hero slider", group: "Website", actions: ACTIONS },
  { key: "news", label: "News & blog", group: "Website", actions: ACTIONS },
  { key: "projects", label: "Projects", group: "Website", actions: ACTIONS },
  { key: "sustainability", label: "Sustainability", group: "Website", actions: ACTIONS },
  { key: "stores", label: "Store locator", group: "Website", actions: ACTIONS },
  { key: "media", label: "Media library", group: "Website", actions: ["view", "create", "delete"], hint: "Create = upload files" },
  { key: "inquiries", label: "Inquiries", group: "Business", actions: ["view", "edit", "delete"], hint: "Edit = change status & notes" },
  { key: "users", label: "Users", group: "System", actions: ACTIONS },
  { key: "roles", label: "Roles & permissions", group: "System", actions: ACTIONS },
  { key: "settings", label: "Site settings", group: "System", actions: ["view", "edit"] },
];

export const ALL_PERMISSIONS = MODULES.flatMap((m) => m.actions.map((a) => `${m.key}.${a}`));

export function can(permissions: readonly string[] | undefined, module: string, action: Action = "view") {
  if (!permissions) return false;
  return permissions.includes("*") || permissions.includes(`${module}.${action}`);
}

/** Expand ["*"] to the explicit list (for the matrix editor). */
export function expand(permissions: readonly string[]) {
  return permissions.includes("*") ? [...ALL_PERMISSIONS] : permissions.filter((p) => ALL_PERMISSIONS.includes(p));
}

const content = ["products", "categories", "catalogues", "slides", "news", "projects", "sustainability", "stores"];
const allOf = (mods: string[], actions: readonly Action[] = ACTIONS) =>
  mods.flatMap((m) => {
    const def = MODULES.find((x) => x.key === m)!;
    return def.actions.filter((a) => actions.includes(a)).map((a) => `${m}.${a}`);
  });

export const OWNER_ROLE_ID = "role-owner";

/** Roles created on first run. The owner role is locked and always has every permission. */
export const BUILT_IN_ROLES = [
  {
    id: OWNER_ROLE_ID,
    name: "Super Admin",
    description: "Full access to everything, including users, roles and settings. Cannot be edited or deleted.",
    color: "#9a1219",
    permissions: ["*"],
    system: true,
  },
  {
    id: "role-admin",
    name: "Administrator",
    description: "Manages all content, inquiries and users. Cannot change roles.",
    color: "#c2410c",
    permissions: [...allOf(content), ...allOf(["media", "inquiries", "users"]), "roles.view", "settings.view", "settings.edit"],
    system: false,
  },
  {
    id: "role-editor",
    name: "Content Editor",
    description: "Creates and updates products, pages and media. Can read inquiries.",
    color: "#1d4ed8",
    permissions: [...allOf(content), ...allOf(["media"]), "inquiries.view"],
    system: false,
  },
  {
    id: "role-sales",
    name: "Sales Manager",
    description: "Handles customer inquiries and keeps store details up to date.",
    color: "#15803d",
    permissions: [...allOf(["inquiries"]), ...allOf(["products", "categories", "catalogues"], ["view"]), ...allOf(["stores"], ["view", "edit"])],
    system: false,
  },
  {
    id: "role-viewer",
    name: "Viewer",
    description: "Read-only access to content and inquiries. Cannot change anything.",
    color: "#475569",
    permissions: allOf([...content, "media", "inquiries"], ["view"]),
    system: false,
  },
];

export const ROLE_COLORS = ["#9a1219", "#c2410c", "#b45309", "#15803d", "#0f766e", "#1d4ed8", "#6d28d9", "#be185d", "#475569"];

/** Password rules shared by the server and the strength meter. */
export function passwordProblems(pw: string) {
  const issues: string[] = [];
  if (pw.length < 8) issues.push("at least 8 characters");
  if (!/[a-z]/i.test(pw)) issues.push("a letter");
  if (!/\d/.test(pw)) issues.push("a number");
  return issues;
}

export function passwordScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-z0-9]/i.test(pw)) s++;
  return Math.min(4, s); // 0..4
}

/** Display order: Super Admin first, then the built-ins, then custom roles by name. */
export function sortRoles<T extends { id: string; name: string }>(roles: T[]) {
  const rank = (r: T) => {
    const i = BUILT_IN_ROLES.findIndex((b) => b.id === r.id);
    return i === -1 ? BUILT_IN_ROLES.length : i;
  };
  return [...roles].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
