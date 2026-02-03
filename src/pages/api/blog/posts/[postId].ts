import type { APIRoute } from "astro";
import { getPost } from "../../../../lib/blogger";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { postId } = params;
    if (!postId) {
      return new Response(JSON.stringify({ error: "Post ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const post = await getPost(postId);
    return new Response(JSON.stringify(post), {
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
