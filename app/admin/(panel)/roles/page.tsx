import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { can, expand, OWNER_ROLE_ID, sortRoles } from "@/lib/permissions";
import { RolesManager } from "@/components/admin/RolesManager";

export const metadata: Metadata = { title: "Roles & Permissions" };

export default async function RolesPage({ searchParams }: PageProps<"/admin/roles">) {
  const me = await requirePermission("roles", "view");
  const { role } = await searchParams;
  const db = await getDb();
  const roles = sortRoles(db.roles).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color,
    system: r.system,
    permissions: expand(r.permissions),
    users: db.users.filter((u) => u.roleId === r.id).map((u) => ({ id: u.id, name: u.name })),
    updatedAt: r.updatedAt,
  }));
  return (
    <RolesManager
      roles={roles}
      initialId={typeof role === "string" ? role : roles.find((r) => r.id !== OWNER_ROLE_ID)?.id ?? roles[0]?.id}
      myRoleId={me.role.id}
      perms={{ create: can(me.permissions, "roles", "create"), edit: can(me.permissions, "roles", "edit"), delete: can(me.permissions, "roles", "delete") }}
    />
  );
}
