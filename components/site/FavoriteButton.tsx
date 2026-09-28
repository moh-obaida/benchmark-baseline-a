"use client";

import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/lib/actions";

export function FavoriteButton({ storyId, initial }: { storyId: string; initial: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      className={saved ? "btn btn-quiet" : "btn btn-secondary"}
      type="button"
      aria-pressed={saved}
      disabled={pending}
      onClick={() => {
        const next = !saved;
        setSaved(next);
        start(async () => {
          const result = await toggleFavoriteAction(storyId);
          setSaved(result.saved);
        });
      }}
    >
      {saved ? "إزالة من المفضلة" : "حفظ القصة"}
    </button>
  );
}
