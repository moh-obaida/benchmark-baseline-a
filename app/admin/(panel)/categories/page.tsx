import { Notice } from "@/components/Notice";
import { moveCategoryAction } from "@/lib/actions";
import { listCategories } from "@/lib/content";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function CategoriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const categories = listCategories("all");
  return (
    <main>
      <div className="split">
        <h1>التصنيفات</h1>
        <a className="btn" href="/admin/categories/new">إضافة تصنيف</a>
      </div>
      <Notice code={read(params.notice)} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>التصنيف</th>
              <th>الظهور</th>
              <th>الترتيب</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  <span className="status">
                    <i style={{ background: category.color }} className="dot" />
                    {category.name}
                  </span>
                </td>
                <td>
                  {category.published ? "منشور" : "مخفي"}
                  {category.showOnHome ? " · الرئيسية" : ""}
                  {category.showInNav ? " · التصفح" : ""}
                </td>
                <td>
                  <form action={moveCategoryAction} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button className="btn btn-secondary btn-small" type="submit">أعلى</button>
                  </form>
                  <form action={moveCategoryAction} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button className="btn btn-secondary btn-small" type="submit">أسفل</button>
                  </form>
                </td>
                <td><a href={`/admin/categories/${category.id}`}>تعديل</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
