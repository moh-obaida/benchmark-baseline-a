import { all, run } from "@/lib/db";
import type { DiscoverySettings, SiteSettings, SocialLink } from "@/lib/types";
import { clamp, mediaUrl, safeHttpUrl } from "@/lib/utils";

export const DEFAULT_DISCOVERY: DiscoverySettings = {
  viewWeight: 1,
  favoriteWeight: 3,
  manualPopularityWeight: 1,
  recencyDays: 45,
  categoryWeight: 4,
  tagWeight: 3,
  authorWeight: 3,
  genreWeight: 2,
};

const DEFAULTS: Record<string, string> = {
  site_name: "يراع",
  description: "مكان مريح تكتشف فيه قصتك القادمة.",
  contact_email: "",
  instagram: "",
  social_links: "[]",
  seo_title: "يراع — اكتشف قصتك القادمة",
  seo_description: "يراع منصة هادئة لاكتشاف القصص والروايات: تصنيفات واضحة، بحث سهل، واقتراحات مبنية على ما يناسبك.",
  social_image_id: "",
  logo_id: "",
  default_story_count: "8",
  page_size: "12",
  density: "comfortable",
  discovery: JSON.stringify(DEFAULT_DISCOVERY),
  seeded: "0",
};

function readMap() {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return (key: string) => map.get(key) ?? DEFAULTS[key] ?? "";
}

function parseLinks(raw: string): SocialLink[] {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const label = "label" in item ? String(item.label ?? "").trim() : "";
        const url = "url" in item ? safeHttpUrl(String(item.url ?? "")) : "";
        if (!label || !url) return null;
        return { label, url };
      })
      .filter((item): item is SocialLink => Boolean(item))
      .slice(0, 6);
  } catch {
    return [];
  }
}

function parseDiscovery(raw: string): DiscoverySettings {
  try {
    const value = JSON.parse(raw) as Partial<DiscoverySettings>;
    return {
      viewWeight: clamp(Number(value.viewWeight), 0, 10, DEFAULT_DISCOVERY.viewWeight),
      favoriteWeight: clamp(Number(value.favoriteWeight), 0, 10, DEFAULT_DISCOVERY.favoriteWeight),
      manualPopularityWeight: clamp(Number(value.manualPopularityWeight), 0, 10, DEFAULT_DISCOVERY.manualPopularityWeight),
      recencyDays: clamp(Number(value.recencyDays), 7, 180, DEFAULT_DISCOVERY.recencyDays),
      categoryWeight: clamp(Number(value.categoryWeight), 0, 10, DEFAULT_DISCOVERY.categoryWeight),
      tagWeight: clamp(Number(value.tagWeight), 0, 10, DEFAULT_DISCOVERY.tagWeight),
      authorWeight: clamp(Number(value.authorWeight), 0, 10, DEFAULT_DISCOVERY.authorWeight),
      genreWeight: clamp(Number(value.genreWeight), 0, 10, DEFAULT_DISCOVERY.genreWeight),
    };
  } catch {
    return DEFAULT_DISCOVERY;
  }
}

export function getSettings(): SiteSettings {
  const get = readMap();
  const socialImageId = get("social_image_id");
  const logoId = get("logo_id");
  const density = get("density") === "compact" ? "compact" : "comfortable";
  return {
    siteName: get("site_name") || "يراع",
    description: get("description"),
    contactEmail: get("contact_email"),
    instagram: safeHttpUrl(get("instagram")),
    socialLinks: parseLinks(get("social_links")),
    seoTitle: get("seo_title"),
    seoDescription: get("seo_description"),
    socialImageId,
    socialImageUrl: mediaUrl(socialImageId),
    logoId,
    logoUrl: mediaUrl(logoId),
    defaultStoryCount: clamp(Number(get("default_story_count")), 4, 12, 8),
    pageSize: clamp(Number(get("page_size")), 4, 24, 12),
    density,
    discovery: parseDiscovery(get("discovery")),
  };
}

export function setSetting(key: string, value: string) {
  run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}

export function ensureDefaultSettings() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", key, value);
  }
}
