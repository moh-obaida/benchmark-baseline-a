import { Notice } from "@/components/Notice";
import { listAuthors } from "@/lib/content";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function AuthorsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const authors = listAuthors(true);
  return (
    <main>
      <div className="split">
        <h1>المؤلفون</h1>
        <a className="btn" href="/admin/authors/new">إضافة مؤلف</a>
      </div>
      <Notice code={read(params.notice)} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>القصص</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {authors.map((author) => (
              <tr key={author.id}>
                <td>{author.name}</td>
                <td>{author.storyCount}</td>
                <td>{author.featured ? "بارز" : "عادي"}</td>
                <td><a href={`/admin/authors/${author.id}`}>تعديل</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
