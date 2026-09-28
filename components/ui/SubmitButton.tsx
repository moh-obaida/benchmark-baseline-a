"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, secondary = false }: { children: React.ReactNode; secondary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={secondary ? "btn btn-secondary" : "btn"} type="submit" disabled={pending}>
      {pending ? "جارٍ الحفظ…" : children}
    </button>
  );
}
