import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "./db";
import { decodeSession, SESSION_COOKIE } from "./session";
import { can, type Action } from "./permissions";
import type { User } from "./types";

export type SafeUser = Omit<User, "passwordHash"> & {
  role: { id: string; name: string; color: string; system: boolean };
  permissions: string[];
};

/**
 * The signed-in user, verified against the database on every request:
 * the account must be active, the session version must match (so suspending
 * or "sign out everywhere" takes effect immediately) and the role must exist.
 */
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const store = await cookies();
  const session = decodeSession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const db = await getDb();
  const user = db.users.find((u) => u.id === session.uid);
  if (!user || user.status !== "active" || (session.sv ?? 0) !== (user.sessionVersion ?? 0)) return null;
  const role = db.roles.find((r) => r.id === user.roleId);
  if (!role) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return {
    ...safe,
    role: { id: role.id, name: role.name, color: role.color, system: role.system },
    permissions: role.permissions,
  };
});

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Page / action guard: redirects to the dashboard with a notice when not allowed. */
export async function requirePermission(module: string, action: Action = "view"): Promise<SafeUser> {
  const user = await requireUser();
  if (!can(user.permissions, module, action)) redirect(`/admin?denied=${module}.${action}`);
  return user;
}

/** Non-redirecting check for server actions that return a form state. */
export async function checkPermission(module: string, action: Action) {
  const user = await requireUser();
  return { user, allowed: can(user.permissions, module, action) };
}
