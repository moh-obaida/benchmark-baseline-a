"use client";

import { useActionState } from "react";
import { changePasswordAction, saveSettingsAction, type FormState } from "@/lib/actions";
import { BRAND_COLOR, BRAND_FONT, PASTEL_PALETTE } from "@/lib/palette";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { MediaItem, SiteSettings } from "@/lib/types";

export function SettingsForm({ settings, media }: { settings: SiteSettings; media: MediaItem[] }) {
  const [state, action] = useActionState(saveSettingsAction, {} as FormState);
  const [passwordState, passwordAction] = useActionState(changePasswordAction, {} as FormState);
  return (
    <div>
      <form action={action}>
        {state.error ? <p className="form-error">{state.error}</p> : null}
        <fieldset className="form-block">
          <legend>عام</legend>
          <label className="field"><span>اسم الموقع</span><input name="siteName" defaultValue={settings.siteName} /></label>
          <label className="field"><span>الوصف</span><textarea name="description" defaultValue={settings.description} /></label>
          <label className="field"><span>البريد</span><input className="latin" name="contactEmail" defaultValue={settings.contactEmail} /></label>
          <MediaPicker name="logoId" label="الشعار" initialId={settings.logoId} initialUrl={settings.logoUrl} library={media} />
        </fieldset>
        <fieldset className="form-block">
          <legend>الهوية</legend>
          <div className="locked"><span>اللون الأساسي</span><b>{BRAND_COLOR}</b></div>
          <div className="locked"><span>الخط</span><b>{BRAND_FONT}</b></div>
          <div className="swatches" aria-hidden="true">
            {PASTEL_PALETTE.map((color) => (
              <span key={color.id} style={{ background: color.hex, width: 36, height: 36, borderRadius: 10, display: "inline-block" }} />
            ))}
          </div>
          <p className="help">هذه الأسس مقفلة حتى تبقى يراع كما هي. يمكنك اختيار ألوان اللوحة داخل التصنيفات فقط.</p>
          <label className="field">
            <span>كثافة المحتوى</span>
            <select name="density" defaultValue={settings.density}>
              <option value="comfortable">مريحة</option>
              <option value="compact">أقرب</option>
            </select>
          </label>
        </fieldset>
        <fieldset className="form-block">
          <legend>المحتوى</legend>
          <label className="field"><span>عدد القصص الافتراضي في القسم</span><input name="defaultStoryCount" type="number" min="4" max="12" defaultValue={settings.defaultStoryCount} /></label>
          <label className="field"><span>عدد القصص في صفحة الاستكشاف</span><input name="pageSize" type="number" min="4" max="24" defaultValue={settings.pageSize} /></label>
        </fieldset>
        <fieldset className="form-block">
          <legend>الاكتشاف</legend>
          <p className="help">هذه أوزان الترتيب. يمكن لاحقًا استبدالها بنموذج أذكى من غير تغيير الأقسام.</p>
          {[
            ["categoryWeight", "وزن التصنيف", settings.discovery.categoryWeight],
            ["tagWeight", "وزن الوسوم", settings.discovery.tagWeight],
            ["authorWeight", "وزن المؤلف", settings.discovery.authorWeight],
            ["genreWeight", "وزن الصنف", settings.discovery.genreWeight],
            ["viewWeight", "وزن المشاهدات", settings.discovery.viewWeight],
            ["favoriteWeight", "وزن الحفظ", settings.discovery.favoriteWeight],
            ["manualPopularityWeight", "وزن أولوية الرواج", settings.discovery.manualPopularityWeight],
            ["recencyDays", "أيام الحداثة", settings.discovery.recencyDays],
          ].map(([name, label, value]) => (
            <label className="field" key={String(name)}>
              <span>{label}</span>
              <input name={String(name)} type="number" defaultValue={Number(value)} />
            </label>
          ))}
        </fieldset>
        <fieldset className="form-block">
          <legend>الظهور في البحث</legend>
          <label className="field"><span>عنوان الصفحة</span><input name="seoTitle" defaultValue={settings.seoTitle} /></label>
          <label className="field"><span>الوصف</span><textarea name="seoDescription" defaultValue={settings.seoDescription} /></label>
          <MediaPicker name="socialImageId" label="صورة المشاركة" initialId={settings.socialImageId} initialUrl={settings.socialImageUrl} library={media} />
        </fieldset>
        <fieldset className="form-block">
          <legend>التواصل</legend>
          <label className="field"><span>إنستغرام</span><input className="latin" name="instagram" defaultValue={settings.instagram} /></label>
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <label className="field"><span>اسم الرابط {index + 1}</span><input name={`socialLabel${index + 1}`} defaultValue={settings.socialLinks[index]?.label || ""} /></label>
              <label className="field"><span>الرابط {index + 1}</span><input className="latin" name={`socialUrl${index + 1}`} defaultValue={settings.socialLinks[index]?.url || ""} /></label>
            </div>
          ))}
        </fieldset>
        <SubmitButton>حفظ الإعدادات</SubmitButton>
      </form>
      <form action={passwordAction} style={{ marginTop: 18 }}>
        <fieldset className="form-block">
          <legend>كلمة مرور الإدارة</legend>
          {passwordState.error ? <p className="form-error">{passwordState.error}</p> : null}
          <label className="field"><span>الحالية</span><input className="latin" name="current" type="password" autoComplete="current-password" /></label>
          <label className="field"><span>الجديدة</span><input className="latin" name="next" type="password" autoComplete="new-password" /></label>
          <SubmitButton>تحديث كلمة المرور</SubmitButton>
        </fieldset>
      </form>
    </div>
  );
}
