"use client";

import { useActionState } from "react";
import { saveCategoryAction, type FormState } from "@/lib/actions";
import { CATEGORY_ICONS } from "@/lib/constants";
import { PASTEL_PALETTE } from "@/lib/palette";
import { Icon } from "@/components/icons";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Category, MediaItem } from "@/lib/types";

export function CategoryForm({ category, media }: { category?: Category | null; media: MediaItem[] }) {
  const [state, action] = useActionState(saveCategoryAction, {} as FormState);
  const color = PASTEL_PALETTE.find((item) => item.hex === category?.color)?.id ?? "lavender";
  return (
    <form action={action}>
      {category?.id ? <input type="hidden" name="id" value={category.id} /> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <fieldset className="form-block">
        <legend>التصنيف</legend>
        <label className="field">
          <span>الاسم</span>
          <input name="name" defaultValue={category?.name ?? ""} required />
        </label>
        <label className="field">
          <span>الرابط</span>
          <input name="slug" defaultValue={category?.slug ?? ""} />
        </label>
        <label className="field">
          <span>الوصف</span>
          <textarea name="description" defaultValue={category?.description ?? ""} />
        </label>
        <label className="field">
          <span>الترتيب</span>
          <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} />
        </label>
      </fieldset>
      <fieldset className="form-block">
        <legend>المظهر</legend>
        <div className="field">
          <span>لون من اللوحة المعتمدة</span>
          <div className="swatches" role="radiogroup" aria-label="لون التصنيف">
            {PASTEL_PALETTE.map((item) => (
              <label className="swatch" key={item.id}>
                <input type="radio" name="color" value={item.id} defaultChecked={color === item.id} />
                <span style={{ background: item.hex }} />
                <span className="sr-only">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <span>الأيقونة</span>
          <div className="icon-choices">
            {CATEGORY_ICONS.map((item) => (
              <label key={item.id}>
                <input type="radio" name="icon" value={item.id} defaultChecked={(category?.icon || "feather") === item.id} />
                <span>
                  <Icon name={item.id} />
                </span>
                <span className="sr-only">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
        <MediaPicker name="imageId" label="صورة اختيارية" initialId={category?.imageId} initialUrl={category?.imageUrl} library={media} />
      </fieldset>
      <fieldset className="form-block">
        <legend>الظهور</legend>
        <label className="check">
          <input type="checkbox" name="published" value="1" defaultChecked={category ? category.published : true} />
          منشور
        </label>
        <label className="check">
          <input type="checkbox" name="showOnHome" value="1" defaultChecked={category ? category.showOnHome : true} />
          يظهر في الصفحة الرئيسية
        </label>
        <label className="check">
          <input type="checkbox" name="showInNav" value="1" defaultChecked={category ? category.showInNav : true} />
          يظهر في التصفح
        </label>
        <label className="check">
          <input type="checkbox" name="featured" value="1" defaultChecked={category?.featured ?? false} />
          تصنيف بارز
        </label>
      </fieldset>
      <SubmitButton>حفظ التصنيف</SubmitButton>
    </form>
  );
}
