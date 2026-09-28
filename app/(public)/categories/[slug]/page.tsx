import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalog } from "@/components/site/Catalog";
import { filterOptions, getCategoryBySlug, searchCatalog } from "@/lib/content";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "تصنيف" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  const sp = await searchParams;
  const query = {
    category: category.slug,
    genre: read(sp.genre),
    age: read(sp.age),
    type: read(sp.type),
    author: read(sp.author),
    sort: read(sp.sort) || "new",
    page: Number(read(sp.page) || 1),
  };
  const result = searchCatalog(query);
  const options = filterOptions();
  return (
    <main className="container page">
      <nav className="crumbs" aria-label="مسار التنقل">
        <ol>
          <li><a href="/">الرئيسية</a></li>
          <li><a href="/categories">التصنيفات</a></li>
          <li aria-current="page">{category.name}</li>
        </ol>
      </nav>
      <div className="page-head">
        <div>
          <h1>{category.name}</h1>
          {category.description ? <p>{category.description}</p> : null}
        </div>
      </div>
      <Catalog
        base={`/categories/${category.slug}`}
        query={{ ...query, page: String(query.page) }}
        stories={result.items}
        total={result.total}
        page={result.page}
        pages={result.pages}
        categories={options.categories}
        authors={options.authors}
        genres={options.genres}
        ages={options.ages}
        types={options.types}
        emptyTitle="لا توجد قصص هنا حتى الآن."
      />
    </main>
  );
}
