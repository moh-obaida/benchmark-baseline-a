"use client";

import { useState } from "react";
import type { MediaItem } from "@/lib/types";

export function MediaPicker({
  name = "coverId",
  label,
  initialId = "",
  initialUrl = "",
  library,
}: {
  name?: string;
  label: string;
  initialId?: string;
  initialUrl?: string;
  library: MediaItem[];
}) {
  const [mediaId, setMediaId] = useState(initialId);
  const [url, setUrl] = useState(initialUrl);
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
      const body = JSON.parse(xhr.responseText || "{}") as { id?: string; url?: string; error?: string };
      if (xhr.status >= 400 || !body.id) {
        setError(body.error || "تعذر رفع الصورة.");
        return;
      }
      setMediaId(body.id);
      setUrl(body.url || `/media/${body.id}`);
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("تعذر الاتصال أثناء الرفع.");
    };
    xhr.send(data);
  }

  return (
    <div className="field">
      <span>{label}</span>
      <input type="hidden" name={name} value={mediaId} />
      {url ? <img src={url} alt="" style={{ width: 140, borderRadius: 12, marginBottom: 8 }} /> : null}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <p className="help">JPG أو PNG أو WEBP، حتى ٥ ميغابايت.</p>
      {progress !== null ? (
        <div className="progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} role="progressbar">
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      {mediaId ? (
        <button
          className="btn btn-secondary btn-small"
          type="button"
          onClick={() => {
            setMediaId("");
            setUrl("");
          }}
        >
          إزالة الصورة
        </button>
      ) : null}
      {library.length > 0 ? (
        <details>
          <summary>اختيار من المكتبة</summary>
          <div className="media-grid" style={{ marginTop: 8 }}>
            {library.slice(0, 12).map((item) => (
              <button
                key={item.id}
                type="button"
                className="media-card"
                onClick={() => {
                  setMediaId(item.id);
                  setUrl(item.url);
                }}
              >
                <img src={item.url} alt={item.alt || "صورة محفوظة"} />
              </button>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
