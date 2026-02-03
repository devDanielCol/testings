import { useState, useCallback } from "react";
import BlogSearch from "./BlogSearch";
import LabelFilter from "./LabelFilter";
import PostCard from "./PostCard";
import Pagination from "./Pagination";
import styles from "./BlogStyles.module.css";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  published: string;
  updated: string;
  url: string;
  labels?: string[];
  author: {
    id: string;
    displayName: string;
    url: string;
    image: { url: string };
  };
  images?: { url: string }[];
  replies: { totalItems: string; selfLink: string };
}

interface BlogExplorerTranslations {
  searchPlaceholder: string;
  filterAll: string;
  paginationPrevious: string;
  paginationNext: string;
  emptyNoPostsFound: string;
  emptyNoPostsYet: string;
  emptyTryDifferent: string;
  emptyCheckBackLater: string;
  minLabel: string;
}

const defaultTranslations: BlogExplorerTranslations = {
  searchPlaceholder: "Buscar publicaciones...",
  filterAll: "Todos",
  paginationPrevious: "Anterior",
  paginationNext: "Siguiente",
  emptyNoPostsFound: "No se encontraron publicaciones",
  emptyNoPostsYet: "Aún no hay publicaciones",
  emptyTryDifferent: "Intenta una búsqueda o filtro diferente",
  emptyCheckBackLater: "Vuelve pronto para nuevo contenido",
  minLabel: "min",
};

interface BlogExplorerProps {
  initialPosts: BlogPost[];
  initialLabels: string[];
  initialPageToken?: string;
  translations?: BlogExplorerTranslations;
  blogBasePath?: string;
  locale?: string;
}

export default function BlogExplorer({
  initialPosts,
  initialLabels,
  initialPageToken,
  translations = defaultTranslations,
  blogBasePath = "/blog",
  locale = "es-ES",
}: BlogExplorerProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [pageToken, setPageToken] = useState<string | undefined>(initialPageToken);
  const [pageHistory, setPageHistory] = useState<string[]>([]);

  const fetchPosts = useCallback(
    async (options: {
      q?: string;
      labels?: string;
      pageToken?: string;
    }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("maxResults", "9");
        if (options.q) params.set("q", options.q);
        if (options.labels) params.set("labels", options.labels);
        if (options.pageToken) params.set("pageToken", options.pageToken);

        const res = await fetch(`/api/blog/posts?${params}`);
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();

        setPosts(data.items || []);
        setPageToken(data.nextPageToken);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setPosts([]);
        setPageToken(undefined);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setPageHistory([]);
      fetchPosts({ q: query || undefined, labels: activeLabel || undefined });
    },
    [activeLabel, fetchPosts],
  );

  const handleLabelSelect = useCallback(
    (label: string | null) => {
      setActiveLabel(label);
      setPageHistory([]);
      fetchPosts({ q: searchQuery || undefined, labels: label || undefined });
    },
    [searchQuery, fetchPosts],
  );

  const handleNextPage = useCallback(() => {
    if (!pageToken) return;
    setPageHistory((prev) => [...prev, pageToken!]);
    fetchPosts({
      q: searchQuery || undefined,
      labels: activeLabel || undefined,
      pageToken,
    });
  }, [pageToken, searchQuery, activeLabel, fetchPosts]);

  const handlePrevPage = useCallback(() => {
    const prevTokens = [...pageHistory];
    prevTokens.pop();
    const prevToken = prevTokens[prevTokens.length - 1];
    setPageHistory(prevTokens);
    fetchPosts({
      q: searchQuery || undefined,
      labels: activeLabel || undefined,
      pageToken: prevToken,
    });
  }, [pageHistory, searchQuery, activeLabel, fetchPosts]);

  return (
    <div className={styles.explorer}>
      <div className={styles.controls}>
        <BlogSearch onSearch={handleSearch} placeholder={translations.searchPlaceholder} />
        <LabelFilter
          labels={initialLabels}
          activeLabel={activeLabel}
          onSelect={handleLabelSelect}
          allLabel={translations.filterAll}
        />
      </div>

      <div className={`${styles.grid} ${loading ? styles.loadingOverlay : ""}`}>
        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} locale={locale} blogBasePath={blogBasePath} minLabel={translations.minLabel} />)
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                width="48"
                height="48"
                style={{ opacity: 0.3 }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
            <p className={styles.emptyTitle}>
              {searchQuery || activeLabel ? translations.emptyNoPostsFound : translations.emptyNoPostsYet}
            </p>
            <p className={styles.emptyText}>
              {searchQuery || activeLabel
                ? translations.emptyTryDifferent
                : translations.emptyCheckBackLater}
            </p>
          </div>
        )}
      </div>

      <Pagination
        hasNext={!!pageToken}
        hasPrev={pageHistory.length > 0}
        onNext={handleNextPage}
        onPrev={handlePrevPage}
        loading={loading}
        previousLabel={translations.paginationPrevious}
        nextLabel={translations.paginationNext}
      />
    </div>
  );
}
