import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { AccountForms } from "@/components/admin/AccountForms";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await requireUser();
  const db = await getDb();
  const activity = db.activity.filter((a) => a.userName === me.name).slice(0, 12);
  return (
    <>
      <PageHeader title="My account" description="Your profile, password and recent activity." />
      <AccountForms user={me} activity={activity} />
    </>
  );
}
