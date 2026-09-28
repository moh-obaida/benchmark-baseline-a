"use client";

import { Tajawal } from "next/font/google";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "700"] });

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={tajawal.className} style={{ background: "#F7F4F1", color: "#2C272A", padding: 32 }}>
        <h1>تعذر فتح يراع.</h1>
        <button type="button" onClick={() => reset()}>
          حاول مرة أخرى
        </button>
      </body>
    </html>
  );
}
