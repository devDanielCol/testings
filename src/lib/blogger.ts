const BLOGGER_BASE = "https://www.googleapis.com/blogger/v3";

function getConfig() {
  const blogId = import.meta.env.BLOGGER_BLOG_ID;
  const apiKey = import.meta.env.BLOGGER_API_KEY;
  if (!blogId || !apiKey) {
    throw new Error("Missing BLOGGER_BLOG_ID or BLOGGER_API_KEY in environment variables");
  }
  return { blogId, apiKey };
}

// --- Types ---

export interface BloggerAuthor {
  id: string;
  displayName: string;
  url: string;
  image: { url: string };
}

export interface BloggerPost {
  id: string;
  title: string;
  content: string;
  published: string;
  updated: string;
  url: string;
  labels?: string[];
  author: BloggerAuthor;
  images?: { url: string }[];
  replies: { totalItems: string; selfLink: string };
}

export interface BloggerComment {
  id: string;
  content: string;
  published: string;
  updated: string;
  author: BloggerAuthor;
  post: { id: string };
  blog: { id: string };
}

export interface PostListResponse {
  kind: string;
  items?: BloggerPost[];
  nextPageToken?: string;
}

export interface CommentListResponse {
  kind: string;
  items?: BloggerComment[];
  nextPageToken?: string;
  prevPageToken?: string;
}

export interface BlogInfo {
  id: string;
  name: string;
  description: string;
  url: string;
  posts: { totalItems: number };
  pages: { totalItems: number };
}

// --- API Functions ---

export async function getBlog(): Promise<BlogInfo> {
  const { blogId, apiKey } = getConfig();
  const res = await fetch(`${BLOGGER_BASE}/blogs/${blogId}?key=${apiKey}`);
  if (!res.ok) throw new Error(`Failed to fetch blog: ${res.status}`);
  return res.json();
}

export interface GetPostsOptions {
  maxResults?: number;
  pageToken?: string;
  labels?: string;
  orderBy?: "published" | "updated";
  fetchBodies?: boolean;
  fetchImages?: boolean;
}

export async function getPosts(options: GetPostsOptions = {}): Promise<PostListResponse> {
  const { blogId, apiKey } = getConfig();
  const params = new URLSearchParams({ key: apiKey });

  if (options.maxResults) params.set("maxResults", String(options.maxResults));
  if (options.pageToken) params.set("pageToken", options.pageToken);
  if (options.labels) params.set("labels", options.labels);
  if (options.orderBy) params.set("orderBy", options.orderBy);
  if (options.fetchBodies !== undefined) params.set("fetchBodies", String(options.fetchBodies));
  if (options.fetchImages !== undefined) params.set("fetchImages", String(options.fetchImages));

  const res = await fetch(`${BLOGGER_BASE}/blogs/${blogId}/posts?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}

export async function getPost(postId: string): Promise<BloggerPost> {
  const { blogId, apiKey } = getConfig();
  const res = await fetch(`${BLOGGER_BASE}/blogs/${blogId}/posts/${postId}?key=${apiKey}`);
  if (!res.ok) throw new Error(`Failed to fetch post ${postId}: ${res.status}`);
  return res.json();
}

export async function searchPosts(
  query: string,
  pageToken?: string,
): Promise<PostListResponse> {
  const { blogId, apiKey } = getConfig();
  const params = new URLSearchParams({ key: apiKey, q: query });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`${BLOGGER_BASE}/blogs/${blogId}/posts/search?${params}`);
  if (!res.ok) throw new Error(`Failed to search posts: ${res.status}`);
  return res.json();
}

export interface GetCommentsOptions {
  maxResults?: number;
  pageToken?: string;
}

export async function getComments(
  postId: string,
  options: GetCommentsOptions = {},
): Promise<CommentListResponse> {
  const { blogId, apiKey } = getConfig();
  const params = new URLSearchParams({ key: apiKey });

  if (options.maxResults) params.set("maxResults", String(options.maxResults));
  if (options.pageToken) params.set("pageToken", options.pageToken);

  const res = await fetch(
    `${BLOGGER_BASE}/blogs/${blogId}/posts/${postId}/comments?${params}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch comments for post ${postId}: ${res.status}`);
  return res.json();
}

export async function getAllLabels(): Promise<string[]> {
  const labelsSet = new Set<string>();
  let pageToken: string | undefined;

  // Fetch up to 3 pages to collect labels
  for (let i = 0; i < 3; i++) {
    const response = await getPosts({
      maxResults: 100,
      pageToken,
      fetchBodies: false,
      fetchImages: false,
    });

    if (response.items) {
      for (const post of response.items) {
        if (post.labels) {
          for (const label of post.labels) {
            labelsSet.add(label);
          }
        }
      }
    }

    pageToken = response.nextPageToken;
    if (!pageToken) break;
  }

  return Array.from(labelsSet).sort();
}

// --- Utility Functions ---

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function getExcerpt(htmlContent: string, maxLength = 160): string {
  const text = stripHtml(htmlContent);
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

export function getFirstImage(post: BloggerPost): string | null {
  if (post.images && post.images.length > 0) {
    return post.images[0].url;
  }
  // Try to extract from content HTML
  const match = post.content?.match(/<img[^>]+src=["']([^"']+)["']/);
  return match ? match[1] : null;
}

export function getReadingTime(htmlContent: string): number {
  const text = stripHtml(htmlContent);
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatDate(dateString: string, locale: string = "es-ES"): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
