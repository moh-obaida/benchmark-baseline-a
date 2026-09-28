import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { deleteCategoryAction } from "@/lib/actions";
import { getCategoryAdmin, listMedia } from "@/lib/content";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = getCategoryAdmin(id);
  if (!category) notFound();
  return (
    <main>
      <h1>تعديل التصنيف</h1>
      <CategoryForm category={category} media={listMedia()} />
      <div style={{ marginTop: 16 }}>
        <ConfirmSubmit action={deleteCategoryAction} id={category.id} label="حذف التصنيف" message="حذف هذا التصنيف؟ القصص تبقى، ويُزال ربطها به." />
      </div>
    </main>
  );
}
