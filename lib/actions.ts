"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAttempts,
  clearSession,
  createSession,
  ensureViewer,
  getCurrentUser,
  mergeGuestInto,
  recordAttempt,
  requireAdmin,
  tooManyAttempts,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";
import { one, run } from "@/lib/db";
import {
  createSection,
  deleteAuthor,
  deleteCategory,
  deleteDemoContent,
  deleteSection,
  deleteStory,
  logActivity,
  moveCategory,
  moveSection,
  recordStoryView,
  removeMedia,
  reorderSections,
  saveAuthor,
  saveCategory,
  saveStory,
  toggleFavorite,
  toggleSection,
  updateSection,
} from "@/lib/mutations";
import { setSetting } from "@/lib/settings";
import type { StoryInput } from "@/lib/types";
import { clamp, field, fieldList, safeHttpUrl } from "@/lib/utils";
import { id, nowIso } from "@/lib/utils";

export type FormState = { error?: string };

function refresh() {
  revalidatePath("/", "layout");
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "1" || formData.get(name) === "on";
}

function storyInput(formData: FormData): StoryInput {
  const minutes = Number(formData.get("readingMinutes"));
  const publishRaw = String(formData.get("publishAt") ?? "");
  const publishAt = publishRaw ? new Date(publishRaw).toISOString() : "";
  return {
    id: field(formData, "id", 80),
    title: field(formData, "title", 140),
    slug: field(formData, "slug", 80),
    shortDescription: field(formData, "shortDescription", 400),
    fullDescription: field(formData, "fullDescription", 8000),
    authorId: field(formData, "authorId", 80),
    coverId: field(formData, "coverId", 80),
    primaryCategoryId: field(formData, "primaryCategoryId", 80),
    categoryIds: fieldList(formData, "categoryIds"),
    tags: field(formData, "tags", 400)
      .split(/[,،]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    ageRange: field(formData, "ageRange", 40),
    storyType: field(formData, "storyType", 60),
    genre: field(formData, "genre", 60),
    readingMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.min(600, Math.round(minutes)) : null,
    featured: checked(formData, "featured"),
    editorPick: checked(formData, "editorPick"),
    published: checked(formData, "published"),
    publishAt: publishAt && !Number.isNaN(new Date(publishAt).getTime()) ? publishAt : "",
    popularity: Number(formData.get("popularity") ?? 0),
    adminNotes: field(formData, "adminNotes", 2000),
    displayOrder: Number(formData.get("displayOrder") ?? 0),
    narrator: field(formData, "narrator", 80),
    seriesName: field(formData, "seriesName", 80),
    episodeNumber: field(formData, "episodeNumber", 20),
    externalSource: field(formData, "externalSource", 300),
    audioUrl: field(formData, "audioUrl", 400),
    videoUrl: field(formData, "videoUrl", 400),
    relatedIds: fieldList(formData, "relatedIds"),
    galleryIds: fieldList(formData, "galleryIds"),
  };
}

export async function saveStoryAction(_state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const result = saveStory(storyInput(formData), admin.id);
  if ("error" in result && result.error) return { error: result.error };
  refresh();
  redirect("/admin/stories?notice=saved");
}

export async function deleteStoryAction(formData: FormData) {
  const admin = await requireAdmin();
  deleteStory(field(formData, "id", 80), admin.id);
  refresh();
  redirect("/admin/stories?notice=deleted");
}

export async function saveCategoryAction(_state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const result = saveCategory(
    {
      id: field(formData, "id", 80),
      name: field(formData, "name", 80),
      slug: field(formData, "slug", 80),
      description: field(formData, "description", 400),
      color: field(formData, "color", 40),
      icon: field(formData, "icon", 40),
      imageId: field(formData, "imageId", 80),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      published: checked(formData, "published"),
      showOnHome: checked(formData, "showOnHome"),
      showInNav: checked(formData, "showInNav"),
      featured: checked(formData, "featured"),
    },
    admin.id,
  );
  if ("error" in result && result.error) return { error: result.error };
  refresh();
  redirect("/admin/categories?notice=saved");
}

export async function deleteCategoryAction(formData: FormData) {
  const admin = await requireAdmin();
  deleteCategory(field(formData, "id", 80), admin.id);
  refresh();
  redirect("/admin/categories?notice=deleted");
}

export async function moveCategoryAction(formData: FormData) {
  await requireAdmin();
  const direction = formData.get("direction") === "down" ? "down" : "up";
  moveCategory(field(formData, "id", 80), direction);
  refresh();
}

export async function saveAuthorAction(_state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const result = saveAuthor(
    {
      id: field(formData, "id", 80),
      name: field(formData, "name", 80),
      slug: field(formData, "slug", 80),
      bio: field(formData, "bio", 2000),
      imageId: field(formData, "imageId", 80),
      featured: checked(formData, "featured"),
    },
    admin.id,
  );
  if ("error" in result && result.error) return { error: result.error };
  refresh();
  redirect("/admin/authors?notice=saved");
}

export async function deleteAuthorAction(formData: FormData) {
  const admin = await requireAdmin();
  deleteAuthor(field(formData, "id", 80), admin.id);
  refresh();
  redirect("/admin/authors?notice=deleted");
}

export async function createSectionAction(formData: FormData) {
  const admin = await requireAdmin();
  const result = createSection(field(formData, "type", 40), admin.id);
  refresh();
  redirect(`/admin/homepage?id=${"id" in result ? result.id : ""}&notice=saved`);
}

export async function updateSectionAction(_state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const starts = String(formData.get("startsAt") ?? "");
  const ends = String(formData.get("endsAt") ?? "");
  const result = updateSection(
    {
      id: field(formData, "id", 80),
      title: field(formData, "title", 80),
      subtitle: field(formData, "subtitle", 240),
      enabled: checked(formData, "enabled"),
      mode: field(formData, "mode", 20),
      itemCount: Number(formData.get("itemCount") ?? 8),
      layout: field(formData, "layout", 40),
      startsAt: starts ? new Date(starts).toISOString() : "",
      endsAt: ends ? new Date(ends).toISOString() : "",
      config: {
        kicker: field(formData, "kicker", 80),
        heading: field(formData, "heading", 140),
        lede: field(formData, "lede", 400),
        placeholder: field(formData, "placeholder", 120),
        buttonLabel: field(formData, "buttonLabel", 40),
        buttonHref: field(formData, "buttonHref", 200),
        text: field(formData, "text", 400),
        href: field(formData, "href", 400),
        label: field(formData, "label", 40),
        imageId: field(formData, "imageId", 80),
        categoryId: field(formData, "categoryId", 80),
      },
      itemIds: fieldList(formData, "itemId"),
    },
    admin.id,
  );
  if ("error" in result && result.error) return { error: result.error };
  refresh();
  redirect(`/admin/homepage?id=${field(formData, "id", 80)}&notice=saved`);
}

export async function deleteSectionAction(formData: FormData) {
  const admin = await requireAdmin();
  deleteSection(field(formData, "id", 80), admin.id);
  refresh();
  redirect("/admin/homepage?notice=deleted");
}

export async function moveSectionAction(formData: FormData) {
  await requireAdmin();
  moveSection(field(formData, "id", 80), formData.get("direction") === "down" ? "down" : "up");
  refresh();
}

export async function reorderSectionsAction(ids: string[]) {
  await requireAdmin();
  if (!Array.isArray(ids) || ids.some((item) => typeof item !== "string")) return;
  reorderSections(ids.slice(0, 40));
  refresh();
}

export async function toggleSectionAction(formData: FormData) {
  await requireAdmin();
  toggleSection(field(formData, "id", 80), formData.get("enabled") === "1");
  refresh();
}

export async function saveSettingsAction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const links = [1, 2, 3]
    .map((index) => ({
      label: field(formData, `socialLabel${index}`, 40),
      url: safeHttpUrl(field(formData, `socialUrl${index}`, 300)),
    }))
    .filter((link) => link.label && link.url);
  setSetting("site_name", field(formData, "siteName", 40) || "يراع");
  setSetting("description", field(formData, "description", 400));
  setSetting("contact_email", field(formData, "contactEmail", 120));
  setSetting("instagram", safeHttpUrl(field(formData, "instagram", 300)));
  setSetting("social_links", JSON.stringify(links));
  setSetting("seo_title", field(formData, "seoTitle", 140));
  setSetting("seo_description", field(formData, "seoDescription", 300));
  setSetting("social_image_id", field(formData, "socialImageId", 80));
  setSetting("logo_id", field(formData, "logoId", 80));
  setSetting("default_story_count", String(clamp(Number(formData.get("defaultStoryCount")), 4, 12, 8)));
  setSetting("page_size", String(clamp(Number(formData.get("pageSize")), 4, 24, 12)));
  setSetting("density", formData.get("density") === "compact" ? "compact" : "comfortable");
  setSetting(
    "discovery",
    JSON.stringify({
      viewWeight: clamp(Number(formData.get("viewWeight")), 0, 10, 1),
      favoriteWeight: clamp(Number(formData.get("favoriteWeight")), 0, 10, 3),
      manualPopularityWeight: clamp(Number(formData.get("manualPopularityWeight")), 0, 10, 1),
      recencyDays: clamp(Number(formData.get("recencyDays")), 7, 180, 45),
      categoryWeight: clamp(Number(formData.get("categoryWeight")), 0, 10, 4),
      tagWeight: clamp(Number(formData.get("tagWeight")), 0, 10, 3),
      authorWeight: clamp(Number(formData.get("authorWeight")), 0, 10, 3),
      genreWeight: clamp(Number(formData.get("genreWeight")), 0, 10, 2),
    }),
  );
  refresh();
  redirect("/admin/settings?notice=saved");
}

