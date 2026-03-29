import type { Task } from "../types/Task";
import styles from "./TaskTable.module.css";

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  Lab:        { bg: "#1a1a3a", color: "#818cf8" },
  Quiz:       { bg: "#1a2a1a", color: "#34d399" },
  Assignment: { bg: "#2a1a00", color: "#f59e0b" },
  Exam:       { bg: "#2a1a1a", color: "#f472b6" },
  Midterm:    { bg: "#2a1a1a", color: "#f472b6" },
  "Final Exam": { bg: "#2a1a1a", color: "#f472b6" },
};

function formatDueDate(due_date: string, due_time?: string | null): string {
  if (!due_date || due_date === "TBD") return "TBD";
  const [year, month, day] = due_date.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (due_time && due_time !== "null" && due_time.includes(":")) {
    const [h, m] = due_time.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 || 12;
      return `${dateStr} at ${hour}:${String(m).padStart(2, "0")} ${ampm}`;
    }
  }
  return dateStr;
}

function isOverdue(due_date: string, due_time?: string | null): boolean {
  if (!due_date || due_date === "TBD") return false;
  const [year, month, day] = due_date.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  if (due_time && due_time !== "null" && due_time.includes(":")) {
    const [h, m] = due_time.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      due.setHours(h, m, 0, 0);
    } else {
      due.setHours(23, 59, 59, 999);
    }
  } else {
    due.setHours(23, 59, 59, 999);
  }
  return due < new Date();
}

interface TaskTableProps {
  tasks: Task[];
  onToggle: (id: number) => void;
}

export default function TaskTable({ tasks, onToggle }: TaskTableProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>Status</th>
          <th className={styles.th}>Task Name</th>
          <th className={styles.th}>Type</th>
          <th className={styles.th}>Due Date ✦</th>
          <th className={styles.th}>Weight ✦</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
          const typeStyle = TYPE_COLORS[task.type] ?? TYPE_COLORS.Assignment;
          const overdue = !task.completed && isOverdue(task.due_date, task.due_time);
          const strike = task.completed || overdue;
          return (
            <tr
              key={task.id}
              className={`${styles.row} ${overdue && !task.completed ? styles.overdueRow : ""} ${task.completed ? styles.completedRow : ""}`}
            >
              <td className={styles.td}>
                <button
                  className={`${styles.checkbox} ${task.completed ? styles.checked : ""}`}
                  onClick={() => onToggle(task.id)}
                  aria-label="Toggle task"
                />
              </td>
              <td className={`${styles.td} ${styles.taskName} ${strike ? styles.strikethrough : ""}`}>
                {task.title}
                {overdue && !task.completed && (
                  <span className={styles.overdueTag}>Overdue</span>
                )}
                {task.completed && (
                  <span className={styles.completedTag}>Complete</span>
                )}
              </td>
              <td className={styles.td}>
                <span
                  className={styles.badge}
                  style={{ background: typeStyle.bg, color: typeStyle.color, borderColor: typeStyle.color }}
                >
                  {task.type}
                </span>
              </td>
              <td className={styles.td}>
                <span className={`${styles.dueDate} ${overdue && !task.completed ? styles.overdueDate : ""} ${task.completed ? styles.completedDate : ""}`}>
                  ⏱ {formatDueDate(task.due_date, task.due_time)}
                </span>
              </td>
              <td className={styles.td}>
                <span className={styles.weight}>{task.weight}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}