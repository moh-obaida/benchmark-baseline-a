import { Notice } from "@/components/Notice";
import { AddSection, SectionEditor, SectionSorter } from "@/components/admin/SectionTools";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { deleteSectionAction } from "@/lib/actions";
import { listAuthors, listCategories, listMedia, listPickerStories } from "@/lib/content";
import { listHomeSections } from "@/lib/home";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function HomepageAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sections = listHomeSections();
  const selected = sections.find((section) => section.id === read(params.id)) ?? sections[0];
  const stories = listPickerStories();
  const categories = listCategories("all").map((category) => ({ id: category.id, label: category.name }));
  const authors = listAuthors(true).map((author) => ({ id: author.id, label: author.name }));
  return (
    <main>
      <h1>إدارة الصفحة الرئيسية</h1>
      <p className="help">رتّب الأقسام، أخفِ ما لا تريده، واختر المحتوى. لا يمكن تغيير خط تاجوال أو اللون #EEDCEE أو حقن تنسيق حر.</p>
      <Notice code={read(params.notice)} />
      <AddSection />
      <SectionSorter sections={sections} />
      {selected ? (
        <>
          <SectionEditor section={selected} stories={stories} categories={categories} authors={authors} media={listMedia()} />
          <div style={{ marginTop: 12 }}>
            <ConfirmSubmit action={deleteSectionAction} id={selected.id} label="حذف هذا القسم" message="حذف هذا القسم من الصفحة الرئيسية؟" />
          </div>
        </>
      ) : null}
      <p className="help">التذييل يُدار من الإعدادات حتى تبقى بنية الموقع ثابتة.</p>
    </main>
  );
}