export async function changePasswordAction(_state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const row = one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ? AND role = 'admin'", admin.id);
  if (!row || !verifyPassword(current, row.password_hash)) return { error: "كلمة المرور الحالية غير صحيحة." };
  if (next.length < 8) return { error: "كلمة المرور الجديدة تحتاج ٨ أحرف على الأقل." };
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(next), admin.id);
  logActivity(admin.id, "تغيّرت كلمة مرور الإدارة.");
  refresh();
  redirect("/admin/settings?notice=password");
}

export async function deleteDemoAction() {
  const admin = await requireAdmin();
  deleteDemoContent(admin.id);
  refresh();
  redirect("/admin?notice=demo");
}

export async function deleteMediaAction(formData: FormData) {
  const admin = await requireAdmin();
  const result = removeMedia(field(formData, "id", 80), admin.id);
  refresh();
  redirect(`/admin/media?notice=${result && "error" in result ? "locked" : "deleted"}`);
}

export async function adminLoginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email", 120).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (tooManyAttempts(email)) return { error: "محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة." };
  const user = one<{ id: string; password_hash: string; role: string }>(
    "SELECT id, password_hash, role FROM users WHERE email = ?",
    email,
  );
  if (!user || user.role !== "admin" || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    recordAttempt(email);
    return { error: "بيانات الدخول غير صحيحة." };
  }
  clearAttempts(email);
  await clearSession();
  await createSession(user.id);
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearSession();
  redirect("/admin/login");
}

