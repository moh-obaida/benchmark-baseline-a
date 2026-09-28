import { notFound } from "next/navigation";
import { StoryForm } from "@/components/admin/StoryForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { deleteStoryAction } from "@/lib/actions";
import { getStoryAdmin, listAuthors, listCategories, listMedia, listPickerStories } from "@/lib/content";

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = getStoryAdmin(id);
  if (!story) notFound();
  return (
    <main>
      <div className="split">
        <h1>تعديل القصة</h1>
        {story.published ? <a href={`/stories/${story.slug}`}>عرض</a> : null}
      </div>
      <StoryForm story={story} authors={listAuthors(true)} categories={listCategories("all")} stories={listPickerStories()} media={listMedia()} />
      <div style={{ marginTop: 16 }}>
        <ConfirmSubmit action={deleteStoryAction} id={story.id} label="حذف القصة" message="حذف هذه القصة؟" />
      </div>
    </main>
  );
}
