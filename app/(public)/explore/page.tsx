import type { Metadata } from "next";
import { Catalog } from "@/components/site/Catalog";
import { filterOptions, searchCatalog } from "@/lib/content";

export const metadata: Metadata = { title: "استكشف" };

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = {
    category: read(params.category),
    genre: read(params.genre),
    age: read(params.age),
    type: read(params.type),
    author: read(params.author),
    tag: read(params.tag),
    sort: read(params.sort) || "new",
    page: Number(read(params.page) || 1),
  };
  const [result, options] = [searchCatalog(query), filterOptions()];
  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <h1>استكشف</h1>
          <p>تصفح القصص، ثم ضيّق الاختيار بهدوء.</p>
        </div>
      </div>
      <Catalog
        base="/explore"
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
