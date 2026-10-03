"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { login, type FormState } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.message && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.message}</p>}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
        <input name="email" type="email" required autoComplete="email" autoFocus className="input" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="input pr-10" />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </span>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="remember" className="size-4 rounded accent-primary-600" /> Keep me signed in for 30 days
      </label>
      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
        Sign in
      </button>
    </form>
  );
}
