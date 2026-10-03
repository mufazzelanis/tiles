import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can, OWNER_ROLE_ID, sortRoles } from "@/lib/permissions";
import { UsersManager, type UserRow } from "@/components/admin/UsersManager";

export const metadata: Metadata = { title: "Users" };

const isLocked = (until: string) => !!until && new Date(until).getTime() > Date.now();

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const me = await requirePermission("users", "view");
  const { invite } = await searchParams;
  const db = await getDb();

  // never send password hashes to the browser
  const users: UserRow[] = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    roleId: u.roleId,
    status: u.status,
    locked: isLocked(u.lockedUntil),
    mustChangePassword: u.mustChangePassword,
    loginCount: u.loginCount ?? 0,
    lastLoginAt: u.lastLoginAt,
    createdBy: u.createdBy,
    createdAt: u.createdAt,
  }));
  const roles = sortRoles(db.roles).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color,
    system: r.system,
    permissionCount: r.permissions.includes("*") ? -1 : r.permissions.length,
    users: db.users.filter((u) => u.roleId === r.id).length,
  }));

  return (
    <UsersManager
      users={users}
      roles={roles}
      meId={me.id}
      isOwner={me.role.id === OWNER_ROLE_ID}
      ownerRoleId={OWNER_ROLE_ID}
      perms={{ create: can(me.permissions, "users", "create"), edit: can(me.permissions, "users", "edit"), delete: can(me.permissions, "users", "delete"), roles: can(me.permissions, "roles") }}
      openInvite={invite === "1"}
    />
  );
}
