"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  Ban, CircleCheck, Clock, KeyRound, Lock, LogOut, Mail, Pencil, Phone, Search, ShieldCheck, Trash2, UserCheck, UserPlus, Users, X,
} from "lucide-react";
import { deleteUser, forceSignOut, resetUserPassword, saveUser, setUserStatus, type FormState } from "@/app/admin/actions";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Badge, Button, Card, EmptyState, PageHeader } from "./ui";
import { ActionMenu, Avatar, CredentialsDialog, Drawer, PasswordField } from "./kit";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "./Toaster";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  status: "active" | "suspended";
  locked: boolean;
  mustChangePassword: boolean;
  loginCount: number;
  lastLoginAt: string;
  createdBy: string;
  createdAt: string;
}
interface RoleRow {
  id: string;
  name: string;
  description: string;
  color: string;
  system: boolean;
  permissionCount: number;
  users: number;
}
type Perms = { create: boolean; edit: boolean; delete: boolean; roles: boolean };

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Never signed in" },
  { key: "locked", label: "Locked" },
  { key: "suspended", label: "Suspended" },
] as const;

function statusOf(u: UserRow) {
  if (u.status === "suspended") return { key: "suspended", label: "Suspended", tone: "rose" as const, icon: Ban };
  if (u.locked) return { key: "locked", label: "Locked", tone: "amber" as const, icon: Lock };
  if (u.loginCount === 0) return { key: "pending", label: "Invited", tone: "blue" as const, icon: Clock };
  return { key: "active", label: "Active", tone: "green" as const, icon: CircleCheck };
}

