import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./BlogStyles.module.css";

interface Comment {
  id: string;
  content: string;
  published: string;
  author: {
    displayName: string;
    image?: { url: string };
  };
}

interface GoogleUser {
  name: string;
  picture: string;
  accessToken: string;
}

interface CommentTranslations {
  title: string;
  signIn: string;
  signingIn: string;
  signOut: string;
  placeholder: string;
  posting: string;
  post: string;
  posted: string;
  failed: string;
  empty: string;
  loadMore: string;
  loading: string;
}

const defaultTranslations: CommentTranslations = {
  title: "Comentarios",
  signIn: "Inicia sesión con Google para comentar",
  signingIn: "Iniciando sesión...",
  signOut: "Cerrar sesión",
  placeholder: "Escribe un comentario...",
  posting: "Publicando...",
  post: "Publicar comentario",
  posted: "¡Comentario publicado!",
  failed: "Error al publicar el comentario",
  empty: "Aún no hay comentarios. ¡Sé el primero en compartir tus ideas!",
  loadMore: "Cargar más comentarios",
  loading: "Cargando...",
};

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  initialPageToken?: string;
  totalItems?: string;
  googleClientId?: string;
  translations?: CommentTranslations;
  locale?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

function formatDate(dateString: string, locale: string = "es-ES"): string {
  return new Date(dateString).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CommentSection({
  postId,
  initialComments,
  initialPageToken,
  totalItems,
  googleClientId,
  translations = defaultTranslations,
  locale = "es-ES",
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [pageToken, setPageToken] = useState<string | undefined>(initialPageToken);
  const [loading, setLoading] = useState(false);

  // Auth state
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null);

  // Comment form state
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!googleClientId) return;

    const initGIS = () => {
      if (!window.google?.accounts?.oauth2) return;

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: "https://www.googleapis.com/auth/blogger",
        callback: (response) => {
          setAuthLoading(false);
          if (response.error) {
            console.error("OAuth error:", response.error);
            return;
          }
          if (response.access_token) {
            // Fetch user info with the token
            fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${response.access_token}` },
            })
              .then((res) => res.json())
              .then((info) => {
                setUser({
                  name: info.name || "User",
                  picture: info.picture || "",
                  accessToken: response.access_token!,
                });
              })
              .catch(() => {
                setUser({
                  name: "User",
                  picture: "",
                  accessToken: response.access_token!,
                });
              });
          }
        },
      });
    };

    // Wait for the GIS script to load
    if (window.google?.accounts?.oauth2) {
      initGIS();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          initGIS();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

  const handleSignIn = useCallback(() => {
    if (!tokenClientRef.current) return;
    setAuthLoading(true);
    tokenClientRef.current.requestAccessToken();
  }, []);

  const handleSignOut = useCallback(() => {
    setUser(null);
    setCommentText("");
    setSubmitError(null);
  }, []);

  const handleSubmitComment = useCallback(async () => {
    if (!user || !commentText.trim() || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch(`/api/blog/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText.trim(),
          accessToken: user.accessToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post comment");
      }

      const newComment = await res.json();
      setComments((prev) => [
        {
          id: newComment.id,
          content: newComment.content,
          published: newComment.published || new Date().toISOString(),
          author: {
            displayName: user.name,
            image: user.picture ? { url: user.picture } : undefined,
          },
        },
        ...prev,
      ]);
      setCommentText("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : translations.failed);
    } finally {
      setSubmitting(false);
    }
  }, [user, commentText, submitting, postId]);

  const loadMore = async () => {
    if (!pageToken || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ maxResults: "10" });
      if (pageToken) params.set("pageToken", pageToken);

      const res = await fetch(`/api/blog/posts/${postId}/comments?${params}`);
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();

      setComments((prev) => [...prev, ...(data.items || [])]);
      setPageToken(data.nextPageToken);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.comments}>
      <div className={styles.commentsHeader}>
        <svg
          className={styles.commentsIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h3 className={styles.commentsTitle}>{translations.title}</h3>
        {totalItems && (
          <span className={styles.commentsCount}>({totalItems})</span>
        )}
      </div>

      {/* Comment Form */}
      {googleClientId && (
        <div className={styles.commentForm}>
          {!user ? (
            <button
              className={styles.googleSignInBtn}
              onClick={handleSignIn}
              disabled={authLoading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {authLoading ? translations.signingIn : translations.signIn}
            </button>
          ) : (
            <div className={styles.commentFormInner}>
              <div className={styles.commentFormUser}>
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className={styles.commentFormAvatar}
                  />
                )}
                <span className={styles.commentFormName}>{user.name}</span>
                <button
                  className={styles.signOutBtn}
                  onClick={handleSignOut}
                >
                  {translations.signOut}
                </button>
              </div>
              <textarea
                className={styles.commentTextarea}
                placeholder={translations.placeholder}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                maxLength={4096}
              />
              {submitError && (
                <div className={styles.commentError}>{submitError}</div>
              )}
              {submitSuccess && (
                <div className={styles.commentSuccess}>{translations.posted}</div>
              )}
              <button
                className={styles.commentSubmitBtn}
                onClick={handleSubmitComment}
                disabled={submitting || !commentText.trim()}
              >
                {submitting ? translations.posting : translations.post}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className={styles.commentsEmpty}>
          {translations.empty}
        </div>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className={styles.commentItem}>
            <div className={styles.commentHeader}>
              {comment.author.image?.url && (
                <img
                  src={comment.author.image.url}
                  alt={comment.author.displayName}
                  className={styles.commentAvatar}
                />
              )}
              <div>
                <div className={styles.commentAuthorName}>
                  {comment.author.displayName}
                </div>
                <div className={styles.commentDate}>
                  {formatDate(comment.published, locale)}
                </div>
              </div>
            </div>
            <div
              className={styles.commentContent}
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          </div>
        ))
      )}

      {pageToken && (
        <button
          className={styles.loadMoreBtn}
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? translations.loading : translations.loadMore}
        </button>
      )}
    </div>
  );
}
