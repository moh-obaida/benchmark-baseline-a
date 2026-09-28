"use client";

import { useEffect, useId, useState } from "react";

type Suggestion = { slug: string; title: string; authorName: string };

export function SearchBox({ placeholder, initial = "", labelledBy }: { placeholder: string; initial?: string; labelledBy?: string }) {
  const reactId = useId();
  const inputId = labelledBy ? undefined : `search-${reactId}`;
  const [value, setValue] = useState(initial);
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setItems([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) return;
      const data = (await response.json()) as { results?: Suggestion[] };
      setItems(data.results ?? []);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <form className="search-form" action="/search" role="search">
      <label className="sr-only" htmlFor={inputId}>
        ابحث
      </label>
      <input
        id={inputId}
        name="q"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-labelledby={labelledBy}
        enterKeyHint="search"
        autoComplete="off"
        onChange={(event) => setValue(event.target.value)}
      />
      <button className="btn" type="submit">
        ابحث
      </button>
      {items.length > 0 ? (
        <ul className="suggest" role="listbox">
          {items.map((item) => (
            <li key={item.slug}>
              <a href={`/stories/${item.slug}`}>
                {item.title}
                {item.authorName ? <small> — {item.authorName}</small> : null}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
