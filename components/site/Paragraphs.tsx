export function Paragraphs({ text }: { text: string }) {
  const parts = text
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <div className="prose">
      {parts.map((part) => (
        <p key={part}>{part}</p>
      ))}
    </div>
  );
}
