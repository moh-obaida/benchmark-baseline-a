"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { AUTHOR_LAYOUT_TYPES, CATEGORY_LAYOUT_TYPES, LAYOUTS, SECTION_TYPES, STORY_LAYOUT_TYPES, sectionTypeLabel } from "@/lib/constants";
import { createSectionAction, moveSectionAction, reorderSectionsAction, updateSectionAction, type FormState } from "@/lib/actions";
import { ItemPicker } from "@/components/admin/ItemPicker";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { HomeSection, MediaItem } from "@/lib/types";

function localValue(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SectionSorter({ sections }: { sections: HomeSection[] }) {
  const router = useRouter();
  const [items, setItems] = useState(sections);
  const [pending, start] = useTransition();
  const [dragId, setDragId] = useState("");

  function persist(next: HomeSection[]) {
    setItems(next);
    start(async () => {
      await reorderSectionsAction(next.map((item) => item.id));
      router.refresh();
    });
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const next = items.filter((item) => item.id !== dragId);
    const index = next.findIndex((item) => item.id === targetId);
    const moved = items.find((item) => item.id === dragId);
    if (!moved || index < 0) return;
    next.splice(index, 0, moved);
    persist(next);
  }

  return (
    <div aria-busy={pending}>
      {items.map((section) => (
        <div className="section-row" key={section.id} onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(section.id)}>
          <button className="drag" type="button" draggable aria-label="إعادة ترتيب" onDragStart={() => setDragId(section.id)}>
            ≡
          </button>
          <a href={`/admin/homepage?id=${section.id}`}>
            {section.title}
            <small className="help"> — {sectionTypeLabel(section.type)} · {section.mode === "manual" ? "اختيار يدوي" : "تلقائي"}</small>
          </a>
          <span className="status">
            <i className={section.enabled ? "dot dot-on" : "dot"} />
            {section.enabled ? "ظاهر" : "مخفي"}
          </span>
          <form action={moveSectionAction}>
            <input type="hidden" name="id" value={section.id} />
            <input type="hidden" name="direction" value="up" />
            <button className="btn btn-secondary btn-small" type="submit">أعلى</button>
          </form>
          <form action={moveSectionAction}>
            <input type="hidden" name="id" value={section.id} />
            <input type="hidden" name="direction" value="down" />
            <button className="btn btn-secondary btn-small" type="submit">أسفل</button>
          </form>
        </div>
      ))}
    </div>
  );
}

export function SectionEditor({
  section,
  stories,
  categories,
  authors,
  media,
}: {
  section: HomeSection;
  stories: { id: string; label: string }[];
  categories: { id: string; label: string }[];
  authors: { id: string; label: string }[];
  media: MediaItem[];
}) {
  const [state, action] = useActionState(updateSectionAction, {} as FormState);
  const showLayout = STORY_LAYOUT_TYPES.has(section.type) || CATEGORY_LAYOUT_TYPES.has(section.type) || AUTHOR_LAYOUT_TYPES.has(section.type);
  const itemKind = section.type === "categories" ? "category" : section.type === "authors" ? "author" : "story";
  const pickerItems = itemKind === "category" ? categories : itemKind === "author" ? authors : stories;
  const selected = section.items.filter((item) => item.itemType === itemKind).sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.itemId);
  const copy = ["search", "banner", "announcement"].includes(section.type);
  return (
    <form action={action} className="panel" style={{ padding: 16, marginTop: 16 }}>
      <input type="hidden" name="id" value={section.id} />
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <p className="help">تعدّل النص والمحتوى والترتيب. الخط ولون الهوية ثابتان.</p>
      <label className="field">
        <span>عنوان القسم</span>
        <input name="title" defaultValue={section.title} />
      </label>
      <label className="field">
        <span>سطر توضيحي</span>
        <input name="subtitle" defaultValue={section.subtitle} />
      </label>
      <label className="check">
        <input type="checkbox" name="enabled" value="1" defaultChecked={section.enabled} />
        ظاهر في الصفحة
      </label>
      <label className="field">
        <span>طريقة المحتوى</span>
        <select name="mode" defaultValue={section.mode}>
          <option value="auto">تلقائي</option>
          <option value="manual">اختيار يدوي</option>
        </select>
      </label>
      <label className="field">
        <span>عدد العناصر</span>
        <input name="itemCount" type="number" min="1" max="12" defaultValue={section.itemCount} />
      </label>
      {showLayout ? (
        <label className="field">
          <span>شكل العرض</span>
          <select name="layout" defaultValue={section.layout}>
            {LAYOUTS.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="layout" value={section.layout} />
      )}
      <label className="field">
        <span>يبدأ</span>
        <input type="datetime-local" name="startsAt" defaultValue={localValue(section.startsAt)} />
      </label>
      <label className="field">
        <span>ينتهي</span>
        <input type="datetime-local" name="endsAt" defaultValue={localValue(section.endsAt)} />
      </label>
      {section.type === "hero" || section.type === "search" ? (
        <>
          <label className="field"><span>سطر صغير</span><input name="kicker" defaultValue={section.config.kicker || ""} /></label>
          <label className="field"><span>العنوان الكبير</span><input name="heading" defaultValue={section.config.heading || ""} /></label>
          <label className="field"><span>النص</span><textarea name="lede" defaultValue={section.config.lede || ""} /></label>
          <label className="field"><span>نص البحث</span><input name="placeholder" defaultValue={section.config.placeholder || ""} /></label>
          <label className="field"><span>نص الرابط</span><input name="buttonLabel" defaultValue={section.config.buttonLabel || ""} /></label>
          <label className="field"><span>رابط داخلي</span><input name="buttonHref" defaultValue={section.config.buttonHref || "/explore"} /></label>
        </>
      ) : null}
      {section.type === "announcement" || section.type === "banner" ? (
        <>
          <label className="field"><span>النص</span><textarea name="text" defaultValue={section.config.text || ""} /></label>
          <label className="field"><span>الرابط</span><input name="href" defaultValue={section.config.href || ""} /></label>
          <label className="field"><span>عبارة الرابط</span><input name="label" defaultValue={section.config.label || ""} /></label>
        </>
      ) : null}
      {section.type === "banner" ? (
        <MediaPicker name="imageId" label="صورة اللافتة" initialId={section.config.imageId} initialUrl={section.config.imageId ? `/media/${section.config.imageId}` : ""} library={media} />
      ) : null}
      {section.type === "collection" ? (
        <label className="field">
          <span>التصنيف</span>
          <select name="categoryId" defaultValue={section.config.categoryId || ""}>
            <option value="">اختر تصنيفًا</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {!copy ? (
        <ItemPicker
          label={section.mode === "manual" ? "القصص أو العناصر المختارة" : "تثبيت في البداية"}
          items={pickerItems}
          selected={selected}
        />
      ) : null}
      <SubmitButton>حفظ القسم</SubmitButton>
    </form>
  );
}

export function AddSection() {
  return (
    <form action={createSectionAction} className="inline-form" style={{ display: "flex", gap: 8, margin: "12px 0 18px" }}>
      <select name="type" aria-label="نوع القسم">
        {SECTION_TYPES.map((type) => (
          <option key={type.id} value={type.id}>
            {type.label}
          </option>
        ))}
      </select>
      <button className="btn" type="submit">
        إضافة قسم
      </button>
    </form>
  );
}
