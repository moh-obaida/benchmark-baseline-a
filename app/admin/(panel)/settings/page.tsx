import { Notice } from "@/components/Notice";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { listMedia } from "@/lib/content";
import { getSettings } from "@/lib/settings";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <main>
      <h1>الإعدادات</h1>
      <Notice code={read(params.notice)} />
      <SettingsForm settings={getSettings()} media={listMedia()} />
    </main>
  );
}
