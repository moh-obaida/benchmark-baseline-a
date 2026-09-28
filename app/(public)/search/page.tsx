import type { Metadata } from "next";
import { Catalog } from "@/components/site/Catalog";
import { SearchBox } from "@/components/site/SearchBox";
import { filterOptions, listCategories, searchCatalog } from "@/lib/content";

export const metadata: Metadata = { title: "البحث", robots: { index: false, follow: false } };

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = read(params.q).trim();
  const query = {
    q,
    category: read(params.category),
    genre: read(params.genre),
    age: read(params.age),
    type: read(params.type),
    author: read(params.author),
    tag: read(params.tag),
    sort: read(params.sort) || "new",
    page: Number(read(params.page) || 1),
  };
  const options = filterOptions();
  const result = q ? searchCatalog(query) : null;
  const categories = listCategories("public");
  return (
    <main className="container page">
      <h1>البحث</h1>
      <SearchBox placeholder="ابحث عن قصة أو مؤلف أو تصنيف" initial={q} />
      {q ? (
        <a href="/search">مسح البحث</a>
      ) : (
        <div>
          <p>ابحث بالعنوان أو المؤلف أو التصنيف أو الوسم.</p>
          <div className="cat-grid">
            {categories.slice(0, 6).map((category) => (
              <a key={category.id} className="cat-tile" href={`/categories/${category.slug}`} style={{ background: category.color }}>
                <h2>{category.name}</h2>
              </a>
            ))}
          </div>
        </div>
      )}
      {result ? (
        <Catalog
          base="/search"
          showQuery
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
          emptyTitle="ما لقينا قصة تطابق بحثك."
        />
      ) : null}
    </main>
  );
}
