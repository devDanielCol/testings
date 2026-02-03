import styles from "./BlogStyles.module.css";

interface LabelFilterProps {
  labels: string[];
  activeLabel: string | null;
  onSelect: (label: string | null) => void;
  allLabel?: string;
}

export default function LabelFilter({ labels, activeLabel, onSelect, allLabel = "All" }: LabelFilterProps) {
  if (labels.length === 0) return null;

  return (
    <div className={styles.labelBar}>
      <button
        className={`${styles.labelChip} ${activeLabel === null ? styles.labelChipActive : ""}`}
        onClick={() => onSelect(null)}
      >
        {allLabel}
      </button>
      {labels.map((label) => (
        <button
          key={label}
          className={`${styles.labelChip} ${activeLabel === label ? styles.labelChipActive : ""}`}
          onClick={() => onSelect(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
