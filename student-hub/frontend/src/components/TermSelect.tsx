import styles from "./TermSelect.module.css";

export type Term = "fall" | "winter" | "spring-summer";

interface TermSelectProps {
  selectedTerm: Term | null;
  onSelect: (term: Term) => void;
}

const TERMS: { value: Term; label: string; icon: string; months: string }[] = [
  { value: "fall", label: "Fall", icon: "🍂", months: "Sep – Dec" },
  { value: "winter", label: "Winter", icon: "❄️", months: "Jan – Apr" },
  { value: "spring-summer", label: "Spring / Summer", icon: "☀️", months: "May – Aug" },
];

export default function TermSelect({ selectedTerm, onSelect }: TermSelectProps) {
  return (
    <div className={styles.termGrid}>
      {TERMS.map(t => (
        <button
          key={t.value}
          className={`${styles.termCard} ${selectedTerm === t.value ? styles.active : ""}`}
          onClick={() => onSelect(t.value)}
        >
          <span className={styles.termIcon}>{t.icon}</span>
          <span className={styles.termLabel}>{t.label}</span>
          <span className={styles.termMonths}>{t.months}</span>
        </button>
      ))}
    </div>
  );
}
