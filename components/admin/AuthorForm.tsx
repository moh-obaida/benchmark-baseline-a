"use client";

import { useActionState } from "react";
import { saveAuthorAction, type FormState } from "@/lib/actions";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Author, MediaItem } from "@/lib/types";

export function AuthorForm({ author, media }: { author?: Author | null; media: MediaItem[] }) {
  const [state, action] = useActionState(saveAuthorAction, {} as FormState);
  return (
    <form action={action}>
      {author?.id ? <input type="hidden" name="id" value={author.id} /> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <fieldset className="form-block">
        <legend>المؤلف</legend>
        <label className="field">
          <span>الاسم</span>
          <input name="name" defaultValue={author?.name ?? ""} required />
        </label>
        <label className="field">
          <span>الرابط</span>
          <input name="slug" defaultValue={author?.slug ?? ""} />
        </label>
        <label className="field">
          <span>نبذة</span>
          <textarea name="bio" defaultValue={author?.bio ?? ""} />
        </label>
        <label className="check">
          <input type="checkbox" name="featured" value="1" defaultChecked={author?.featured ?? false} />
          مؤلف بارز
        </label>
      </fieldset>
      <fieldset className="form-block">
        <legend>الصورة</legend>
        <MediaPicker name="imageId" label="صورة المؤلف" initialId={author?.imageId} initialUrl={author?.imageUrl} library={media} />
      </fieldset>
      <SubmitButton>حفظ المؤلف</SubmitButton>
    </form>
  );
}
