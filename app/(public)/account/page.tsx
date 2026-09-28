import type { Metadata } from "next";
import { Notice } from "@/components/Notice";
import { AccountForms } from "@/components/site/AccountForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "حسابي", robots: { index: false, follow: false } };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const user = await getCurrentUser();
  const person = user && user.role !== "guest" ? user : null;
  return (
    <main className="page">
      <div className="container">
        <Notice code={notice} />
      </div>
      <AccountForms name={person?.name} email={person?.email} />
    </main>
  );
}
