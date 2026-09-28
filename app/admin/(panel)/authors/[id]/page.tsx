import { notFound } from "next/navigation";
import { AuthorForm } from "@/components/admin/AuthorForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { deleteAuthorAction } from "@/lib/actions";
import { getAuthorAdmin, listMedia } from "@/lib/content";

export default async function EditAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = getAuthorAdmin(id);
  if (!author) notFound();
  return (
    <main>
      <h1>تعديل المؤلف</h1>
      <AuthorForm author={author} media={listMedia()} />
      <div style={{ marginTop: 16 }}>
        <ConfirmSubmit action={deleteAuthorAction} id={author.id} label="حذف المؤلف" message="حذف هذا المؤلف؟ قصصه تبقى من غير اسم." />
      </div>
    </main>
  );
}
