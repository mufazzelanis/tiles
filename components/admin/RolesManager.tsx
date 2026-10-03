"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Copy, Info, Lock, Plus, Save, ShieldCheck, Trash2, Users } from "lucide-react";
import { deleteRole, saveRole, type FormState } from "@/app/admin/actions";
import { ACTION_LABEL, ACTIONS, ALL_PERMISSIONS, MODULES, ROLE_COLORS, type Action } from "@/lib/permissions";
import { cn, timeAgo } from "@/lib/utils";
import { Button, Card, PageHeader } from "./ui";
import { Avatar } from "./kit";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "./Toaster";

interface RoleRow {
  id: string;
  name: string;
  description: string;
  color: string;
  system: boolean;
  permissions: string[];
  users: { id: string; name: string }[];
  updatedAt: string;
}
type Draft = { id: string | null; name: string; description: string; color: string; permissions: Set<string> };

const GROUPS = [...new Set(MODULES.map((m) => m.group))];
const toDraft = (r: RoleRow): Draft => ({ id: r.id, name: r.name, description: r.description, color: r.color, permissions: new Set(r.permissions) });

const PRESETS: { label: string; build: () => string[] }[] = [
  { label: "Read-only", build: () => MODULES.filter((m) => m.group !== "System").map((m) => `${m.key}.view`) },
  {
    label: "Content team",
    build: () => MODULES.filter((m) => m.group === "Catalogue" || m.group === "Website").flatMap((m) => m.actions.map((a) => `${m.key}.${a}`)),
  },
  { label: "Everything except system", build: () => MODULES.filter((m) => m.group !== "System").flatMap((m) => m.actions.map((a) => `${m.key}.${a}`)) },
  { label: "Clear all", build: () => [] },
];

