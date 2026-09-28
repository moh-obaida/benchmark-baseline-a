"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container page">
      <h1>حدث خلل غير متوقع.</h1>
      <p>يمكنك المحاولة مرة أخرى.</p>
      <button className="btn" type="button" onClick={() => reset()}>
        حاول مرة أخرى
      </button>
    </main>
  );
}
