"use client";

export function ConfirmSubmit({
  action,
  id,
  label,
  message,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  message: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-danger" type="submit">
        {label}
      </button>
    </form>
  );
}
