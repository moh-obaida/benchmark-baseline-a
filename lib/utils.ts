export function id() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function str(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return value == null ? "" : String(value);
}

export function num(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (value == null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function numOrNull(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function flag(row: Record<string, unknown>, key: string) {
  return Number(row[key] ?? 0) === 1;
}

export function slugify(input: string) {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned.slice(0, 80) || "item";
}

export function normalizeArabic(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ً-ْٰ]/g, "")
    .replace(/\s+/g, " ");
}

export function likeTerm(input: string) {
  const norm = normalizeArabic(input).replace(/[\\%_]/g, "");
  return `%${norm}%`;
}

export function clamp(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return "";
  }
  return "";
}

export function safeInternalPath(value: string, fallback = "/explore") {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

export function arNumber(value: number) {
  return new Intl.NumberFormat("ar").format(value);
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(date);
}

export function readingLabel(minutes: number | null) {
  if (!minutes || minutes < 1) return "";
  if (minutes === 1) return "دقيقة واحدة";
  if (minutes === 2) return "دقيقتان";
  if (minutes <= 10) return `${arNumber(minutes)} دقائق`;
  return `${arNumber(minutes)} دقيقة`;
}

export function excerpt(text: string, max = 110) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

export function mediaUrl(mediaId: string) {
  return mediaId ? `/media/${mediaId}` : "";
}

export function parseConfig(raw: string) {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, string>;
    const config: Record<string, string> = {};
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === "string") config[key] = item;
      else if (typeof item === "number") config[key] = String(item);
    }
    return config;
  } catch {
    return {} as Record<string, string>;
  }
}

export function withinSchedule(startsAt: string, endsAt: string, at = Date.now()) {
  if (startsAt) {
    const start = new Date(startsAt).getTime();
    if (Number.isFinite(start) && at < start) return false;
  }
  if (endsAt) {
    const end = new Date(endsAt).getTime();
    if (Number.isFinite(end) && at > end) return false;
  }
  return true;
}

export function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

export function fieldList(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map((item) => String(item).trim())
    .filter(Boolean);
}