export function RolesManager({ roles, initialId, myRoleId, perms }: {
  roles: RoleRow[];
  initialId?: string;
  myRoleId: string;
  perms: { create: boolean; edit: boolean; delete: boolean };
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(initialId ?? roles[0]?.id ?? "new");
  const selected = roles.find((r) => r.id === selectedId) ?? null;
  const [draft, setDraft] = useState<Draft>(() => (selected ? toDraft(selected) : { id: null, name: "", description: "", color: ROLE_COLORS[5], permissions: new Set() }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  // reload the editor when the selection (or the saved data) changes
  const [syncKey, setSyncKey] = useState(`${selectedId}:${selected?.updatedAt}`);
  if (syncKey !== `${selectedId}:${selected?.updatedAt}`) {
    setSyncKey(`${selectedId}:${selected?.updatedAt}`);
    if (selected) setDraft(toDraft(selected));
  }

  const locked = !!selected?.system;
  const editable = !locked && (draft.id ? perms.edit : perms.create);
  const dirty = useMemo(() => {
    if (!selected) return draft.name !== "" || draft.permissions.size > 0;
    return (
      draft.name !== selected.name ||
      draft.description !== selected.description ||
      draft.color !== selected.color ||
      draft.permissions.size !== selected.permissions.length ||
      selected.permissions.some((p) => !draft.permissions.has(p))
    );
  }, [draft, selected]);

  const [res, action, saving] = useActionState<FormState, FormData>(async (prev, fd) => {
    const r = await saveRole(prev, fd);
    if (r.ok) {
      toast(r.message ?? "Saved");
      if (r.id) {
        setSelectedId(r.id);
        router.replace(`/admin/roles?role=${r.id}`, { scroll: false });
      }
      router.refresh();
    }
    return r;
  }, {});
  useEffect(() => {
    if (res.message && !res.ok && !res.errors) toast(res.message, "error");
  }, [res]);

  const has = (p: string) => (locked ? true : draft.permissions.has(p));
  const update = (fn: (s: Set<string>) => void) =>
    setDraft((d) => {
      const s = new Set(d.permissions);
      fn(s);
      return { ...d, permissions: s };
    });

  const toggle = (mod: string, a: Action) =>
    update((s) => {
      const p = `${mod}.${a}`;
      if (s.has(p)) {
        s.delete(p);
        if (a === "view") for (const x of ACTIONS) s.delete(`${mod}.${x}`); // no view → nothing else
      } else {
        s.add(p);
        if (a !== "view") s.add(`${mod}.view`); // anything implies view
      }
    });
  const toggleRow = (mod: string, actions: readonly Action[]) =>
    update((s) => {
      const all = actions.every((a) => s.has(`${mod}.${a}`));
      for (const a of actions) {
        if (all) s.delete(`${mod}.${a}`);
        else s.add(`${mod}.${a}`);
      }
    });
  const toggleColumn = (a: Action) =>
    update((s) => {
      const mods = MODULES.filter((m) => m.actions.includes(a));
      const all = mods.every((m) => s.has(`${m.key}.${a}`));
      for (const m of mods) {
        if (all) {
          s.delete(`${m.key}.${a}`);
          if (a === "view") for (const x of ACTIONS) s.delete(`${m.key}.${x}`);
        } else {
          s.add(`${m.key}.${a}`);
          s.add(`${m.key}.view`);
        }
      }
    });

  const startNew = (from?: RoleRow) => {
    setSelectedId("new");
    setDraft({
      id: null,
      name: from ? `${from.name} (copy)` : "",
      description: from?.description ?? "",
      color: from ? ROLE_COLORS[(ROLE_COLORS.indexOf(from.color) + 1) % ROLE_COLORS.length] : ROLE_COLORS[5],
      permissions: new Set(from ? from.permissions : []),
    });
  };

  const count = locked ? ALL_PERMISSIONS.length : draft.permissions.size;

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="A role is a reusable set of permissions. Change a role once and everyone with that role is updated instantly."
        crumbs={[{ href: "/admin/users", label: "Users" }]}
        actions={perms.create && <Button onClick={() => startNew()}><Plus className="size-4" /> New role</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* role list */}
        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={cn(
                "group relative w-full overflow-hidden rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md",
                selectedId === r.id ? "border-primary-300 ring-2 ring-primary-100" : "border-slate-200",
              )}
            >
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: r.color }} />
              <span className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{r.name}</span>
                {r.system && <Lock className="size-3.5 text-slate-400" />}
                {r.id === myRoleId && <span className="rounded bg-slate-100 px-1.5 text-[10px] font-medium text-slate-500">YOUR ROLE</span>}
              </span>
              <span className="mt-1 line-clamp-2 block text-xs text-slate-500">{r.description}</span>
              <span className="mt-3 flex items-center justify-between">
                <span className="flex -space-x-1.5">
                  {r.users.slice(0, 4).map((u) => <Avatar key={u.id} name={u.name} size={22} />)}
                  {r.users.length === 0 && <span className="text-[11px] text-slate-400">No members</span>}
                  {r.users.length > 4 && <span className="grid size-[22px] place-items-center rounded-full bg-slate-200 text-[9px] font-semibold text-slate-600">+{r.users.length - 4}</span>}
                </span>
                <span className="text-[11px] text-slate-400">{r.system ? "All" : r.permissions.length} permissions</span>
              </span>
            </button>
          ))}
          {selectedId === "new" && (
            <div className="rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/40 p-4 text-sm font-medium text-primary-700">
              {draft.name || "New role"} <span className="font-normal text-primary-500">· unsaved</span>
            </div>
          )}
        </div>

        {/* editor */}
        <form action={action}>
          {draft.id && <input type="hidden" name="id" value={draft.id} />}
          <input type="hidden" name="color" value={draft.color} />
          {[...draft.permissions].map((p) => <input key={p} type="hidden" name="permissions" value={p} />)}

          <Card>
            <div className="border-b border-slate-100 p-5 sm:p-6">
              {locked && (
                <p className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  <Lock className="mt-0.5 size-4 shrink-0" /> The Super Admin role always has every permission and can&apos;t be edited or deleted. Duplicate it to create a similar role.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Role name</span>
                  <input
                    name="name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    disabled={!editable}
                    aria-invalid={!!res.errors?.name}
                    placeholder="e.g. Warehouse Manager"
                    className="input disabled:bg-slate-50"
                  />
                  {res.errors?.name && <span className="mt-1 block text-xs text-rose-600">{res.errors.name}</span>}
                </label>
                <fieldset>
                  <legend className="mb-1.5 block text-sm font-medium text-slate-700">Colour</legend>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ROLE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        disabled={!editable}
                        onClick={() => setDraft((d) => ({ ...d, color: c }))}
                        className={cn("size-7 rounded-full transition", draft.color === c ? "ring-2 ring-offset-2" : "hover:scale-110", !editable && "cursor-not-allowed")}
                        style={{ background: c, ["--tw-ring-color" as string]: c }}
                        aria-label={`Colour ${c}`}
                      />
                    ))}
                  </div>
                </fieldset>
              </div>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
                <textarea
                  name="description"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  disabled={!editable}
                  placeholder="What is this role for?"
                  className="input disabled:bg-slate-50"
                />
              </label>
            </div>

            {/* permission matrix */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 sm:px-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Permissions</h2>
                <p className="text-xs text-slate-500">
                  <b className="text-slate-700">{count}</b> of {ALL_PERMISSIONS.length} granted · Create, Edit and Delete automatically include View
                </p>
              </div>
              {editable && (
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, permissions: new Set(p.build()) }))}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs text-slate-500 uppercase">
                    <th className="px-5 py-2.5 text-left font-medium sm:px-6">Area</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="w-20 px-2 py-2.5 text-center font-medium">
                        <button type="button" disabled={!editable} onClick={() => toggleColumn(a)} className="uppercase enabled:hover:text-primary-600" title={`Toggle ${ACTION_LABEL[a]} for every area`}>
                          {ACTION_LABEL[a]}
                        </button>
                      </th>
                    ))}
                    <th className="w-16 px-2 py-2.5 text-center font-medium">All</th>
                  </tr>
                </thead>
                <tbody>
                  {GROUPS.map((g) => (
                    <GroupRows key={g} group={g} has={has} editable={editable} toggle={toggle} toggleRow={toggleRow} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* members + footer */}
            {selected && selected.users.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3 sm:px-6">
                <Users className="size-4 text-slate-400" />
                <span className="text-xs text-slate-500">{selected.users.length} member{selected.users.length > 1 ? "s" : ""}:</span>
                {selected.users.slice(0, 6).map((u) => (
                  <span key={u.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pr-2.5 pl-0.5 text-xs text-slate-700">
                    <Avatar name={u.name} size={20} /> {u.name}
                  </span>
                ))}
                <Link href={`/admin/users`} className="text-xs font-medium text-primary-600 hover:underline">Manage users</Link>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
              {selected && perms.delete && !locked && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  disabled={selected.users.length > 0}
                  title={selected.users.length > 0 ? "Move its members to another role first" : undefined}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              )}
              {selected && perms.create && (
                <Button type="button" variant="ghost" onClick={() => startNew(selected)}>
                  <Copy className="size-4" /> Duplicate
                </Button>
              )}
              <span className="flex-1" />
              {selected && <span className="hidden text-xs text-slate-400 sm:inline">Updated {timeAgo(selected.updatedAt)}</span>}
              {dirty && editable && <span className="flex items-center gap-1.5 text-xs text-amber-600"><span className="size-1.5 animate-pulse rounded-full bg-amber-500" /> Unsaved</span>}
              {editable && (
                <Button disabled={saving || !dirty}>
                  <Save className="size-4" /> {saving ? "Saving…" : draft.id ? "Save role" : "Create role"}
                </Button>
              )}
              {!editable && !locked && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500"><Info className="size-3.5" /> Read-only — you can&apos;t edit roles</span>
              )}
              {locked && <span className="flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck className="size-3.5" /> Locked system role</span>}
            </div>
          </Card>
        </form>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete the “${selected?.name}” role?`}
        text="This can't be undone."
        pending={deleting}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          startDelete(async () => {
            const r = await deleteRole(selected!.id);
            setConfirmDelete(false);
            toast(r.message ?? "Done", r.ok ? "success" : "error");
            if (r.ok) {
              setSelectedId(roles.find((x) => x.id !== selected!.id)?.id ?? "new");
              router.replace("/admin/roles", { scroll: false });
              router.refresh();
            }
          })
        }
      />
    </>
  );
}

function GroupRows({ group, has, editable, toggle, toggleRow }: {
  group: string;
  has: (p: string) => boolean;
  editable: boolean;
  toggle: (mod: string, a: Action) => void;
  toggleRow: (mod: string, actions: readonly Action[]) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={6} className="bg-slate-50/40 px-5 pt-4 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase sm:px-6">{group}</td>
      </tr>
      {MODULES.filter((m) => m.group === group).map((m) => {
        const all = m.actions.every((a) => has(`${m.key}.${a}`));
        return (
          <tr key={m.key} className="border-b border-slate-50 transition hover:bg-slate-50/60">
            <td className="px-5 py-2.5 sm:px-6">
              <span className="block text-slate-800">{m.label}</span>
              {m.hint && <span className="block text-[11px] text-slate-400">{m.hint}</span>}
            </td>
            {ACTIONS.map((a) => (
              <td key={a} className="px-2 py-2.5 text-center">
                {m.actions.includes(a) ? (
                  <input
                    type="checkbox"
                    checked={has(`${m.key}.${a}`)}
                    disabled={!editable}
                    onChange={() => toggle(m.key, a)}
                    aria-label={`${ACTION_LABEL[a]} ${m.label}`}
                    className="size-[18px] cursor-pointer rounded accent-primary-600 disabled:cursor-not-allowed"
                  />
                ) : (
                  <span className="text-slate-200" aria-hidden>—</span>
                )}
              </td>
            ))}
            <td className="px-2 py-2.5 text-center">
              <button
                type="button"
                disabled={!editable}
                onClick={() => toggleRow(m.key, m.actions)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition disabled:cursor-not-allowed",
                  all ? "bg-primary-600" : "bg-slate-200",
                )}
                aria-label={`Toggle all ${m.label} permissions`}
              >
                <span className={cn("absolute size-4 rounded-full bg-white shadow transition", all ? "left-[18px]" : "left-0.5")} />
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}