export async function signupAction(_state: FormState, formData: FormData): Promise<FormState> {
  const name = field(formData, "name", 60);
  const email = field(formData, "email", 120).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2) return { error: "اكتب اسمك." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "اكتب بريدًا صحيحًا." };
  if (password.length < 8) return { error: "كلمة المرور تحتاج ٨ أحرف على الأقل." };
  if (one("SELECT id FROM users WHERE email = ?", email)) return { error: "هذا البريد مستخدم. يمكنك الدخول به." };
  const userId = id();
  run(
    "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'reader', ?)",
    userId,
    name,
    email,
    hashPassword(password),
    nowIso(),
  );
  await mergeGuestInto(userId);
  await createSession(userId);
  redirect("/account?notice=ready");
}

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email", 120).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (tooManyAttempts(email)) return { error: "محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة." };
  const user = one<{ id: string; password_hash: string; role: string }>(
    "SELECT id, password_hash, role FROM users WHERE email = ?",
    email,
  );
  if (!user || user.role === "admin" || user.role === "guest" || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    recordAttempt(email);
    return { error: "بيانات الدخول غير صحيحة." };
  }
  clearAttempts(email);
  await mergeGuestInto(user.id);
  await clearSession();
  await createSession(user.id);
  redirect("/account?notice=ready");
}

export async function logoutAction() {
  await clearSession();
  redirect("/account");
}

export async function toggleFavoriteAction(storyId: string) {
  const userId = await ensureViewer();
  const saved = toggleFavorite(userId, storyId);
  revalidatePath("/favorites");
  return { saved };
}

export async function recordViewAction(storyId: string) {
  const userId = await ensureViewer();
  recordStoryView(userId, storyId);
}
