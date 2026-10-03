"use client";

import { useActionState, useEffect, useTransition } from "react";
import { Check, KeyRound, Loader2, LogOut, Minus, Save, ShieldCheck } from "lucide-react";
import { changePassword, signOutEverywhere, updateProfile, type FormState } from "@/app/admin/actions";
import type { SafeUser } from "@/lib/auth";
import type { ActivityEntry } from "@/lib/types";
import { ACTION_LABEL, ACTIONS, can, MODULES } from "@/lib/permissions";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Button, Card } from "./ui";
import { Avatar, PasswordField } from "./kit";
import { toast } from "./Toaster";

function useToastOnOk(state: FormState) {
  useEffect(() => {
    if (state.ok && state.message) toast(state.message);
  }, [state]);
}

/** Change-password form; also used by the forced first-sign-in screen. */
export function ChangePasswordForm({ forced }: { forced?: boolean }) {
  const [pw, pwAction, saving] = useActionState<FormState, FormData>(changePassword, {});
  useToastOnOk(pw);
  return (
    <form action={pwAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{forced ? "Temporary password" : "Current password"}</span>
        <input name="current" type="password" autoComplete="current-password" aria-invalid={!!pw.errors?.current} className="input" />
        {pw.errors?.current && <span className="mt-1 block text-xs text-rose-600">{pw.errors.current}</span>}
      </label>
      <PasswordField name="next" label="New password" error={pw.errors?.next} generator />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</span>
        <input name="confirm" type="password" autoComplete="new-password" aria-invalid={!!pw.errors?.confirm} className="input" />
        {pw.errors?.confirm && <span className="mt-1 block text-xs text-rose-600">{pw.errors.confirm}</span>}
      </label>
      <Button disabled={saving} className="w-full">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} {forced ? "Set my password" : "Update password"}
      </Button>
    </form>
  );
}

export function AccountForms({ user, activity }: { user: SafeUser; activity: ActivityEntry[] }) {
  const [profile, profileAction, savingProfile] = useActionState<FormState, FormData>(updateProfile, {});
  const [pending, start] = useTransition();
  useToastOnOk(profile);

  const groups = [...new Set(MODULES.map((m) => m.group))];
  const full = user.permissions.includes("*");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center gap-5 border-b border-slate-100 p-6">
            <Avatar name={user.name} size={64} ring={user.role.color} />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: `${user.role.color}33`, background: `${user.role.color}0d`, color: user.role.color }}>
                  <ShieldCheck className="size-3" /> {user.role.name}
                </span>
                <span className="text-xs text-slate-400">Member since {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
          <form action={profileAction} className="grid gap-4 p-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Display name</span>
              <input name="name" defaultValue={user.name} aria-invalid={!!profile.errors?.name} className="input" />
              {profile.errors?.name && <span className="mt-1 block text-xs text-rose-600">{profile.errors.name}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone</span>
              <input name="phone" type="tel" defaultValue={user.phone} className="input" placeholder="01XXXXXXXXX" />
            </label>
            <div className="sm:col-span-2">
              <Button disabled={savingProfile}>{savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save profile</Button>
            </div>
          </form>
        </Card>

        <Card title="What you can do" action={<span className="text-xs text-slate-500">from your role · {user.role.name}</span>}>
          {full ? (
            <p className="flex items-center gap-2 p-5 text-sm text-slate-700">
              <ShieldCheck className="size-5 text-primary-600" /> You have <b>full access</b> to every part of the admin panel.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
                    <th className="px-5 py-2.5 text-left font-medium">Area</th>
                    {ACTIONS.map((a) => <th key={a} className="px-2 py-2.5 text-center font-medium">{ACTION_LABEL[a]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <FragmentRows key={g} group={g} permissions={user.permissions} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Your recent activity">
          {activity.length ? (
            <ol className="relative space-y-4 p-6 before:absolute before:top-7 before:bottom-7 before:left-[29px] before:w-px before:bg-slate-200">
              {activity.map((a) => (
                <li key={a.id} className="relative flex gap-4">
                  <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-primary-500 ring-4 ring-white" />
                  <div className="text-sm">
                    <p className="text-slate-700">You {a.action} <b className="font-medium text-slate-900">{a.target}</b></p>
                    <p className="text-xs text-slate-400">{timeAgo(a.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="p-6 text-sm text-slate-500">Changes you make in the admin will appear here.</p>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Change password">
          <div className="p-5">
            <ChangePasswordForm />
            <p className="mt-3 text-xs text-slate-500">Changing your password signs you out of every other device.</p>
          </div>
        </Card>
        <Card title="Security">
          <dl className="space-y-3 p-5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Last sign-in</dt><dd className="text-slate-900">{user.lastLoginAt ? timeAgo(user.lastLoginAt) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Total sign-ins</dt><dd className="text-slate-900">{user.loginCount ?? 0}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Account lock-out</dt><dd className="text-slate-900">after 5 wrong passwords</dd></div>
          </dl>
          <div className="border-t border-slate-100 p-5">
            <Button
              variant="secondary"
              className="w-full"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await signOutEverywhere();
                  toast(r.message ?? "Done");
                })
              }
            >
              <LogOut className="size-4" /> Sign out of all other devices
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FragmentRows({ group, permissions }: { group: string; permissions: string[] }) {
  const mods = MODULES.filter((m) => m.group === group);
  return (
    <>
      <tr className="bg-slate-50/70">
        <td colSpan={5} className="px-5 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{group}</td>
      </tr>
      {mods.map((m) => (
        <tr key={m.key} className="border-b border-slate-50">
          <td className="px-5 py-2 text-slate-700">{m.label}</td>
          {ACTIONS.map((a) => (
            <td key={a} className="px-2 py-2 text-center">
              {!m.actions.includes(a) ? (
                <span className="text-slate-200">·</span>
              ) : can(permissions, m.key, a) ? (
                <Check className="mx-auto size-4 text-emerald-600" aria-label="allowed" />
              ) : (
                <Minus className={cn("mx-auto size-4 text-slate-300")} aria-label="not allowed" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
