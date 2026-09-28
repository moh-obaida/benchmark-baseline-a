export function EmptyState({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
      {href && label ? (
        <a className="btn" href={href}>
          {label}
        </a>
      ) : null}
    </div>
  );
}
