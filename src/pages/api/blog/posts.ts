import type { APIRoute } from "astro";
import { getPosts, searchPosts } from "../../../lib/blogger";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const params = url.searchParams;
    const q = params.get("q");
    const maxResults = params.get("maxResults") ? Number(params.get("maxResults")) : 9;
    const pageToken = params.get("pageToken") || undefined;
    const labels = params.get("labels") || undefined;
    const orderBy = (params.get("orderBy") as "published" | "updated") || "published";

    let data;
    if (q) {
      data = await searchPosts(q, pageToken);
    } else {
      data = await getPosts({ maxResults, pageToken, labels, orderBy });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
