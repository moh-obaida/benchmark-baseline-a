import { CategoryForm } from "@/components/admin/CategoryForm";
import { listMedia } from "@/lib/content";

export default function NewCategoryPage() {
  return (
    <main>
      <h1>إضافة تصنيف</h1>
      <CategoryForm media={listMedia()} />
    </main>
  );
}
