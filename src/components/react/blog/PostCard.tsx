import styles from "./BlogStyles.module.css";

interface PostCardPost {
  id: string;
  title: string;
  content: string;
  published: string;
  labels?: string[];
  author: {
    displayName: string;
    image?: { url: string };
  };
  images?: { url: string }[];
  replies?: { totalItems: string };
}

interface PostCardProps {
  post: PostCardPost;
  locale?: string;
  blogBasePath?: string;
  minLabel?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function getExcerpt(html: string, max = 140): string {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "...";
}

function getFirstImage(post: PostCardPost): string | null {
  if (post.images && post.images.length > 0) return post.images[0].url;
  const match = post.content?.match(/<img[^>]+src=["']([^"']+)["']/);
  return match ? match[1] : null;
}

function formatDate(dateString: string, locale: string = "es-ES"): string {
  return new Date(dateString).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getReadingTime(html: string): number {
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function PostCard({ post, locale = "es-ES", blogBasePath = "/blog", minLabel = "min" }: PostCardProps) {
  const image = getFirstImage(post);
  const excerpt = getExcerpt(post.content);
  const commentCount = post.replies?.totalItems || "0";
  const readTime = getReadingTime(post.content);

  return (
    <a href={`${blogBasePath}/${post.id}`} className={styles.card}>
      {image ? (
        <img src={image} alt={post.title} className={styles.cardImage} loading="lazy" />
      ) : (
        <div className={styles.cardImagePlaceholder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      )}
      <div className={styles.cardBody}>
        {post.labels && post.labels.length > 0 && (
          <div className={styles.cardLabels}>
            {post.labels.slice(0, 3).map((label) => (
              <span key={label} className={styles.cardLabel}>
                {label}
              </span>
            ))}
          </div>
        )}
        <h3 className={styles.cardTitle}>{post.title}</h3>
        <p className={styles.cardExcerpt}>{excerpt}</p>
        <div className={styles.cardMeta}>
          <div className={styles.cardAuthor}>
            {post.author.image?.url && (
              <img
                src={post.author.image.url}
                alt={post.author.displayName}
                className={styles.cardAvatar}
              />
            )}
            <span>{post.author.displayName}</span>
          </div>
          <div className={styles.cardStats}>
            <span className={styles.cardStat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {readTime} {minLabel}
            </span>
            <span className={styles.cardStat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {commentCount}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
