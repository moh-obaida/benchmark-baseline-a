import { AuthorForm } from "@/components/admin/AuthorForm";
import { listMedia } from "@/lib/content";

export default function NewAuthorPage() {
  return (
    <main>
      <h1>إضافة مؤلف</h1>
      <AuthorForm media={listMedia()} />
    </main>
  );
}
