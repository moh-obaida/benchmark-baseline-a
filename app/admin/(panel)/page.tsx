import { Notice } from "@/components/Notice";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { deleteDemoAction } from "@/lib/actions";
import { dashboardStats } from "@/lib/content";
import { arNumber, formatDate } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const stats = dashboardStats();
  const cards = [
    ["القصص", stats.stories],
    ["المنشورة", stats.published],
    ["المسودات", stats.drafts],
    ["التصنيفات", stats.categories],
    ["المؤلفون", stats.authors],
    ["المشاهدات", stats.views],
    ["الحفظ", stats.favorites],
    ["المميزة", stats.featured],
  ];
  return (
    <main>
      <h1>لوحة التحكم</h1>
      <p className="help">من هنا تدير ما يراه الزائر: القصص، التصنيفات، والترتيب.</p>
      <Notice code={notice} />
      <div className="stat-grid">
        {cards.map(([label, value]) => (
          <article className="stat" key={label}>
            <span>{label}</span>
            <b>{arNumber(Number(value))}</b>
          </article>
        ))}
      </div>
      <div className="quick-grid">
        <a href="/admin/stories/new"><span>إضافة</span><strong> قصة</strong></a>
        <a href="/admin/categories/new"><span>إضافة</span><strong> تصنيف</strong></a>
        <a href="/admin/authors/new"><span>إضافة</span><strong> مؤلف</strong></a>
        <a href="/admin/homepage"><span>تعديل</span><strong> الصفحة الرئيسية</strong></a>
      </div>
      <section className="panel" style={{ padding: 16 }}>
        <h2>آخر النشاط</h2>
        {stats.activity.length === 0 ? <p>لا يوجد نشاط بعد.</p> : (
          <ul>
            {stats.activity.map((item) => (
              <li key={item.id}>
                {item.message} <span className="help">{formatDate(item.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {stats.demo > 0 ? (
        <div style={{ marginTop: 16 }}>
          <p className="help">المحتوى التجريبي يمكن حذفه. ما عدّلته يبقى.</p>
          <ConfirmSubmit action={deleteDemoAction} id="demo" label="حذف المحتوى التجريبي" message="حذف القصص والتصنيفات والمؤلفين التجريبية التي لم تُعدَّل؟" />
        </div>
      ) : null}
    </main>
  );
}
