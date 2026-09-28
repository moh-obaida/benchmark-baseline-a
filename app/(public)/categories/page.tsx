import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/site/EmptyState";
import { listCategories } from "@/lib/content";

export const metadata: Metadata = { title: "التصنيفات" };

export default function CategoriesPage() {
  const categories = listCategories("public");
  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <h1>التصنيفات</h1>
          <p>اختر جو القصة، ثم ادخل.</p>
        </div>
      </div>
      {categories.length === 0 ? (
        <EmptyState title="لا توجد تصنيفات ظاهرة الآن." href="/explore" label="استكشف القصص" />
      ) : (
        <div className="cat-grid">
          {categories.map((category) => (
            <a key={category.id} className="cat-tile" href={`/categories/${category.slug}`} style={{ background: category.color }}>
              <span className="icon-badge">
                <Icon name={category.icon} />
              </span>
              <h2>{category.name}</h2>
              {category.description ? <p>{category.description}</p> : null}
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
