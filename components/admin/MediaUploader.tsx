"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MediaUploader() {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  function upload(file: File) {
    setError("");
    setProgress(0);
    const data = new FormData();
    data.set("file", file);
    data.set("alt", file.name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      const body = JSON.parse(xhr.responseText || "{}") as { error?: string };
      if (xhr.status >= 400) {
        setError(body.error || "تعذر رفع الصورة.");
        return;
      }
      router.refresh();
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("تعذر الاتصال أثناء الرفع.");
    };
    xhr.send(data);
  }

  return (
    <div className="field">
      <span>رفع صورة</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="رفع صورة"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <p className="help">JPG أو PNG أو WEBP، حتى ٥ ميغابايت، وأقصر ضلع لا يقل عن ٢٠٠.</p>
      {progress !== null ? (
        <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
