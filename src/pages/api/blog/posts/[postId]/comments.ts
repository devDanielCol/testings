import type { APIRoute } from "astro";
import { getComments } from "../../../../../lib/blogger";

export const prerender = false;

const BLOGGER_BASE = "https://www.googleapis.com/blogger/v3";

export const GET: APIRoute = async ({ params, url }) => {
  try {
    const { postId } = params;
    if (!postId) {
      return new Response(JSON.stringify({ error: "Post ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const searchParams = url.searchParams;
    const maxResults = searchParams.get("maxResults") ? Number(searchParams.get("maxResults")) : 10;
    const pageToken = searchParams.get("pageToken") || undefined;

    const data = await getComments(postId, { maxResults, pageToken });
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

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { postId } = params;
    if (!postId) {
      return new Response(JSON.stringify({ error: "Post ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { content, accessToken } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Comment content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!accessToken || typeof accessToken !== "string") {
      return new Response(JSON.stringify({ error: "Authentication is required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const blogId = import.meta.env.BLOGGER_BLOG_ID;
    if (!blogId) {
      return new Response(JSON.stringify({ error: "Blog not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Post comment using the user's OAuth access token
    const res = await fetch(
      `${BLOGGER_BASE}/blogs/${blogId}/posts/${postId}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      },
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage =
        errorData?.error?.message || `Failed to post comment (${res.status})`;
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const comment = await res.json();
    return new Response(JSON.stringify(comment), {
      status: 201,
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
