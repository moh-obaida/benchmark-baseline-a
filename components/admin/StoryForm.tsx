"use client";

import { useActionState } from "react";
import { saveStoryAction, type FormState } from "@/lib/actions";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Author, Category, MediaItem, StoryAdmin } from "@/lib/types";

const empty: StoryAdmin = {
  id: "",
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  authorName: "",
  authorSlug: "",
  authorId: "",
  coverUrl: "",
  coverAlt: "",
  coverId: "",
  categoryName: "",
  categorySlug: "",
  categoryColor: "#EEDCEE",
  readingMinutes: null,
  ageRange: "",
  genre: "",
  storyType: "",
  featured: false,
  editorPick: false,
  publishAt: "",
  viewCount: 0,
  favoriteCount: 0,
  popularity: 0,
  displayOrder: 0,
  narrator: "",
  seriesName: "",
  episodeNumber: "",
  externalSource: "",
  audioUrl: "",
  videoUrl: "",
  tags: [],
  categories: [],
  gallery: [],
  published: false,
  adminNotes: "",
  primaryCategoryId: "",
  relatedIds: [],
  categoryIds: [],
  galleryIds: [],
  tagText: "",
  isDemo: false,
};

function localValue(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function StoryForm({
  story,
  authors,
  categories,
  stories,
  media,
}: {
  story?: StoryAdmin | null;
  authors: Author[];
  categories: Category[];
  stories: { id: string; label: string }[];
  media: MediaItem[];
}) {
  const current = story ?? empty;
  const [state, action] = useActionState(saveStoryAction, {} as FormState);
  return (
    <form action={action}>
      {current.id ? <input type="hidden" name="id" value={current.id} /> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <fieldset className="form-block">
        <legend>المعلومات الأساسية</legend>
        <label className="field">
          <span>العنوان</span>
          <input name="title" defaultValue={current.title} required />
        </label>
        <label className="field">
          <span>الرابط</span>
          <input name="slug" defaultValue={current.slug} placeholder="يُولَّد من العنوان إن تُرك فارغًا" />
        </label>
        <label className="field">
          <span>نوع القصة</span>
          <input name="storyType" defaultValue={current.storyType} list="story-types" />
        </label>
        <datalist id="story-types">
          <option value="قصة قصيرة" />
          <option value="رواية" />
          <option value="قصة قبل النوم" />
          <option value="قصة تعليمية" />
          <option value="مغامرة" />
        </datalist>
      </fieldset>
      <fieldset className="form-block">
        <legend>الوسائط</legend>
        <MediaPicker label="الغلاف" initialId={current.coverId} initialUrl={current.coverUrl} library={media} />
        <div className="field">
          <span>صور إضافية</span>
          <div className="checks">
            {media.map((item) => (
              <label className="check" key={item.id}>
                <input type="checkbox" name="galleryIds" value={item.id} defaultChecked={current.galleryIds.includes(item.id)} />
                {item.alt || item.originalName}
              </label>
            ))}
          </div>
        </div>
        <label className="field">
          <span>رابط صوت</span>
          <input className="latin" name="audioUrl" defaultValue={current.audioUrl} />
        </label>
        <label className="field">
          <span>رابط فيديو</span>
          <input className="latin" name="videoUrl" defaultValue={current.videoUrl} />
        </label>
      </fieldset>
      <fieldset className="form-block">
        <legend>المؤلف</legend>
        <label className="field">
          <span>المؤلف</span>
          <select name="authorId" defaultValue={current.authorId}>
            <option value="">من دون مؤلف</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>الراوي</span>
          <input name="narrator" defaultValue={current.narrator} />
        </label>
      </fieldset>
      <fieldset className="form-block">
        <legend>التصنيف</legend>
        <label className="field">
          <span>التصنيف الأساسي</span>
          <select name="primaryCategoryId" defaultValue={current.primaryCategoryId}>
            <option value="">غير محدد</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <div className="checks">
          {categories.map((category) => (
            <label className="check" key={category.id}>
              <input type="checkbox" name="categoryIds" value={category.id} defaultChecked={current.categoryIds.includes(category.id)} />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="form-block">
        <legend>الوسوم</legend>
        <label className="field">
          <span>وسوم مفصولة بفاصلة</span>
          <input name="tags" defaultValue={current.tagText} />
        </label>
      </fieldset>
      <fieldset className="form-block">
        <legend>الوصف</legend>
        <label className="field">
          <span>وصف قصير</span>
          <textarea name="shortDescription" defaultValue={current.shortDescription} />
        </label>
        <label className="field">
          <span>الوصف الكامل</span>
          <textarea name="fullDescription" defaultValue={current.fullDescription} style={{ minHeight: 220 }} />
        </label>
      </fieldset>
      <fieldset className="form-block">
        <legend>الاكتشاف</legend>
        <label className="field">
          <span>العمر</span>
          <input name="ageRange" defaultValue={current.ageRange} list="ages" />
        </label>
        <datalist id="ages">
          <option value="٣–٥" />
          <option value="٦–٨" />
          <option value="٩–١٢" />
          <option value="١٣+" />
          <option value="للكبار" />
        </datalist>
        <label className="field">
          <span>الصنف</span>
          <input name="genre" defaultValue={current.genre} />
        </label>
        <label className="field">
          <span>وقت القراءة بالدقائق</span>
          <input name="readingMinutes" type="number" min="1" defaultValue={current.readingMinutes ?? ""} />
        </label>
        <label className="field">
          <span>أولوية الرواج</span>
          <input name="popularity" type="number" min="0" defaultValue={current.popularity} />
        </label>
        <p className="help">رقم يرفعه المسؤول. المشاهدات والحفظ تُحسب معه، من غير ادعاء ذكاء اصطناعي.</p>
      </fieldset>
      <fieldset className="form-block">
        <legend>العرض</legend>
        <label className="field">
          <span>ترتيب الظهور</span>
          <input name="displayOrder" type="number" min="0" defaultValue={current.displayOrder} />
        </label>
        <label className="check">
          <input type="checkbox" name="featured" value="1" defaultChecked={current.featured} />
          قصة مميزة
        </label>
        <label className="check">
          <input type="checkbox" name="editorPick" value="1" defaultChecked={current.editorPick} />
          من اختيارات يراع
        </label>
        <label className="field">
          <span>السلسلة</span>
          <input name="seriesName" defaultValue={current.seriesName} />
        </label>
        <label className="field">
          <span>رقم الجزء</span>
          <input name="episodeNumber" defaultValue={current.episodeNumber} />
        </label>
      </fieldset>
      <fieldset className="form-block">
        <legend>محتوى مرتبط</legend>
        <div className="checks">
          {stories
            .filter((item) => item.id !== current.id)
            .map((item) => (
              <label className="check" key={item.id}>
                <input type="checkbox" name="relatedIds" value={item.id} defaultChecked={current.relatedIds.includes(item.id)} />
                {item.label}
              </label>
            ))}
        </div>
        <label className="field">
          <span>مصدر خارجي</span>
          <input name="externalSource" defaultValue={current.externalSource} />
        </label>
      </fieldset>
      <fieldset className="form-block">
        <legend>النشر</legend>
        <label className="check">
          <input type="checkbox" name="published" value="1" defaultChecked={current.published} />
          ظاهرة للزوار
        </label>
        <label className="field">
          <span>تاريخ النشر</span>
          <input name="publishAt" type="datetime-local" defaultValue={localValue(current.publishAt)} />
        </label>
        <label className="field">
          <span>ملاحظات داخلية</span>
          <textarea name="adminNotes" defaultValue={current.adminNotes} />
        </label>
        <p className="help">الملاحظات لا تظهر في الموقع العام.</p>
      </fieldset>
      <SubmitButton>حفظ القصة</SubmitButton>
    </form>
  );
}
