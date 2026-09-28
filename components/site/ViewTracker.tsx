"use client";

import { useEffect } from "react";
import { recordViewAction } from "@/lib/actions";

export function ViewTracker({ storyId }: { storyId: string }) {
  useEffect(() => {
    void recordViewAction(storyId);
  }, [storyId]);
  return null;
}
