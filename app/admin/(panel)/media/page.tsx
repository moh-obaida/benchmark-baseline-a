import { Notice } from "@/components/Notice";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { deleteMediaAction } from "@/lib/actions";
import { listMedia } from "@/lib/content";
import { arNumber } from "@/lib/utils";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const media = listMedia();
  return (
    <main>
      <h1>الوسائط</h1>
      <p className="help">الصور تُحفظ على الخادم وتبقى بعد تحديث الصفحة.</p>
      <Notice code={read(params.notice)} />
      <MediaUploader />
      <div className="media-grid">
        {media.map((item) => (
          <article className="media-card" key={item.id}>
            <img src={item.url} alt={item.alt || "ملف وسائط"} />
            <p>{item.originalName}</p>
            <p className="help">
              {item.width}×{item.height} · {arNumber(Math.round(item.size / 1024))} ك.ب
            </p>
            <ConfirmSubmit action={deleteMediaAction} id={item.id} label="حذف" message="حذف هذا الملف؟" />
          </article>
        ))}
      </div>
    </main>
  );
}
