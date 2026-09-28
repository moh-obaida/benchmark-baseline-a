import { Notice } from "@/components/Notice";
import { listAdminStories } from "@/lib/content";
import { arNumber } from "@/lib/utils";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function StoriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = read(params.q);
  const status = read(params.status) || "all";
  const stories = listAdminStories(q, status);
  return (
    <main>
      <div className="split">
        <h1>القصص</h1>
        <a className="btn" href="/admin/stories/new">إضافة قصة</a>
      </div>
      <Notice code={read(params.notice)} />
      <form className="inline-form" action="/admin/stories" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input name="q" defaultValue={q} placeholder="ابحث في القصص" aria-label="بحث في القصص" />
        <input type="hidden" name="status" value={status} />
        <button className="btn btn-secondary" type="submit">بحث</button>
      </form>
      <p>
        <a href="/admin/stories">الكل</a> · <a href="/admin/stories?status=published">منشورة</a> · <a href="/admin/stories?status=draft">مسودات</a> · <a href="/admin/stories?status=featured">مميزة</a>
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>القصة</th>
              <th>المؤلف</th>
              <th>التصنيف</th>
              <th>الحالة</th>
              <th>المشاهدات</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story) => (
              <tr key={story.id}>
                <td>{story.title}</td>
                <td>{story.authorName || "—"}</td>
                <td>{story.categoryName || "—"}</td>
                <td>
                  <span className="status">
                    <i className={story.published ? "dot dot-on" : "dot"} />
                    {story.published ? "منشورة" : "مسودة"}
                    {story.featured ? " · مميزة" : ""}
                    {story.editorPick ? " · اختيار يراع" : ""}
                  </span>
                </td>
                <td>{arNumber(story.viewCount)}</td>
                <td><a href={`/admin/stories/${story.id}`}>تعديل</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stories.length === 0 ? <p>لا توجد قصص مطابقة.</p> : null}
    </main>
  );
}
