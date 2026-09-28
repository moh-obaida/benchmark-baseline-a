"use client";

import { useMemo, useState } from "react";

export function ItemPicker({
  label,
  items,
  selected,
}: {
  label: string;
  items: { id: string; label: string }[];
  selected: string[];
}) {
  const [order, setOrder] = useState(selected);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = query.trim();
    return items.filter((item) => !term || item.label.includes(term)).slice(0, 30);
  }, [items, query]);

  function add(id: string) {
    setOrder((current) => (current.includes(id) ? current : [...current, id]));
  }
  function move(index: number, direction: -1 | 1) {
    setOrder((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  return (
    <div className="field">
      <span>{label}</span>
      {order.map((itemId) => (
        <input key={itemId} type="hidden" name="itemId" value={itemId} />
      ))}
      <div>
        {order.map((itemId, index) => {
          const item = items.find((entry) => entry.id === itemId);
          return (
            <div className="picker-row" key={itemId}>
              <span>{item?.label || "عنصر"}</span>
              <span>
                <button className="btn btn-secondary btn-small" type="button" onClick={() => move(index, -1)}>
                  أعلى
                </button>
                <button className="btn btn-secondary btn-small" type="button" onClick={() => move(index, 1)}>
                  أسفل
                </button>
                <button className="btn btn-danger btn-small" type="button" onClick={() => setOrder((current) => current.filter((id) => id !== itemId))}>
                  إزالة
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث للإضافة" aria-label={`بحث في ${label}`} />
      <div className="checks">
        {visible.map((item) => (
          <button className="btn btn-secondary btn-small" type="button" key={item.id} onClick={() => add(item.id)}>
            {order.includes(item.id) ? "مضاف — " : ""}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
