import styles from "./WeekCalendar.module.css";

const days = [
  { day: "Mon", date: 24, time: "10:30", color: "#7c6fcd" },
  { day: "Tue", date: 25, time: "2:00", color: "#7c6fcd" },
  { day: "Wed", date: 26, time: "10:30", color: "#7c6fcd" },
  { day: "Thu", date: 27, time: "9:00", color: "#ef4444" },
  { day: "Fri", date: 28, time: "10:30", color: "#7c6fcd" },
  { day: "Sat", date: 29, time: null, color: null },
  { day: "Sun", date: 30, time: null, color: null },
];

export default function WeekCalendar() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>📅</span>
          <span>This Week</span>
        </div>
        <span className={styles.range}>Mar 24 – 30</span>
      </div>
      <div className={styles.grid}>
        {days.map((d) => (
          <div key={d.date} className={styles.dayCol}>
            <p className={styles.dayLabel}>{d.day}</p>
            <p className={styles.dateNum}>{d.date}</p>
            {d.time && (
              <div
                className={styles.timePill}
                style={{ background: d.color === "#ef4444" ? "#3a1a1a" : "#1e1a3a", color: d.color ?? "#7c6fcd", borderColor: d.color ?? "#7c6fcd" }}
              >
                {d.time}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}