"use client";

import { useRouter } from "next/navigation";
import { StoryCard } from "@/components/site/StoryCard";
import { EmptyState } from "@/components/site/EmptyState";
import type { Author, Category, StoryCard as Story } from "@/lib/types";
import { arNumber } from "@/lib/utils";

type Query = Record<string, string | undefined>;

function hrefFor(base: string, current: Query, patch: Query) {
  const params = new URLSearchParams();
  const next = { ...current, ...patch };
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function Catalog({
  base,
  query,
  stories,
  total,
  page,
  pages,
  categories,
  authors,
  genres,
  ages,
  types,
  emptyTitle,
  showQuery = false,
}: {
  base: string;
  query: Query;
  stories: Story[];
  total: number;
  page: number;
  pages: number;
  categories: Category[];
  authors: Author[];
  genres: string[];
  ages: string[];
  types: string[];
  emptyTitle: string;
  showQuery?: boolean;
}) {
  const router = useRouter();
  return (
    <div>
      <form
        action={base}
        onChange={(event) => {
          const form = event.currentTarget;
          const data = new FormData(form);
          const next: Query = {};
          for (const [key, value] of data.entries()) {
            if (typeof value === "string" && value && key !== "q") next[key] = value;
          }
          if (showQuery && query.q) next.q = query.q;
          router.push(hrefFor(base, {}, next));
        }}
      >
        {showQuery && query.q ? <input type="hidden" name="q" value={query.q} /> : null}
        <div className="filters">
          <select name="category" defaultValue={query.category || ""} aria-label="التصنيف">
            <option value="">كل التصنيفات</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="genre" defaultValue={query.genre || ""} aria-label="الصنف">
            <option value="">كل الأصناف</option>
            {genres.map((genre) => (
              <option key={genre}>{genre}</option>
            ))}
          </select>
          <select name="age" defaultValue={query.age || ""} aria-label="العمر">
            <option value="">كل الأعمار</option>
            {ages.map((age) => (
              <option key={age}>{age}</option>
            ))}
          </select>
          <select name="type" defaultValue={query.type || ""} aria-label="نوع القصة">
            <option value="">كل الأنواع</option>
            {types.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <select name="author" defaultValue={query.author || ""} aria-label="المؤلف">
            <option value="">كل المؤلفين</option>
            {authors.map((author) => (
              <option key={author.id} value={author.slug}>
                {author.name}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={query.sort || "new"} aria-label="الترتيب">
            <option value="new">الأحدث</option>
            <option value="popular">الأكثر رواجًا</option>
            <option value="views">الأكثر مشاهدة</option>
            <option value="picks">اختيارات يراع</option>
          </select>
        </div>
      </form>
      <p className="help">{total ? `${arNumber(total)} قصة` : "لا توجد نتائج ضمن هذا الاختيار."}</p>
      {query.tag ? (
        <p>
          <a href={hrefFor(base, query, { tag: undefined, page: undefined })}>مسح الوسم</a>
        </p>
      ) : null}
      {stories.length === 0 ? (
        <EmptyState title={emptyTitle} body="جرّب كلمة أقصر أو تصنيفًا أوسع." href="/explore" label="تصفح كل القصص" />
      ) : (
        <div className="layout-grid">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
      {pages > 1 ? (
        <nav className="pager" aria-label="الصفحات">
          {page > 1 ? <a href={hrefFor(base, query, { page: String(page - 1) })}>السابق</a> : <span />}
          <span>
            {arNumber(page)} / {arNumber(pages)}
          </span>
          {page < pages ? <a href={hrefFor(base, query, { page: String(page + 1) })}>التالي</a> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