export function UsersManager({ users, roles, meId, isOwner, ownerRoleId, perms, openInvite }: {
  users: UserRow[];
  roles: RoleRow[];
  meId: string;
  isOwner: boolean;
  ownerRoleId: string;
  perms: Perms;
  openInvite: boolean;
}) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [drawer, setDrawer] = useState<{ mode: "new" } | { mode: "edit"; user: UserRow } | null>(openInvite && perms.create ? { mode: "new" } : null);
  const [creds, setCreds] = useState<{ title: string; email: string; password: string } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "delete" | "suspend"; user: UserRow } | null>(null);
  const [pending, start] = useTransition();

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: users.length, active: 0, pending: 0, locked: 0, suspended: 0 };
    for (const u of users) c[statusOf(u).key]++;
    return c;
  }, [users]);

  const list = users.filter((u) => {
    const needle = q.trim().toLowerCase();
    return (
      (!needle || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(needle)) &&
      (!roleFilter || u.roleId === roleFilter) &&
      (statusFilter === "all" || statusOf(u).key === statusFilter)
    );
  });

  const run = (fn: () => Promise<FormState>, after?: (r: FormState) => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message && !r.secret) toast(r.message);
        after?.(r);
      } else toast(r.message ?? "Something went wrong", "error");
    });

  const stats = [
    { label: "Team members", value: users.length, icon: Users, tone: "bg-primary-50 text-primary-600" },
    { label: "Active", value: counts.active, icon: UserCheck, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Awaiting first sign-in", value: counts.pending, icon: Clock, tone: "bg-sky-50 text-sky-600" },
    { label: "Suspended / locked", value: counts.suspended + counts.locked, icon: Ban, tone: "bg-rose-50 text-rose-600" },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Invite your team, give each person a role, and control exactly what they can see and change."
        actions={
          <>
            {perms.roles && (
              <Link href="/admin/roles" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                <ShieldCheck className="size-4" /> Roles & permissions
              </Link>
            )}
            {perms.create && (
              <Button onClick={() => setDrawer({ mode: "new" })}>
                <UserPlus className="size-4" /> Invite user
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className={cn("grid size-11 place-items-center rounded-xl", tone)}><Icon className="size-5" /></span>
            <div>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Card>
          <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 p-4">
            <label className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" className="input pl-9" />
            </label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input w-auto">
              <option value="">All roles</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-slate-100 px-4 py-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition", statusFilter === s.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}
              >
                {s.label}
                <span className={statusFilter === s.key ? "text-slate-300" : "text-slate-400"}>{counts[s.key]}</span>
              </button>
            ))}
          </div>

          {list.length ? (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-sm", pending && "opacity-60")}>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Role</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Last active</th>
                    <th className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((u) => {
                    const role = roleById.get(u.roleId);
                    const st = statusOf(u);
                    const self = u.id === meId;
                    const protectedOwner = u.roleId === ownerRoleId && !isOwner;
                    const canTouch = !self && !protectedOwner;
                    return (
                      <tr key={u.id} className="transition hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDrawer({ mode: "edit", user: u })}
                            className="flex items-center gap-3 text-left disabled:cursor-default"
                            disabled={!perms.edit || protectedOwner}
                          >
                            <Avatar name={u.name} ring={role?.color} />
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5 font-medium text-slate-900">
                                {u.name}
                                {self && <span className="rounded bg-slate-100 px-1.5 text-[10px] font-medium text-slate-500">YOU</span>}
                              </span>
                              <span className="block truncate text-xs text-slate-500">{u.email}</span>
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          {role ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap" style={{ borderColor: `${role.color}33`, background: `${role.color}0d`, color: role.color }}>
                              {role.system && <ShieldCheck className="size-3" />} {role.name}
                            </span>
                          ) : (
                            <Badge tone="rose">No role</Badge>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={st.tone}><st.icon className="size-3" /> {st.label}</Badge>
                          {u.mustChangePassword && u.status === "active" && <p className="mt-1 text-[11px] text-slate-400">Must set new password</p>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <p className="text-slate-700">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}</p>
                          <p className="text-[11px] text-slate-400">{u.loginCount} sign-in{u.loginCount === 1 ? "" : "s"}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ActionMenu
                            items={[
                              { label: "Edit details & role", icon: Pencil, onClick: () => setDrawer({ mode: "edit", user: u }), hidden: !perms.edit || protectedOwner },
                              { label: "Email this person", icon: Mail, onClick: () => window.open(`mailto:${u.email}`) },
                              { label: "Reset password", icon: KeyRound, hidden: !perms.edit || !canTouch, divider: true, onClick: () => run(() => resetUserPassword(u.id), (r) => r.secret && setCreds({ title: `New password for ${u.name}`, email: u.email, password: r.secret })) },
                              { label: "Sign out of all devices", icon: LogOut, hidden: !perms.edit || !canTouch, onClick: () => run(() => forceSignOut(u.id)) },
                              u.status === "active"
                                ? { label: "Suspend access", icon: Ban, danger: true, divider: true, hidden: !perms.edit || !canTouch, onClick: () => setConfirm({ kind: "suspend", user: u }) }
                                : { label: "Re-activate", icon: UserCheck, divider: true, hidden: !perms.edit || !canTouch, onClick: () => run(() => setUserStatus(u.id, "active")) },
                              { label: "Delete user", icon: Trash2, danger: true, hidden: !perms.delete || !canTouch, onClick: () => setConfirm({ kind: "delete", user: u }) },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<Users className="size-5" />} title="No users match" text="Try a different search, role or status." />
          )}
        </Card>

        {/* role overview */}
        <Card title="Roles" action={perms.roles && <Link href="/admin/roles" className="text-xs font-medium text-primary-600 hover:underline">Manage</Link>}>
          <ul className="divide-y divide-slate-100">
            {roles.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setRoleFilter((f) => (f === r.id ? "" : r.id))}
                  className={cn("flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-slate-50", roleFilter === r.id && "bg-primary-50/60")}
                >
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">{r.name}</span>
                      <span className="flex -space-x-1.5">
                        {users.filter((u) => u.roleId === r.id).slice(0, 3).map((u) => <Avatar key={u.id} name={u.name} size={22} />)}
                        {r.users > 3 && <span className="grid size-[22px] place-items-center rounded-full bg-slate-200 text-[9px] font-semibold text-slate-600">+{r.users - 3}</span>}
                        {r.users === 0 && <span className="text-[11px] text-slate-400">no users</span>}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{r.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <UserDrawer
        state={drawer}
        roles={roles}
        isOwner={isOwner}
        ownerRoleId={ownerRoleId}
        meId={meId}
        onClose={() => setDrawer(null)}
        onSaved={(r, email, isNew) => {
          setDrawer(null);
          if (r.secret) setCreds({ title: isNew ? "Invitation ready" : "Password updated", email, password: r.secret });
          else toast(r.message ?? "Saved");
        }}
      />

      <CredentialsDialog data={creds} onClose={() => setCreds(null)} />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === "delete" ? `Delete ${confirm.user.name}?` : `Suspend ${confirm?.user.name}?`}
        text={confirm?.kind === "delete" ? "Their account is removed permanently. Their past activity stays in the log." : "They are signed out immediately and can't sign in until you re-activate them."}
        confirmLabel={confirm?.kind === "delete" ? "Delete user" : "Suspend"}
        pending={pending}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const c = confirm!;
          start(async () => {
            const r = c.kind === "delete" ? await deleteUser(c.user.id) : await setUserStatus(c.user.id, "suspended");
            setConfirm(null);
            toast(r.message ?? "Done", r.ok ? "success" : "error");
          });
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------- drawer */

const defaultRole = (roles: RoleRow[]) => roles.find((r) => r.id === "role-editor")?.id ?? roles[0]?.id ?? "";

function UserDrawer({ state, roles, isOwner, ownerRoleId, meId, onClose, onSaved }: {
  state: { mode: "new" } | { mode: "edit"; user: UserRow } | null;
  roles: RoleRow[];
  isOwner: boolean;
  ownerRoleId: string;
  meId: string;
  onClose: () => void;
  onSaved: (r: FormState, email: string, isNew: boolean) => void;
}) {
  const user = state?.mode === "edit" ? state.user : null;
  const self = user?.id === meId;
  const key = state ? (user ? user.id : "new") : null;
  const [roleId, setRoleId] = useState(user?.roleId ?? defaultRole(roles));
  const [suspended, setSuspended] = useState(user?.status === "suspended");
  const [pwMode, setPwMode] = useState<"auto" | "manual">("auto");
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    // reset local state whenever a different user (or "new") is opened
    setPrevKey(key);
    setRoleId(user?.roleId ?? defaultRole(roles));
    setSuspended(user?.status === "suspended");
    setPwMode("auto");
  }

  const [res, action, saving] = useActionState<FormState, FormData>(async (prev, fd) => {
    const r = await saveUser(prev, fd);
    if (r.ok) onSaved(r, String(fd.get("email")), !user);
    return r;
  }, {});
  const err = (k: string) => (res.errors?.[k] ? <p className="mt-1 text-xs text-rose-600">{res.errors[k]}</p> : null);

  useEffect(() => {
    if (res.message && !res.ok && !res.errors) toast(res.message, "error");
  }, [res]);

  return (
    <Drawer
      open={!!state}
      onClose={onClose}
      title={user ? `Edit ${user.name}` : "Invite a team member"}
      subtitle={user ? `Member since ${formatDate(user.createdAt)} · added by ${user.createdBy || "—"}` : "They'll get access based on the role you choose."}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="user-form" disabled={saving}>
            {saving ? "Saving…" : user ? "Save changes" : <><UserPlus className="size-4" /> Create account</>}
          </Button>
        </div>
      }
    >
      <form id="user-form" key={key ?? "closed"} action={action} autoComplete="off" className="space-y-6">
        {user && <input type="hidden" name="id" value={user.id} />}
        {res.message && !res.ok && res.errors && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{res.message}</p>}

        <section className="space-y-4">
          <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Profile</h3>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
            <input name="name" defaultValue={user?.name} autoComplete="off" aria-invalid={!!res.errors?.name} className="input" placeholder="e.g. Nusrat Jahan" />
            {err("name")}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Work email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                {/* autoComplete="off" + data-lpignore keep the browser from filling in *your* saved login */}
                <input name="email" type="email" defaultValue={user?.email} autoComplete="off" data-lpignore="true" data-1p-ignore aria-invalid={!!res.errors?.email} className="input pl-9" placeholder="name@company.com" />
              </span>
              {err("email")}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone <span className="font-normal text-slate-400">(optional)</span></span>
              <span className="relative block">
                <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input name="phone" type="tel" defaultValue={user?.phone} autoComplete="off" className="input pl-9" placeholder="01XXXXXXXXX" />
              </span>
            </label>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">Role</h3>
          <input type="hidden" name="roleId" value={roleId} />
          <div className="space-y-2">
            {roles.map((r) => {
              const disabled = (r.id === ownerRoleId && !isOwner) || (self && r.id !== user?.roleId);
              const selected = roleId === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  disabled={disabled}
                  onClick={() => setRoleId(r.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                    selected ? "border-primary-400 bg-primary-50/50 ring-2 ring-primary-100" : "border-slate-200 hover:border-slate-300",
                    disabled && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2", selected ? "border-primary-600" : "border-slate-300")}>
                    {selected && <span className="size-2 rounded-full bg-primary-600" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: r.color }} />
                      <span className="text-sm font-medium text-slate-900">{r.name}</span>
                      <span className="ml-auto text-[11px] text-slate-400">{r.permissionCount < 0 ? "All permissions" : `${r.permissionCount} permissions`}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">{r.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {err("roleId")}
          {self && <p className="mt-2 text-xs text-slate-500">You can&apos;t change your own role.</p>}
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{user ? "Password" : "Sign-in"}</h3>
          {!user && (
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 text-sm">
              {(["auto", "manual"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setPwMode(m)} className={cn("rounded-md py-1.5 font-medium transition", pwMode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
                  {m === "auto" ? "Generate password" : "Set password"}
                </button>
              ))}
            </div>
          )}
          {(user || pwMode === "manual") && (
            <PasswordField name="password" label={user ? "New password" : "Password"} placeholder={user ? "Leave empty to keep the current one" : undefined} error={res.errors?.password} generator />
          )}
          {!user && pwMode === "auto" && (
            <p className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs text-sky-800">
              <KeyRound className="mt-px size-4 shrink-0" /> A secure temporary password is created for you. You&apos;ll see it once after saving, ready to copy and share.
            </p>
          )}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" name="mustChangePassword" defaultChecked={user ? user.mustChangePassword : true} className="mt-0.5 size-4 rounded accent-primary-600" />
            <span>
              <span className="block text-sm font-medium text-slate-800">Require a new password at next sign-in</span>
              <span className="block text-xs text-slate-500">Recommended when you share a temporary password.</span>
            </span>
          </label>
        </section>

        {user && !self ? (
          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">Access</h3>
            <input type="hidden" name="status" value={suspended ? "suspended" : "active"} />
            <button
              type="button"
              onClick={() => setSuspended((s) => !s)}
              className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", suspended ? "border-rose-200 bg-rose-50" : "border-slate-200")}
            >
              <span className={cn("grid size-9 place-items-center rounded-lg", suspended ? "bg-rose-100 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                {suspended ? <Ban className="size-4" /> : <UserCheck className="size-4" />}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-slate-800">{suspended ? "Access suspended" : "Access active"}</span>
                <span className="block text-xs text-slate-500">{suspended ? "Click to restore access." : "Click to suspend — they'll be signed out immediately."}</span>
              </span>
              {suspended && <X className="size-4 text-rose-500" />}
            </button>
          </section>
        ) : (
          <input type="hidden" name="status" value="active" />
        )}
      </form>
    </Drawer>
  );
}
