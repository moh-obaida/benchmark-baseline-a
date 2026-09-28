import { suggestStories } from "@/lib/content";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ results: [] });
  const results = suggestStories(query).map((story) => ({
    slug: story.slug,
    title: story.title,
    authorName: story.authorName,
  }));
  return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
