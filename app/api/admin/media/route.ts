import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import { uploadsDir } from "@/lib/db";
import { run } from "@/lib/db";
import { id, nowIso } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return Response.json({ error: "الطلب غير مقبول" }, { status: 403 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "اختر صورة." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "الصورة أكبر من ٥ ميغابايت." }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  let image;
  try {
    image = sharp(buffer, { failOn: "error" }).rotate();
  } catch {
    return Response.json({ error: "الملف ليس صورة صالحة." }, { status: 400 });
  }
  const meta = await image.metadata();
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format) || !meta.width || !meta.height) {
    return Response.json({ error: "الصيغ المسموحة: JPG وPNG وWEBP." }, { status: 400 });
  }
  const shortSide = Math.min(meta.width, meta.height);
  const longSide = Math.max(meta.width, meta.height);
  if (shortSide < 200 || longSide < 400) {
    return Response.json({ error: "الصورة أصغر من المطلوب. الحد الأدنى ٢٠٠ في أقصر ضلع و٤٠٠ في الأطول." }, { status: 400 });
  }
  const output = await image.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const info = await sharp(output).metadata();
  const mediaId = id();
  const filename = `${mediaId}.webp`;
  await fs.mkdir(uploadsDir(), { recursive: true });
  await fs.writeFile(path.join(uploadsDir(), filename), output);
  const alt = String(form.get("alt") ?? "").trim().slice(0, 160);
  run(
    `INSERT INTO media (id, filename, original_name, mime, size, width, height, alt, is_demo, created_at)
     VALUES (?, ?, ?, 'image/webp', ?, ?, ?, ?, 0, ?)`,
    mediaId,
    filename,
    file.name.slice(0, 180),
    output.length,
    info.width ?? meta.width,
    info.height ?? meta.height,
    alt,
    nowIso(),
  );
  return Response.json({ id: mediaId, url: `/media/${mediaId}`, width: info.width, height: info.height });
}
