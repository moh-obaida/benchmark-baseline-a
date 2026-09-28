import { StoryForm } from "@/components/admin/StoryForm";
import { listAuthors, listCategories, listMedia, listPickerStories } from "@/lib/content";

export default function NewStoryPage() {
  return (
    <main>
      <h1>إضافة قصة</h1>
      <StoryForm authors={listAuthors(true)} categories={listCategories("all")} stories={listPickerStories()} media={listMedia()} />
    </main>
  );
}
