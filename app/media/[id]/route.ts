import fs from "fs/promises";
import path from "path";
import { getMedia } from "@/lib/content";
import { uploadsDir } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const media = getMedia(id);
  if (!media || !/^[\w.-]+$/.test(media.filename)) return new Response("Not found", { status: 404 });
  const root = path.resolve(uploadsDir());
  const file = path.resolve(root, media.filename);
  if (!file.startsWith(root)) return new Response("Not found", { status: 404 });
  try {
    const body = await fs.readFile(file);
    return new Response(body, {
      headers: {
        "Content-Type": media.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
