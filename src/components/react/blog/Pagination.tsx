import styles from "./BlogStyles.module.css";

interface PaginationProps {
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  loading?: boolean;
  previousLabel?: string;
  nextLabel?: string;
}

export default function Pagination({ hasNext, hasPrev, onNext, onPrev, loading, previousLabel = "Previous", nextLabel = "Next" }: PaginationProps) {
  if (!hasNext && !hasPrev) return null;

  return (
    <div className={styles.pagination}>
      <button
        className={styles.paginationBtn}
        onClick={onPrev}
        disabled={!hasPrev || loading}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {previousLabel}
      </button>
      <button
        className={styles.paginationBtn}
        onClick={onNext}
        disabled={!hasNext || loading}
      >
        {nextLabel}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
