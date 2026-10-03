import type { Metadata } from "next";
import Image from "next/image";
import Img from "@/components/Img";
import { getDb } from "@/lib/db";
import { SEED_IMAGES } from "@/lib/seed";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  const { settings } = await getDb();
  const usingDefaults = !process.env.ADMIN_PASSWORD;

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <Img src={SEED_IMAGES.livingRoom} alt="" fill sizes="50vw" preload className="object-cover opacity-60" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-900/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-xs tracking-[0.3em] text-amber-200 uppercase">{settings.siteName} · {settings.tagline}</p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold">Manage products, content and leads from one place.</h2>
          <p className="mt-3 max-w-md text-sm text-slate-300">Every change you publish here goes live on the website instantly.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Image src="/brand/udh-logo.png" alt={settings.siteName} width={88} height={88} preload className="mb-6 rounded-full shadow-lg ring-4 ring-[#760308]/10" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to the {settings.siteName} admin console.</p>
          </div>
          <LoginForm next={typeof next === "string" ? next : ""} />
          {usingDefaults && (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Demo login: <b>admin@tilora.com</b> / <b>admin123</b>. Set <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> and{" "}
              <code>SESSION_SECRET</code> in <code>.env.local</code> before going live.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
